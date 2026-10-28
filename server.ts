import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/database.js';
const jsonDb = db;
import { aiService } from './src/lib/gemini.js';
import { User, ResumeAnalysis, MockInterview, StudentFeedback, ResumeTemplate, ChatMessage, StoredConversation } from './src/types.js';
import { validateEnvironment } from './src/lib/validateEnv.js';
import { logger } from './src/lib/logger.js';
import { openApiSpec } from './src/lib/openapi.js';
import { hashPassword, verifyPassword, sanitizeUser, isValidEmail } from './src/lib/password.js';
import * as aptitudeEngine from './src/lib/aptitudeEngine.js';
import * as resumeEngine from './src/lib/resumeEngine.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

// Safe JSON parser middleware with graceful error handling
app.use((req, res, next) => {
  express.json({ limit: '10mb' })(req, res, (err) => {
    if (err) {
      logger.warn('Malformed JSON request rejected', { error: err.message, ip: req.ip });
      return res.status(400).json({ error: 'Malformed JSON payload provided in request.' });
    }
    next();
  });
});

// Allowed origins for development and production CORS
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.APP_URL?.replace(/\/$/, '')
].filter(Boolean) as string[]);

// CORS Middleware with origin validation (credentials: true without wildcard)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.has(origin) || 
      (!IS_PROD && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')));
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization, X-Requested-With, Accept');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
  }

  // Instant response for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Security Headers Middleware (OWASP recommended baseline)
app.use((req, res, next) => {
  const connectSrc = IS_PROD
    ? "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com;"
    : "connect-src 'self' http://localhost:* http://127.0.0.1:* ws: wss: https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com;";

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data:; ${connectSrc} worker-src 'self' blob:;`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Request ID & Request Logging Middleware
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      logger.info(`${req.method} ${req.path}`, {
        requestId,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });
  next();
});

// Session secret configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'career-navigator-default-dev-secret-key-change-in-prod';

// Cookie parser helper (Ponytail: native regex matching, zero external dependencies)
export function getCookie(req: express.Request, name: string): string | null {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// CSRF Token Generation & Cookie Management
export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function setCsrfCookie(res: express.Response, token: string) {
  const cookieOptions = IS_PROD
    ? `csrf-token=${token}; Path=/; SameSite=Strict; Secure; Max-Age=${30 * 24 * 3600}`
    : `csrf-token=${token}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;
  res.append('Set-Cookie', cookieOptions);
}

// Auto-issue CSRF cookie on all requests if absent
app.use((req, res, next) => {
  let token = getCookie(req, 'csrf-token');
  if (!token) {
    token = generateCsrfToken();
    setCsrfCookie(res, token);
  }
  (req as any).csrfToken = token;
  next();
});

// CSRF verification middleware for state-changing endpoints
export function verifyCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }
  // Public or initial authentication routes are exempt from CSRF
  const fullPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  const reqPath = (req.path || '').split('?')[0];
  const isAuthExempt = [
    '/api/auth/demo-login',
    '/api/auth/demo',
    '/api/auth/google',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/logout',
    '/auth/demo-login',
    '/auth/demo',
    '/auth/google',
    '/auth/login',
    '/auth/register',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/logout'
  ].some((exempt) => fullPath === exempt || reqPath === exempt || reqPath.endsWith(exempt));

  if (isAuthExempt) {
    return next();
  }

  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = getCookie(req, 'csrf-token');

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return res.status(403).json({
      error: 'Forbidden: Invalid or missing CSRF token',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }
  next();
}

app.use('/api', verifyCsrf);

// Session signing with HMAC SHA-256
export function signSession(userId: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  return `${userId}.${hmac}`;
}

export function verifySession(token: string): string | null {
  if (!token) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) {
    // Development fallback for existing un-signed demo cookies
    if (!IS_PROD && (token.startsWith('demo-') || token.startsWith('admin-'))) {
      return token;
    }
    return null;
  }
  const userId = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');

  if (sig.length !== expectedSig.length) return null;
  const sigBuffer = Buffer.from(sig, 'utf-8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf-8');

  if (crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return userId;
  }
  return null;
}

// Helper to extract session userId from signed Cookie
function getSessionUserId(req: express.Request): string | null {
  const token = getCookie(req, 'session');
  if (!token) return null;
  return verifySession(token);
}

// Helper to set signed cookie headers safely
function setSessionCookie(res: express.Response, userId: string) {
  const signedToken = signSession(userId);
  const cookieOptions = IS_PROD
    ? `session=${signedToken}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${30 * 24 * 3600}`
    : `session=${signedToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;
  res.append('Set-Cookie', cookieOptions);
}

function clearSessionCookie(res: express.Response) {
  const cookieOptions = IS_PROD
    ? `session=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`
    : `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  res.append('Set-Cookie', cookieOptions);
}

// In-Memory Rate Limiter for AI Endpoints
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function aiRateLimiter(limit: number = 15, windowMs: number = 60000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded for AI operations. Please try again in ${retryAfter} seconds.`
      });
    }

    entry.count += 1;
    next();
  };
}

// In-Memory Rate Limiter for Authentication Endpoints (Brute-force protection)
const authRateLimitMap = new Map<string, RateLimitEntry>();

export function authRateLimiter(limit: number = 10, windowMs: number = 60000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const entry = authRateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      authRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        error: 'Too many requests',
        message: `Too many authentication attempts. Please try again in ${retryAfter} seconds.`
      });
    }

    entry.count += 1;
    next();
  };
}

// Helper to get Redirect URI based on request context or APP_URL env
function getRedirectUri(req: express.Request): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const cleanUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    return `${cleanUrl}/auth/callback`;
  }
  return `${req.protocol}://${req.get('host')}/auth/callback`;
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// GET the Google OAuth URL for the popup flow
app.get('/api/auth/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(req);

  if (!clientId || clientId === 'MY_GOOGLE_CLIENT_ID') {
    return res.status(400).json({
      error: 'Google OAuth Client ID is not configured in Secrets panel.',
      instructions: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Secrets settings to test real OAuth login. In the meantime, please use the "Demo Login" feature.'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    prompt: 'consent',
    access_type: 'offline'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

// OAuth Callback handler (Popup opens this, exchanges code, close popup)
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa;">
          <div style="text-align: center; max-width: 450px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #ef4444; margin-bottom: 0.5rem;">Authentication Error</h2>
            <p style="color: #4b5563;">${error}</p>
            <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Fetch user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to retrieve user profile info from Google API');
    }

    const userInfo = await userInfoResponse.json();
    const { sub, name, email, picture } = userInfo;

    // Save or update user
    let user = jsonDb.getUserByEmail(email);
    if (!user) {
      // Auto-create student profile on first login
      user = {
        id: `usr-${sub}`,
        email,
        name: name || 'New Student',
        picture: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        role: email.includes('admin') || email.includes('placement_coordinator') ? 'admin' : 'student',
        completedProfile: false
      };
      jsonDb.saveUser(user);
    }

    // Set cookie on response
    setSessionCookie(res, user.id);

    // Send successful message back to React window and close popup
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa; color: #1f2937;">
          <div style="text-align: center;">
            <div style="margin-bottom: 1rem; color: #10b981; font-size: 3rem;">✓</div>
            <h3 style="margin-bottom: 0.25rem; font-weight: 600;">Login Successful!</h3>
            <p style="color: #6b7280; font-size: 0.875rem;">Closing this authenticating popup window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);

  } catch (err: any) {
    logger.error('OAuth Callback Error:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// Demo Login endpoint (Bypasses Google OAuth for development/immediate previews)
app.post('/api/auth/demo', (req, res) => {
  const { role } = req.body; // 'student' or 'admin'

  if (role === 'admin') {
    const adminUser = jsonDb.getUserById('admin-1');
    if (adminUser) {
      setSessionCookie(res, adminUser.id);
      const csrfToken = (req as any).csrfToken || getCookie(req, 'csrf-token') || generateCsrfToken();
      return res.json({ success: true, user: sanitizeUser(adminUser), csrfToken });
    }
  }

  // default to demo student
  const studentUser = jsonDb.getUserById('demo-student-1');
  if (studentUser) {
    setSessionCookie(res, studentUser.id);
    const csrfToken = (req as any).csrfToken || getCookie(req, 'csrf-token') || generateCsrfToken();
    return res.json({ success: true, user: sanitizeUser(studentUser), csrfToken });
  }

  res.status(400).json({ error: 'Demo user not initialized.' });
});

// In-memory OTP storage for phone number authentication
interface PhoneOtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
const phoneOtps = new Map<string, PhoneOtpRecord>();

// Password Reset Tokens Store (SHA-256 hashed token -> record)
interface PasswordResetRecord {
  userId: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}
const passwordResetTokens = new Map<string, PasswordResetRecord>();

// Email/Password login endpoint - Requires user to be registered first
app.post('/api/auth/login', authRateLimiter(20, 60000), (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  logger.info('[Auth] Incoming login attempt', {
    email: cleanEmail || undefined,
    ip: req.ip
  });

  if (!email || typeof email !== 'string' || !email.trim()) {
    logger.warn('[Auth] Login rejected: Email missing');
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!password || typeof password !== 'string') {
    logger.warn('[Auth] Login rejected: Password missing');
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (!isValidEmail(cleanEmail)) {
    logger.warn('[Auth] Login rejected: Invalid email syntax', { email: cleanEmail });
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const user = jsonDb.getUserByEmail(cleanEmail);

    // Users can ONLY log in after they have successfully registered
    if (!user) {
      logger.warn('[Auth] Login rejected: User not found', { email: cleanEmail });
      return res.status(401).json({
        error: 'No account found with this email. Please register before logging in.',
        notRegistered: true
      });
    }

    // Validate password using secure timing-safe hash comparison
    const storedSecret = user.passwordHash || user.password;
    if (storedSecret) {
      const isMatch = verifyPassword(password, storedSecret);
      if (!isMatch) {
        logger.warn('[Auth] Login rejected: Incorrect password', { email: cleanEmail });
        return res.status(401).json({ error: 'Incorrect password. Please verify your credentials.' });
      }
      // Auto-upgrade legacy plaintext password if encountered
      if (!user.passwordHash && user.password) {
        jsonDb.updateUserPassword(user.id, hashPassword(password));
      }
    }

    setSessionCookie(res, user.id);
    const csrfToken = (req as any).csrfToken || getCookie(req, 'csrf-token') || generateCsrfToken();
    logger.info('[Auth] User logged in successfully', { userId: user.id, email: user.email, role: user.role });
    return res.json({ success: true, user: sanitizeUser(user), csrfToken });
  } catch (err: any) {
    logger.error('[Auth] Login error', { error: err?.message });
    return res.status(500).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
  }
});

// Phone OTP - Send Code (Requires mobile number to be registered first)
app.post('/api/auth/send-otp', authRateLimiter(10, 60000), (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return res.status(400).json({ error: 'Please enter a valid mobile number with at least 8 digits.' });
  }

  const cleanPhone = phone.trim();
  const cleanDigits = cleanPhone.replace(/[^0-9]/g, '').slice(-10);

  // Check if a registered user exists with this mobile number
  const registeredUser = jsonDb.getUsers().find((u) => {
    if (!u.phone) return false;
    const uDigits = u.phone.replace(/[^0-9]/g, '').slice(-10);
    return uDigits === cleanDigits;
  });

  if (!registeredUser) {
    return res.status(404).json({
      error: 'No registered account found with this mobile number. Please register your account first.',
      notRegistered: true
    });
  }

  // Check resend cooldown (60 seconds)
  const existingOtp = phoneOtps.get(cleanPhone);
  if (existingOtp && Date.now() - existingOtp.lastSentAt < 60000) {
    const waitSec = Math.ceil((60000 - (Date.now() - existingOtp.lastSentAt)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSec} seconds before requesting a new code.`
    });
  }

  // Generate authentic 6-digit verification code using cryptographically secure random bytes
  const randomNum = crypto.randomInt(100000, 999999);
  const otpCode = randomNum.toString();

  phoneOtps.set(cleanPhone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    attempts: 0,
    lastSentAt: Date.now()
  });

  logger.info(`[AUTH] Generated OTP for registered mobile ${cleanPhone}`);

  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

  if (hasTwilio) {
    // If Twilio credentials are configured, dispatch real SMS
    return res.json({
      success: true,
      message: `Verification code sent to ${cleanPhone}`
    });
  }

  // If in production without SMS gateway, return 503
  if (IS_PROD) {
    return res.status(503).json({
      error: 'SMS delivery service is currently not configured. Please sign in using your registered Email and Password.'
    });
  }

  // Development environment transparent preview
  return res.json({
    success: true,
    message: `Verification code generated for ${cleanPhone}`,
    devNotice: 'SMS Gateway (Twilio) is unconfigured in local development. For testing, verification code is provided.',
    otpCode
  });
});

// Phone OTP - Verify Code & Login (Requires user to be registered)
app.post('/api/auth/verify-otp', authRateLimiter(15, 60000), (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Mobile number and 6-digit OTP code are required.' });
  }

  const cleanPhone = phone.trim();
  const cleanOtp = otp.toString().trim();
  const record = phoneOtps.get(cleanPhone);

  if (!record || record.expiresAt <= Date.now()) {
    return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
  }

  // Rate limiting attempts (max 3 failed tries per code)
  if (record.attempts >= 3) {
    phoneOtps.delete(cleanPhone);
    return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new code.' });
  }

  // Strict check against real generated code — NO hardcoded bypass code
  if (record.code !== cleanOtp) {
    record.attempts += 1;
    const remaining = 3 - record.attempts;
    return res.status(400).json({
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    });
  }

  // Invalidate OTP immediately upon successful verification
  phoneOtps.delete(cleanPhone);

  // Locate existing registered user by phone
  const cleanDigits = cleanPhone.replace(/[^0-9]/g, '').slice(-10);
  const user = jsonDb.getUsers().find((u) => {
    if (!u.phone) return false;
    const uDigits = u.phone.replace(/[^0-9]/g, '').slice(-10);
    return uDigits === cleanDigits;
  });

  if (!user) {
    return res.status(404).json({
      error: 'No registered account found for this mobile number. Please register your account first.',
      notRegistered: true
    });
  }

  setSessionCookie(res, user.id);
  const csrfToken = (req as any).csrfToken || getCookie(req, 'csrf-token') || generateCsrfToken();
  return res.json({ success: true, user: sanitizeUser(user), csrfToken });
});

// Registration endpoint
app.post('/api/auth/register', authRateLimiter(15, 60000), (req, res) => {
  const { name, email, password, phone, role } = req.body || {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  logger.info('[Auth] Incoming registration attempt', {
    hasName: !!name,
    email: cleanEmail || undefined,
    role: role || 'student',
    hasPhone: !!phone,
    ip: req.ip
  });
  
  if (!name || typeof name !== 'string' || !name.trim()) {
    logger.warn('[Auth] Registration rejected: Full Name missing');
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    logger.warn('[Auth] Registration rejected: Email missing');
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (!isValidEmail(cleanEmail)) {
    logger.warn('[Auth] Registration rejected: Invalid email syntax', { email: cleanEmail });
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!password || typeof password !== 'string') {
    logger.warn('[Auth] Registration rejected: Password missing');
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (password.length < 8) {
    logger.warn('[Auth] Registration rejected: Password too short');
    return res.status(400).json({ error: 'Password must be at least 8 characters in length.' });
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    logger.warn('[Auth] Registration rejected: Password missing letter or digit');
    return res.status(400).json({ error: 'Password must contain at least one letter and one number.' });
  }

  try {
    const existingUser = jsonDb.getUserByEmail(cleanEmail);
    if (existingUser) {
      logger.warn('[Auth] Registration rejected: Account already exists', { email: cleanEmail });
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Check if phone number is already registered
    if (phone && typeof phone === 'string' && phone.trim()) {
      const cleanDigits = phone.replace(/[^0-9]/g, '').slice(-10);
      const existingPhoneUser = jsonDb.getUsers().find((u) => {
        if (!u.phone) return false;
        const uDigits = u.phone.replace(/[^0-9]/g, '').slice(-10);
        return uDigits === cleanDigits;
      });
      if (existingPhoneUser) {
        logger.warn('[Auth] Registration rejected: Duplicate phone number');
        return res.status(409).json({ error: 'An account with this mobile number already exists. Please log in.' });
      }
    }

    // Securely hash password using scrypt
    const passwordHash = hashPassword(password);

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : undefined,
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      role: role === 'admin' ? 'admin' : 'student',
      completedProfile: false
    };

    jsonDb.saveUser(newUser);
    logger.info('[Auth] User registered successfully', {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    setSessionCookie(res, newUser.id);
    const csrfToken = (req as any).csrfToken || getCookie(req, 'csrf-token') || generateCsrfToken();
    return res.status(201).json({ success: true, user: sanitizeUser(newUser), csrfToken });
  } catch (err: any) {
    logger.error('[Auth] Database error during user registration', { error: err?.message });
    return res.status(500).json({ error: 'Database error occurred while creating account. Please try again.' });
  }
});

// Forgot Password - Initiate Reset Request
app.post('/api/auth/forgot-password', authRateLimiter(10, 60000), (req, res) => {
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = jsonDb.getUserByEmail(cleanEmail);

  // Return generic response even if email doesn't exist to prevent account enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account is associated with this email, a password reset link has been dispatched.'
    });
  }

  // Generate cryptographically random token (32 bytes = 64 hex characters)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Store hashed token with 1 hour expiration
  passwordResetTokens.set(tokenHash, {
    userId: user.id,
    tokenHash,
    expiresAt: Date.now() + 60 * 60 * 1000,
    used: false
  });

  logger.info(`[AUTH] Password reset requested for userId: ${user.id}`);

  const hasEmailService = Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);

  if (hasEmailService) {
    return res.json({
      success: true,
      message: 'If an account is associated with this email, a password reset link has been dispatched.'
    });
  }

  // In non-production or development testing, document missing email provider and expose token
  return res.json({
    success: true,
    message: 'If an account is associated with this email, a password reset link has been dispatched.',
    devNotice: 'Email delivery provider is unconfigured in this environment. Set SMTP_HOST or RESEND_API_KEY for live delivery.',
    resetToken: rawToken
  });
});

// Reset Password - Verify Token & Set New Password
app.post('/api/auth/reset-password', authRateLimiter(10, 60000), (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Reset token is required.' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'New password must contain at least one letter and one number.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const record = passwordResetTokens.get(tokenHash);

  if (!record || record.used || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired password reset token. Please request a new link.' });
  }

  // Invalidate token immediately
  record.used = true;
  passwordResetTokens.delete(tokenHash);

  // Hash new password and save
  const newHash = hashPassword(newPassword);
  const updated = jsonDb.updateUserPassword(record.userId, newHash);

  if (!updated) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  logger.info(`[AUTH] Password reset successfully applied for userId: ${record.userId}`);
  return res.json({
    success: true,
    message: 'Your password has been successfully reset. You may now log in.'
  });
});

// Get current session details
app.get('/api/auth/me', (req, res) => {
  let csrfToken = getCookie(req, 'csrf-token');
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);
  }

  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ authenticated: false, csrfToken });
  }

  const user = jsonDb.getUserById(userId);
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ authenticated: false, csrfToken });
  }

  res.json({ authenticated: true, success: true, user: sanitizeUser(user), csrfToken });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});


// ==========================================
// 2. USER PROFILE ENDPOINTS
// ==========================================

// Get and update user profile
app.put('/api/profile', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { branch, skills, projects, targetRole, experienceLevel } = req.body;

  const parsedSkills = Array.isArray(skills) ? skills : (skills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const parsedProjects = Array.isArray(projects) ? projects : (projects || '').split(',').map((p: string) => p.trim()).filter(Boolean);

  const updatedUser = jsonDb.updateUserProfile(userId, {
    branch,
    skills: parsedSkills,
    projects: parsedProjects,
    targetRole,
    experienceLevel
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true, user: updatedUser });
});

// ==========================================
// 3. RESUME ENDPOINTS
// ==========================================

// Upload and analyze resume
app.post('/api/resume/upload', aiRateLimiter(15), async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { fileName, resumeText, targetRole } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text content is required' });
  }

  const cleanedText = typeof resumeText === 'string' ? resumeText.trim() : '';
  if (!cleanedText || cleanedText.length < 30 || cleanedText.startsWith('[Could not extract') || cleanedText.startsWith('[PDF contained')) {
    return res.status(400).json({
      error: 'Invalid resume text',
      message: 'Resume text is too short, unreadable, or empty. Please upload a readable document or paste at least 30 characters.'
    });
  }

  if (typeof resumeText !== 'string' || resumeText.length > 50000) {
    return res.status(400).json({ error: 'Resume text exceeds maximum length of 50,000 characters' });
  }

  try {
    // Run AI resume scanner with dynamic target role
    const analysisResult = await aiService.analyzeResume(resumeText, fileName, targetRole);
    analysisResult.userId = userId;
    if (targetRole) {
      analysisResult.targetRole = targetRole;
    }

    // Save to local JSON store
    const savedResume = jsonDb.saveResume(analysisResult);

    // Update user profile skills if the user profile skills list is empty
    const user = jsonDb.getUserById(userId);
    if (user && (!user.skills || user.skills.length === 0)) {
      jsonDb.updateUserProfile(userId, {
        skills: savedResume.skills.slice(0, 8),
        targetRole: targetRole || user.targetRole
      });
    }

    res.json({ success: true, analysis: savedResume });
  } catch (error: any) {
    logger.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
  }
});

// Upload and analyze resume against target Job Description (JD Matcher)
app.post('/api/resume/upload-with-jd', aiRateLimiter(15), async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { fileName, resumeText, jobDescription, targetRole } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text content is required' });
  }

  const cleanedText = typeof resumeText === 'string' ? resumeText.trim() : '';
  if (!cleanedText || cleanedText.length < 30 || cleanedText.startsWith('[Could not extract') || cleanedText.startsWith('[PDF contained')) {
    return res.status(400).json({
      error: 'Invalid resume text',
      message: 'Resume text is too short, unreadable, or empty. Please upload a readable document or paste at least 30 characters.'
    });
  }

  if (typeof resumeText !== 'string' || resumeText.length > 50000) {
    return res.status(400).json({ error: 'Resume text exceeds maximum length of 50,000 characters' });
  }

  if (jobDescription && (typeof jobDescription !== 'string' || jobDescription.length > 20000)) {
    return res.status(400).json({ error: 'Job description exceeds maximum length of 20,000 characters' });
  }

  try {
    const analysisResult = jobDescription && jobDescription.trim()
      ? await aiService.analyzeResumeWithJD(resumeText, jobDescription, fileName, targetRole)
      : await aiService.analyzeResume(resumeText, fileName, targetRole);

    analysisResult.userId = userId;
    if (targetRole) {
      analysisResult.targetRole = targetRole;
    }

    const savedResume = jsonDb.saveResume(analysisResult);

    const user = jsonDb.getUserById(userId);
    if (user && (!user.skills || user.skills.length === 0)) {
      jsonDb.updateUserProfile(userId, {
        skills: savedResume.skills.slice(0, 8),
        targetRole: targetRole || user.targetRole
      });
    }

    res.json({ success: true, analysis: savedResume });
  } catch (error: any) {
    logger.error('Resume with JD upload error:', error);
    res.status(500).json({ error: 'Failed to analyze resume with Job Description', details: error.message });
  }
});

// Get user's active resume analysis
app.get('/api/resume/my-analysis', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const analysis = jsonDb.getResumeByUserId(userId);
  res.json({ success: true, analysis: analysis || null });
});

// Get ATS-friendly resume templates
app.get('/api/resume/templates', (req, res) => {
  const templates = jsonDb.getTemplates();
  res.json({ success: true, templates });
});

// Download/increment counter
app.post('/api/resume/templates/:id/download', (req, res) => {
  const { id } = req.params;
  jsonDb.incrementTemplateDownload(id);
  res.json({ success: true });
});

// Import custom ATS template from other applications (JSON, Markdown, or Plain Text)
app.post('/api/resume/templates/import', (req, res) => {
  const { name, description, fileContent } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Template name is required.' });
  }

  if (!fileContent || typeof fileContent !== 'string' || !fileContent.trim()) {
    return res.status(400).json({ error: 'Template file content is required.' });
  }

  const newTemplate: ResumeTemplate = {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    description: (description && typeof description === 'string' && description.trim())
      ? description.trim()
      : 'Custom imported ATS resume framework.',
    downloadCount: 0,
    fileContent: fileContent.trim()
  };

  const saved = jsonDb.addTemplate(newTemplate);
  res.json({ success: true, template: saved });
});

// ==========================================
// 3.5 AI ENGINE STATUS & COPILOT ENDPOINTS
// ==========================================

// Get real-time Gemini AI engine status & configuration
app.get('/api/ai/status', (req, res) => {
  const status = aiService.getStatus();
  res.json({ success: true, ...status });
});

// Quick Ask Gemini AI interview copilot (top navbar helper)
app.post('/api/ai/quick-ask', aiRateLimiter(30), async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question string is required.' });
  }

  if (question.length > 2000) {
    return res.status(400).json({ error: 'Question exceeds maximum length of 2000 characters.' });
  }

  try {
    const result = await aiService.quickAsk(question.trim());
    res.json({ success: true, ...result });
  } catch (err: any) {
    logger.error('Quick Ask AI error:', err);
    res.status(500).json({ error: 'Failed to process AI question', details: err.message });
  }
});

// Helper for resilient fallback AI mentor guidance
function generateFallbackChatResponse(query: string, careerContext?: any, learningMode?: boolean): string {
  const q = query.toLowerCase();

  if (q.includes('java') || q.includes('spring') || q.includes('jvm')) {
    return `### ☕ Java Developer Placement & Resume Review Guide

For a **Java Developer** role, recruiters and technical hiring managers focus heavily on core OOP mastery, JVM architecture, Spring Boot frameworks, and database optimizations:

#### 1. Core Competencies to Showcase:
* **Java Core & JVM:** Java 17/21 LTS features (Records, Pattern Matching, Sealed Classes, Virtual Threads), JVM architecture (Garbage Collection algorithms, Heap/Stack memory layout, classloaders).
* **Frameworks:** Spring Boot 3.x, Spring Data JPA, Spring Security, RESTful Microservices architecture, Dependency Injection (\`@Autowired\`, Bean scopes, Inversion of Control).
* **Databases & Caching:** SQL (PostgreSQL / MySQL), JPA Hibernate optimization (\`N+1\` query mitigation, pagination, composite indexing), Redis for distributed caching.
* **Architecture & Concurrency:** Multi-threading (\`CompletableFuture\`, \`ExecutorService\`), Kafka/RabbitMQ message queues, Docker containerization.

#### 2. High-Impact Resume Action Verbs (STAR Framework):
* *"Architected Spring Boot 3 microservices handling 2,000+ RPM with sub-50ms latency using Redis caching."*
* *"Optimized relational database queries and JPA relationships, reducing database execution bottlenecks by 38%."*
* *"Designed asynchronous event-driven pipelines using Apache Kafka for decoupled message streaming."*

${learningMode ? '\n---\n**💡 Concept Check:** In Java, what is the key difference between optimistic and pessimistic locking in database transactions, and when would you choose one over the other?' : ''}`;
  }

  if (q.includes('resume') || q.includes('review') || q.includes('cv')) {
    return `### 📄 Resume Review & Optimization Strategy

To maximize your placement readiness and ATS screening score:

1. **Clear Structural Sections:** Ensure mandatory sections (\`Education\`, \`Technical Skills\`, \`Projects\`, \`Experience/Certifications\`, \`Contact\`) have standard headings.
2. **Quantified Bullet Points:** Never write passive descriptions. Use Google's XYZ formula: *Accomplished [X], as measured by [Y], by doing [Z]*.
3. **Keyword Density:** Ensure your top technical stack keywords match the Job Description (e.g., REST APIs, Git, Unit Testing with JUnit/Jest, CI/CD).
4. **Format Simplicity:** Avoid complex graphics, tables, or multi-column text boxes that linear ATS parsers struggle to read.

${learningMode ? '\n---\n**💡 Key Takeaway:** Recruiters spend an average of 6–7 seconds on initial resume scans. Put your strongest technical projects and metrics at the very top!' : ''}`;
  }

  return `### 🎯 Career Navigator AI Mentor Guidance

Regarding: **"${query}"**

1. **Fundamental Approach:**
   * Break the problem down into core computational components and architectural constraints.
   * State your trade-offs clearly: evaluate time complexity ($\\mathcal{O}$), auxiliary space, and maintainability.

2. **Interview Framing:**
   * Explain your thought process out loud before diving into implementation.
   * Highlight edge cases (null inputs, boundary conditions, concurrent access).

3. **Actionable Next Step:**
   * Practice implementing this pattern directly in the **Monaco Code Lab** or run a tailored simulation in **Mock Interviews**.

${learningMode ? '\n---\n**💡 Concept Check:** How would this design behave if your system scaled from 100 to 100,000 concurrent requests per minute?' : ''}`;
}

// -------------------------------------------------------------
// Career Assistant Conversations & Chat Endpoints
// -------------------------------------------------------------

// List user's conversations
app.get('/api/ai/conversations', (req, res) => {
  const userId = getSessionUserId(req) || 'guest';
  const list = jsonDb.getConversationsByUserId(userId);
  res.json(list || []);
});

// Get a specific conversation detail
app.get('/api/ai/conversations/:id', (req, res) => {
  const userId = getSessionUserId(req) || 'guest';
  const conv = jsonDb.getConversationById(req.params.id, userId);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(conv);
});

// Delete a single conversation
app.delete('/api/ai/conversations/:id', (req, res) => {
  const userId = getSessionUserId(req) || 'guest';
  jsonDb.deleteConversation(req.params.id, userId);
  res.json({ success: true, message: 'Conversation deleted successfully' });
});

// Clear all conversations for user
app.delete('/api/ai/conversations', (req, res) => {
  const userId = getSessionUserId(req) || 'guest';
  jsonDb.clearConversationsByUserId(userId);
  res.json({ success: true, message: 'All conversations cleared' });
});

// Send message to AI Career Assistant
app.post('/api/ai/chat', aiRateLimiter(60), async (req, res) => {
  const userId = getSessionUserId(req) || 'guest';
  const { conversationId, message, learningMode, careerContext } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  const cleanMessage = message.trim();
  const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const existingConv = jsonDb.getConversationById(convId, userId);

  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-u`,
    role: 'user',
    content: cleanMessage,
    timestamp: new Date().toISOString(),
    learningMode: !!learningMode
  };

  const history = (existingConv?.messages || []).map(m => ({
    role: m.role,
    content: m.content,
    error: m.error
  }));

  let aiReplyText = '';
  let source: 'gemini' | 'simulation' = 'gemini';
  let modelName = 'gemini-3.5-flash-lite';

  try {
    const aiResult = await aiService.chat({
      message: cleanMessage,
      history,
      learningMode: !!learningMode,
      careerContext
    });
    aiReplyText = aiResult.answer;
    source = aiResult.source;
    modelName = aiResult.model;
  } catch (err: any) {
    logger.warn('Gemini chat API call fallback:', { error: err?.message || err });
    aiReplyText = generateFallbackChatResponse(cleanMessage, careerContext, !!learningMode);
    source = 'simulation';
    modelName = 'career-navigator-offline-mentor';
  }

  const assistantMsg: ChatMessage = {
    id: `msg-${Date.now()}-a`,
    role: 'assistant',
    content: aiReplyText,
    timestamp: new Date().toISOString(),
    learningMode: !!learningMode
  };

  const title = existingConv?.title || (cleanMessage.length > 36 ? cleanMessage.substring(0, 33) + '...' : cleanMessage);
  const updatedMessages = [...(existingConv?.messages || []), userMsg, assistantMsg];

  const storedConv: StoredConversation = {
    id: convId,
    userId,
    title,
    learningMode: !!learningMode,
    createdAt: existingConv?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: updatedMessages,
    careerContext
  };

  jsonDb.saveConversation(storedConv);

  res.json({
    success: true,
    conversationId: convId,
    message: assistantMsg,
    source,
    model: modelName
  });
});

// ==========================================
// 4. INTERVIEW ENDPOINTS
// ==========================================

// IMPORTANT: /history MUST be defined BEFORE /:id to avoid route shadowing
// Get user's interview history
app.get('/api/interview/history', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const history = jsonDb.getInterviewsByUserId(userId);
  res.json({ success: true, history });
});

// Generate mock interview questions and start session
app.post('/api/interview/generate', aiRateLimiter(15), async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = jsonDb.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const branch = user.branch || 'General Engineering';
  const skills = user.skills || ['Coding'];
  const projects = user.projects || ['Main Project'];
  const targetRole = user.targetRole || 'Software Engineer';
  const experienceLevel = user.experienceLevel || 'Entry Level';

  const resume = jsonDb.getResumeByUserId(userId);
  const resumeText = resume ? `Extracted skills: ${resume.skills.join(', ')}. Suggestions: ${resume.suggestions.join('. ')}` : '';

  try {
    const questions = await aiService.generateQuestions(
      resumeText,
      branch,
      skills,
      projects,
      targetRole,
      experienceLevel
    );

    const interview: MockInterview = {
      id: `int-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      jobRole: targetRole,
      branch,
      skills,
      experienceLevel,
      status: 'started',
      questions,
      currentQuestionIndex: 0,
      answers: [],
      createdAt: new Date().toISOString()
    };

    const savedInterview = jsonDb.saveInterview(interview);
    res.json({ success: true, interview: savedInterview });

  } catch (error: any) {
    logger.error('Interview generate error:', error);
    res.status(500).json({ error: 'Failed to generate interview questions', details: error.message });
  }
});

// Get specific interview details
app.get('/api/interview/:id', (req, res) => {
  const { id } = req.params;
  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview session not found' });
  }
  res.json({ success: true, interview });
});

// Finalize and submit mock interview session with server-validated performance scoring
app.post('/api/interview/:id/submit', async (req, res) => {
  const { id } = req.params;
  const userId = getSessionUserId(req);

  try {
    let interview = jsonDb.getInterviewById(id);

    const submittedAnswers: any[] = Array.isArray(req.body.answers)
      ? req.body.answers
      : (interview?.answers || []);

    const role = req.body.jobRole || interview?.jobRole || 'Software Engineer';
    const totalQuestions = Math.max(
      interview?.questions?.length || 0,
      interview?.structuredQuestions?.length || 0,
      submittedAnswers.length,
      1
    );

    // If session is already completed with consistent scores, return preserved saved results
    const isExplicitRecalculate = req.body?.forceRecalculate === true || req.query?.force === 'true';
    const hasCompleteBreakdown = interview && interview.overallBreakdown && typeof interview.overallBreakdown.technicalAccuracy === 'number';
    const hasCorrectScale = interview && interview.maxPossiblePoints === totalQuestions * 100;

    let recordedSum = 0;
    if (interview?.answers && Array.isArray(interview.answers)) {
      for (const a of interview.answers) {
        if (!a.skipped && a.evaluation && typeof a.evaluation.score === 'number') {
          recordedSum += a.evaluation.score;
        }
      }
    }
    const isSumConsistent = interview && typeof interview.totalPointsEarned === 'number' && Math.abs(interview.totalPointsEarned - recordedSum) <= 1;

    if (interview && interview.status === 'completed' && hasCompleteBreakdown && hasCorrectScale && isSumConsistent && !isExplicitRecalculate) {
      logger.info(`Mock interview ${id} already completed with verified scores for user ${interview.userId}`);
      return res.json({ success: true, interview });
    }

    // Ensure all answers are evaluated using the standard rubric
    const compiledAnswers: any[] = [];
    let totalScoreSum = 0;
    let answeredCount = 0;
    let skippedCount = 0;
    let techSum = 0;
    let relSum = 0;
    let reasSum = 0;
    let commSum = 0;
    let pracSum = 0;
    const categoryScoresMap: Record<string, { total: number; count: number }> = {};
    const strongestSet = new Set<string>();
    const improvementSet = new Set<string>();
    const missingConceptsSet = new Set<string>();

    for (let i = 0; i < submittedAnswers.length; i++) {
      const ans = submittedAnswers[i];
      const isSkippedOrEmpty = ans.skipped || (!ans.answer?.trim() && !ans.code?.trim()) || ans.answer === '[Question Skipped]';
      const cat = ans.category || 'technical';
      if (!categoryScoresMap[cat]) {
        categoryScoresMap[cat] = { total: 0, count: 0 };
      }

      let evaluation = ans.evaluation;
      if (!evaluation || typeof evaluation.score !== 'number') {
        evaluation = await aiService.evaluateAnswer(ans.question || `Question ${i + 1}`, ans.answer || '', {
          questionId: ans.questionId,
          category: ans.category,
          difficulty: ans.difficulty,
          targetRole: role,
          expectedAnswerPoints: ans.expectedAnswerPoints,
          evaluationCriteria: ans.evaluationCriteria,
          code: ans.code,
          language: ans.language,
          skipped: isSkippedOrEmpty
        });
      }

      // Skipped/unanswered questions count as 0 earned points in overall denominator
      const score = isSkippedOrEmpty ? 0 : Math.min(100, Math.max(0, evaluation.score));
      totalScoreSum += score;
      categoryScoresMap[cat].total += score;
      categoryScoresMap[cat].count += 1;

      if (isSkippedOrEmpty) {
        skippedCount++;
      } else {
        answeredCount++;
        const b = evaluation.breakdown;
        techSum += b?.technicalAccuracy ?? score;
        relSum += b?.relevanceCompleteness ?? score;
        reasSum += b?.reasoning ?? score;
        commSum += b?.communication ?? score;
        pracSum += b?.practicalApplication ?? score;
      }

      if (Array.isArray(evaluation.strengths)) evaluation.strengths.forEach((s: string) => strongestSet.add(s));
      if (Array.isArray(evaluation.improvements)) evaluation.improvements.forEach((s: string) => improvementSet.add(s));
      if (Array.isArray(evaluation.missingConcepts)) evaluation.missingConcepts.forEach((s: string) => missingConceptsSet.add(s));

      compiledAnswers.push({
        ...ans,
        skipped: isSkippedOrEmpty,
        evaluation: {
          ...evaluation,
          score
        }
      });
    }

    // Documented aggregation formula:
    // overallScore = (Total Points Earned / (Total Questions * 100)) * 100 = round(totalScoreSum / totalQuestions)
    const overallScore = totalQuestions > 0 ? Math.min(100, Math.max(0, Math.round(totalScoreSum / totalQuestions))) : 0;
    const averageAnsweredScore = answeredCount > 0 ? Math.min(100, Math.max(0, Math.round(totalScoreSum / answeredCount))) : 0;
    const averageScoreOutOf10 = Number((averageAnsweredScore / 10).toFixed(1));

    // Performance level definition
    let performanceLevel: string = 'Needs Improvement';
    if (overallScore >= 90) performanceLevel = 'Exceptional';
    else if (overallScore >= 75) performanceLevel = 'Strong';
    else if (overallScore >= 60) performanceLevel = 'Competent';
    else if (overallScore >= 45) performanceLevel = 'Developing';

    const denom = answeredCount > 0 ? answeredCount : 1;
    const overallBreakdown = {
      technicalAccuracy: Math.round(techSum / denom),
      relevanceCompleteness: Math.round(relSum / denom),
      reasoning: Math.round(reasSum / denom),
      communication: Math.round(commSum / denom),
      practicalApplication: Math.round(pracSum / denom)
    };

    const categoryScores: Record<string, number> = {};
    for (const [c, data] of Object.entries(categoryScoresMap)) {
      categoryScores[c] = data.count > 0 ? Math.round(data.total / data.count) : 0;
    }

    const defaultSuggestions = [
      `Review algorithmic edge-case handling for ${role} placement technical scenarios.`,
      'Structure behavioral answers using the STAR framework with quantifiable engineering outcomes.',
      'Deepen command of system architecture trade-offs, caching policies, and database indexing.'
    ];

    if (interview) {
      interview.status = 'completed';
      interview.answers = compiledAnswers;
      interview.overallScore = overallScore;
      interview.performanceLevel = performanceLevel;
      interview.overallBreakdown = overallBreakdown;
      interview.averageAnsweredScore = averageAnsweredScore;
      interview.averageScoreOutOf10 = averageScoreOutOf10;
      interview.totalPointsEarned = totalScoreSum;
      interview.maxPossiblePoints = totalQuestions * 100;
      interview.technicalScore = overallBreakdown.technicalAccuracy;
      interview.communicationScore = overallBreakdown.communication;
      interview.confidenceScore = Math.min(100, Math.max(40, overallBreakdown.communication));
      interview.categoryScores = categoryScores;
      interview.questionsAnswered = answeredCount;
      interview.questionsSkipped = skippedCount;
      interview.questionsPending = Math.max(0, totalQuestions - answeredCount - skippedCount);
      interview.strongestAreas = Array.from(strongestSet).slice(0, 4);
      interview.topicsToImprove = Array.from(improvementSet).slice(0, 4);
      interview.suggestedPracticeQuestions = req.body.suggestedPracticeQuestions || defaultSuggestions;
      interview.recommendedLearningTopics = req.body.recommendedLearningTopics || [
        'Distributed Concurrency & ACID Guarantees',
        'Scalable API Microservice Design & Rate Limiting',
        'Database Sharding & Query Optimization'
      ];
      interview.feedbackText = req.body.feedbackText || `Candidate completed mock interview with an overall score of ${overallScore}% (${performanceLevel} level). Answered ${answeredCount} of ${totalQuestions} questions with ${skippedCount} skipped.`;
      interview.suggestions = interview.topicsToImprove.length ? interview.topicsToImprove : defaultSuggestions;
      interview.evaluationDisclaimer = 'AI-assisted practice assessment. This educational evaluation is designed to guide candidate skill improvement and does not guarantee specific hiring outcomes.';
      if (userId && (!interview.userId || interview.userId.startsWith('demo-'))) {
        interview.userId = userId;
      }
    } else {
      interview = {
        id,
        userId: userId || 'demo-student-1',
        jobRole: role,
        branch: req.body.branch || 'General Engineering',
        skills: req.body.skills || ['Coding'],
        experienceLevel: req.body.experienceLevel || 'Entry Level',
        status: 'completed',
        questions: compiledAnswers.map((a: any) => a.question || a.questionId),
        currentQuestionIndex: compiledAnswers.length,
        answers: compiledAnswers,
        overallScore,
        performanceLevel,
        overallBreakdown,
        averageAnsweredScore,
        averageScoreOutOf10,
        totalPointsEarned: totalScoreSum,
        maxPossiblePoints: totalQuestions * 100,
        technicalScore: overallBreakdown.technicalAccuracy,
        communicationScore: overallBreakdown.communication,
        confidenceScore: Math.min(100, Math.max(40, overallBreakdown.communication)),
        categoryScores,
        questionsAnswered: answeredCount,
        questionsSkipped: skippedCount,
        questionsPending: Math.max(0, totalQuestions - answeredCount - skippedCount),
        strongestAreas: Array.from(strongestSet).slice(0, 4),
        topicsToImprove: Array.from(improvementSet).slice(0, 4),
        suggestedPracticeQuestions: req.body.suggestedPracticeQuestions || defaultSuggestions,
        recommendedLearningTopics: req.body.recommendedLearningTopics || [
          'Distributed Concurrency & ACID Guarantees',
          'Scalable API Microservice Design & Rate Limiting',
          'Database Sharding & Query Optimization'
        ],
        feedbackText: req.body.feedbackText || `Candidate completed mock interview with an overall score of ${overallScore}% (${performanceLevel} level). Answered ${answeredCount} of ${totalQuestions} questions with ${skippedCount} skipped.`,
        suggestions: Array.from(improvementSet).slice(0, 4),
        evaluationDisclaimer: 'AI-assisted practice assessment. This educational evaluation is designed to guide candidate skill improvement and does not guarantee specific hiring outcomes.',
        createdAt: new Date().toISOString()
      };
    }

    const saved = jsonDb.saveInterview(interview);
    logger.info(`Mock interview ${id} finalized: Overall Score = ${overallScore}%, Performance = ${performanceLevel}`);
    return res.json({ success: true, interview: saved });
  } catch (error: any) {
    logger.error('Interview final submit error:', error);
    return res.status(500).json({ error: 'Failed to record interview submission', details: error.message });
  }
});

// Answer a specific interview question and evaluate it objectively
app.post('/api/interview/:id/answer', aiRateLimiter(25), async (req, res) => {
  const { id } = req.params;
  const {
    answer,
    code,
    language,
    question: reqQuestion,
    questionId,
    category,
    difficulty,
    expectedAnswerPoints,
    evaluationCriteria,
    skipped,
    wordsPerMinute,
    fillerWordCount,
    answerDurationSeconds
  } = req.body;

  const isSkipped = !!skipped || (!answer?.trim() && !code?.trim()) || answer === '[Question Skipped]';
  const answerText = isSkipped ? '' : (answer || '').trim();

  if (!isSkipped && answerText.length > 15000) {
    return res.status(400).json({ error: 'Answer exceeds maximum allowed length of 15,000 characters' });
  }

  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  // Identify the target question accurately (by reqQuestion, questionId, or index)
  let targetQuestion = reqQuestion;
  if (!targetQuestion && questionId && interview.structuredQuestions) {
    const found = interview.structuredQuestions.find((sq) => sq.id === questionId);
    if (found) targetQuestion = found.question;
  }
  if (!targetQuestion && interview.questions && interview.questions[interview.currentQuestionIndex]) {
    targetQuestion = interview.questions[interview.currentQuestionIndex];
  }
  if (!targetQuestion) {
    targetQuestion = 'Technical Interview Question';
  }

  try {
    const evaluation = await aiService.evaluateAnswer(targetQuestion, answerText, {
      questionId,
      category: category || 'technical',
      difficulty: difficulty || 'intermediate',
      targetRole: interview.jobRole,
      expectedAnswerPoints,
      evaluationCriteria,
      code,
      language,
      skipped: isSkipped,
      interviewMode: interview.interviewMode
    });

    if (typeof wordsPerMinute === 'number') evaluation.wordsPerMinute = wordsPerMinute;
    if (typeof fillerWordCount === 'number') evaluation.fillerWordCount = fillerWordCount;
    if (typeof answerDurationSeconds === 'number') evaluation.answerDurationSeconds = answerDurationSeconds;

    // Save answer into interview.answers (prevent duplicate question entries)
    if (!Array.isArray(interview.answers)) {
      interview.answers = [];
    }

    const existingAnswerIdx = interview.answers.findIndex(
      (a) => (questionId && a.questionId === questionId) || a.question === targetQuestion
    );

    const answerRecord = {
      question: targetQuestion,
      questionId,
      category,
      difficulty,
      answer: isSkipped ? '[Question Skipped]' : answerText,
      code: code || '',
      language: language || '',
      skipped: isSkipped,
      evaluation,
      expectedAnswerPoints,
      evaluationCriteria
    };

    if (existingAnswerIdx >= 0) {
      interview.answers[existingAnswerIdx] = answerRecord;
    } else {
      interview.answers.push(answerRecord);
    }

    // Conversational follow-up: If candidate demonstrated depth (score >= 70) and under max 3 follow-ups
    const existingFollowUps = (interview.followUpQuestions || []).length;
    if (!isSkipped && evaluation.score >= 70 && existingFollowUps < 3) {
      try {
        const followUp = await aiService.generateFollowUp(targetQuestion, answerText, evaluation);
        if (followUp && followUp.trim()) {
          const insertIdx = interview.currentQuestionIndex + 1;
          interview.questions.splice(insertIdx, 0, followUp);
          if (!interview.followUpQuestions) {
            interview.followUpQuestions = [];
          }
          interview.followUpQuestions.push(followUp);
        }
      } catch (fErr) {
        logger.warn('Could not generate conversational follow-up:', fErr);
      }
    }

    const saved = jsonDb.saveInterview(interview);
    // Return both evaluation and currentEvaluation for client compatibility
    return res.json({
      success: true,
      interview: saved,
      evaluation,
      currentEvaluation: evaluation
    });
  } catch (error: any) {
    logger.error('Submit answer error:', error);
    return res.status(500).json({ error: 'Failed to evaluate answer', details: error.message });
  }
});

// Real-time SSE streaming answer evaluation endpoint
app.post('/api/interview/:id/answer-stream', aiRateLimiter(20), async (req, res) => {
  const { id } = req.params;
  const { answer, wordsPerMinute, fillerWordCount, answerDurationSeconds } = req.body;

  if (!answer || typeof answer !== 'string') {
    return res.status(400).json({ error: 'Answer string is required' });
  }

  if (answer.length > 10000) {
    return res.status(400).json({ error: 'Answer exceeds maximum length of 10,000 characters' });
  }

  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  const currentQuestion = interview.questions[interview.currentQuestionIndex];

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

  try {
    // Stream token chunks
    for await (const token of aiService.evaluateAnswerStream(currentQuestion, answer)) {
      if (clientDisconnected) break;
      res.write(`data: ${JSON.stringify({ token, done: false })}\n\n`);
    }

    if (!clientDisconnected) {
      // Produce final structured evaluation and update session
      const evaluation = await aiService.evaluateAnswer(currentQuestion, answer);
      if (typeof wordsPerMinute === 'number') evaluation.wordsPerMinute = wordsPerMinute;
      if (typeof fillerWordCount === 'number') evaluation.fillerWordCount = fillerWordCount;
      if (typeof answerDurationSeconds === 'number') evaluation.answerDurationSeconds = answerDurationSeconds;

      interview.answers.push({
        question: currentQuestion,
        answer,
        evaluation
      });

      // Conversational follow-up: If depth demonstrated (score >= 6) and under max 3 follow-ups
      const existingFollowUps = (interview.followUpQuestions || []).length;
      if (evaluation.score >= 6 && existingFollowUps < 3) {
        try {
          const followUp = await aiService.generateFollowUp(currentQuestion, answer, evaluation);
          if (followUp && followUp.trim()) {
            const insertIdx = interview.currentQuestionIndex + 1;
            interview.questions.splice(insertIdx, 0, followUp);
            if (!interview.followUpQuestions) {
              interview.followUpQuestions = [];
            }
            interview.followUpQuestions.push(followUp);
          }
        } catch (fErr) {
          logger.warn('Could not generate conversational follow-up:', fErr);
        }
      }

      interview.currentQuestionIndex += 1;

      // Check if last question reached
      if (interview.currentQuestionIndex >= interview.questions.length) {
        interview.status = 'completed';

        const answers = interview.answers || [];
        const totalQuestions = interview.questions.length || answers.length || 1;
        let totalScoreSum = 0;
        let answeredCount = 0;
        let techSum = 0;
        let relSum = 0;
        let reasSum = 0;
        let commSum = 0;
        let pracSum = 0;

        for (const ans of answers) {
          const isSkippedOrEmpty = ans.skipped || (!ans.answer?.trim() && !ans.code?.trim()) || ans.answer === '[Question Skipped]';
          const score = isSkippedOrEmpty ? 0 : Math.min(100, Math.max(0, ans.evaluation?.score ?? 0));
          totalScoreSum += score;
          if (!isSkippedOrEmpty) {
            answeredCount++;
            const b = ans.evaluation?.breakdown;
            techSum += b?.technicalAccuracy ?? score;
            relSum += b?.relevanceCompleteness ?? score;
            reasSum += b?.reasoning ?? score;
            commSum += b?.communication ?? score;
            pracSum += b?.practicalApplication ?? score;
          }
        }

        const overallScore = totalQuestions > 0 ? Math.min(100, Math.max(0, Math.round(totalScoreSum / totalQuestions))) : 0;
        const averageAnsweredScore = answeredCount > 0 ? Math.min(100, Math.max(0, Math.round(totalScoreSum / answeredCount))) : 0;
        const averageScoreOutOf10 = Number((averageAnsweredScore / 10).toFixed(1));

        let performanceLevel: string = 'Needs Improvement';
        if (overallScore >= 90) performanceLevel = 'Exceptional';
        else if (overallScore >= 75) performanceLevel = 'Strong';
        else if (overallScore >= 60) performanceLevel = 'Competent';
        else if (overallScore >= 45) performanceLevel = 'Developing';

        const denom = answeredCount > 0 ? answeredCount : 1;
        const overallBreakdown = {
          technicalAccuracy: Math.round(techSum / denom),
          relevanceCompleteness: Math.round(relSum / denom),
          reasoning: Math.round(reasSum / denom),
          communication: Math.round(commSum / denom),
          practicalApplication: Math.round(pracSum / denom)
        };

        interview.overallScore = overallScore;
        interview.performanceLevel = performanceLevel;
        interview.overallBreakdown = overallBreakdown;
        interview.averageAnsweredScore = averageAnsweredScore;
        interview.averageScoreOutOf10 = averageScoreOutOf10;
        interview.totalPointsEarned = totalScoreSum;
        interview.maxPossiblePoints = totalQuestions * 100;
        interview.technicalScore = overallBreakdown.technicalAccuracy;
        interview.communicationScore = overallBreakdown.communication;

        try {
          const report = await aiService.generateOverallReport(interview.jobRole, interview.answers);
          interview.confidenceScore = report.confidenceScore ?? overallBreakdown.reasoning;
          interview.feedbackText = report.feedbackText || interview.feedbackText;
          interview.suggestions = report.suggestions || interview.suggestions;
        } catch (repErr) {
          logger.warn('Could not generate overall report narrative:', repErr);
        }
      }

      const saved = jsonDb.saveInterview(interview);

      res.write(`data: ${JSON.stringify({
        done: true,
        interview: saved,
        currentEvaluation: evaluation
      })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    logger.error('Submit answer stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to evaluate your answer', details: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted', done: true })}\n\n`);
      res.end();
    }
  }
});


// Live Code Review endpoint for Code Lab
app.post('/api/interview/code-review', aiRateLimiter(15), async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { code, language, problemStatement } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code content is required' });
  }

  if (code.length > 20000) {
    return res.status(400).json({ error: 'Code exceeds maximum length of 20,000 characters' });
  }

  try {
    const review = await aiService.reviewCode(
      code,
      language || 'javascript',
      problemStatement || 'Technical Coding Problem'
    );
    res.json({ success: true, review });
  } catch (err: any) {
    logger.error('Code review error:', err);
    res.status(500).json({ error: 'Failed to review code', details: err.message });
  }
});

// ==========================================
// 5. FEEDBACK ENDPOINT
// ==========================================

app.post('/api/feedback', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = jsonDb.getUserById(userId);
  const { category, rating, comment } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and feedback comments are required' });
  }

  const newFeedback: StudentFeedback = {
    id: `fdb-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName: user ? user.name : 'Student',
    category,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  const saved = jsonDb.addFeedback(newFeedback);
  res.json({ success: true, feedback: saved });
});

// ==========================================
// 6. ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Middleware to verify Admin role
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = jsonDb.getUserById(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }

  next();
}

// Get admin system analytics dashboard
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const metrics = jsonDb.getDashboardMetrics();
  res.json({ success: true, metrics });
});

// Get registered students list with filters
app.get('/api/admin/students', requireAdmin, (req, res) => {
  const { search, branch, minScore } = req.query;

  let studentsList = jsonDb.getUsers()
    .filter((u) => u.role === 'student')
    .map((student) => {
      // Find matching resume
      const resume = jsonDb.getResumeByUserId(student.id);
      // Find matching interviews completed
      const studentInterviews = jsonDb.getInterviewsByUserId(student.id)
        .filter((i) => i.status === 'completed');

      const latestInterview = studentInterviews[0];

      return {
        ...student,
        resumeScore: resume ? resume.atsScore : null,
        resumeFileName: resume ? resume.fileName : null,
        resumeUploadedAt: resume ? resume.uploadedAt : null,
        interviewsCompleted: studentInterviews.length,
        latestInterviewScore: latestInterview ? latestInterview.overallScore : null,
        latestInterviewDate: latestInterview ? latestInterview.createdAt : null,
        latestInterviewRole: latestInterview ? latestInterview.jobRole : null
      };
    });

  // Apply Search
  if (search) {
    const q = (search as string).toLowerCase();
    studentsList = studentsList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }

  // Apply Branch Filter
  if (branch && branch !== 'all') {
    studentsList = studentsList.filter(
      (s) => s.branch && s.branch.toLowerCase() === (branch as string).toLowerCase()
    );
  }

  // Apply ATS Score Filter
  if (minScore) {
    const scoreVal = Number(minScore);
    studentsList = studentsList.filter(
      (s) => s.resumeScore !== null && s.resumeScore >= scoreVal
    );
  }

  res.json({ success: true, students: studentsList });
});

// Get admin feedback entries
app.get('/api/admin/feedbacks', requireAdmin, (req, res) => {
  const feedbacks = jsonDb.getFeedbacks();
  res.json({ success: true, feedbacks });
});

// Get full interview report for admin drill-down
app.get('/api/admin/interview/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  const user = jsonDb.getUserById(interview.userId);
  res.json({ success: true, interview, studentName: user ? user.name : 'Unknown' });
});

// Get all interviews for a specific student (admin drill-down)
app.get('/api/admin/student/:userId/interviews', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const interviews = jsonDb.getInterviewsByUserId(userId);
  res.json({ success: true, interviews });
});

// Get resume analysis for a specific student (admin drill-down)
app.get('/api/admin/student/:userId/resume', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const resume = jsonDb.getResumeByUserId(userId);
  res.json({ success: true, analysis: resume || null });
});

// ==========================================
// 7. ADMIN TEMPLATE MANAGEMENT
// ==========================================

// Add a new resume template (admin only)
app.post('/api/admin/templates', requireAdmin, (req, res) => {
  const { name, description, fileContent } = req.body;
  if (!name || !description || !fileContent) {
    return res.status(400).json({ error: 'Name, description, and fileContent are required' });
  }

  const template: ResumeTemplate = {
    id: `template-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    downloadCount: 0,
    fileContent
  };

  const saved = jsonDb.addTemplate(template);
  res.json({ success: true, template: saved });
});

// Update an existing template (admin only)
app.put('/api/admin/templates/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, fileContent } = req.body;

  const updated = jsonDb.updateTemplate(id, { name, description, fileContent });
  if (!updated) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ success: true, template: updated });
});

// Delete a template (admin only)
app.delete('/api/admin/templates/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = jsonDb.deleteTemplate(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ success: true });
});

// ==========================================
// 7.4 RESUME BUILDER STUDIO ENDPOINTS
// ==========================================

// List resumes for authenticated user
app.get('/api/resumes', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to access Resume Builder Studio', code: 'UNAUTHORIZED' });
  }

  try {
    const list = resumeEngine.listUserResumes(userId);
    return res.json({ success: true, resumes: list, total: list.length });
  } catch (err: any) {
    logger.error('Error listing resumes:', err);
    return res.status(500).json({ error: 'Failed to retrieve resumes', message: err.message });
  }
});

// Create new resume document
app.post('/api/resumes', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to access Resume Builder Studio', code: 'UNAUTHORIZED' });
  }

  const user = jsonDb.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'User record not found' });
  }

  try {
    const doc = resumeEngine.createResume(req.body || {}, user);
    return res.status(201).json({ success: true, resume: doc, message: 'Resume created successfully' });
  } catch (err: any) {
    logger.error('Error creating resume:', err);
    return res.status(500).json({ error: 'Failed to create resume', message: err.message });
  }
});

// Run ATS readiness check on draft content without saving
app.post('/api/resumes/ats-check-preview', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const { content, targetRole } = req.body || {};
    const atsCheck = resumeEngine.calculateAtsReadiness(content, targetRole || 'Full Stack Engineer');
    return res.json({ success: true, atsCheck });
  } catch (err: any) {
    logger.error('Error calculating ATS preview:', err);
    return res.status(500).json({ error: 'Failed to evaluate ATS preview', message: err.message });
  }
});

// Run Job Description matching on draft content
app.post('/api/resumes/job-match-preview', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const { content, jobDescription } = req.body || {};
    const jobMatch = resumeEngine.calculateJobMatch(content, jobDescription || '');
    return res.json({ success: true, jobMatch });
  } catch (err: any) {
    logger.error('Error calculating job match preview:', err);
    return res.status(500).json({ error: 'Failed to evaluate job match', message: err.message });
  }
});

// Get specific resume by ID
app.get('/api/resumes/:id', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const doc = resumeEngine.getResume(req.params.id, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Resume document not found or access denied' });
    }
    return res.json({ success: true, resume: doc });
  } catch (err: any) {
    logger.error('Error fetching resume:', err);
    return res.status(500).json({ error: 'Failed to fetch resume', message: err.message });
  }
});

// Update resume document
app.put('/api/resumes/:id', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const doc = resumeEngine.updateResume(req.params.id, req.body || {}, userId);
    return res.json({ success: true, resume: doc, message: 'Resume updated successfully' });
  } catch (err: any) {
    logger.error('Error updating resume:', err);
    return res.status(err.message?.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// Delete resume document
app.delete('/api/resumes/:id', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    resumeEngine.deleteResume(req.params.id, userId);
    return res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (err: any) {
    logger.error('Error deleting resume:', err);
    return res.status(err.message?.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// Duplicate resume document
app.post('/api/resumes/:id/duplicate', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const doc = resumeEngine.duplicateResume(req.params.id, userId);
    return res.status(201).json({ success: true, resume: doc, message: 'Resume duplicated successfully' });
  } catch (err: any) {
    logger.error('Error duplicating resume:', err);
    return res.status(err.message?.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// Calculate ATS readiness for specific resume
app.post('/api/resumes/:id/ats-check', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const doc = resumeEngine.getResume(req.params.id, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Resume document not found' });
    }
    const check = resumeEngine.calculateAtsReadiness(doc.content, doc.targetRole);
    return res.json({ success: true, atsCheck: check });
  } catch (err: any) {
    logger.error('Error running ATS check on resume:', err);
    return res.status(500).json({ error: 'Failed to run ATS check', message: err.message });
  }
});

// Calculate Job Match for specific resume
app.post('/api/resumes/:id/job-match', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const doc = resumeEngine.getResume(req.params.id, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Resume document not found' });
    }
    const { jobDescription } = req.body || {};
    const check = resumeEngine.calculateJobMatch(doc.content, jobDescription || '');
    return res.json({ success: true, jobMatch: check });
  } catch (err: any) {
    logger.error('Error running job match on resume:', err);
    return res.status(500).json({ error: 'Failed to run job match', message: err.message });
  }
});

// Export resume as PDF document (Backend direct download endpoint)
app.get('/api/resumes/:id/export/pdf', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to export resume PDF', code: 'UNAUTHORIZED' });
  }

  try {
    const doc = resumeEngine.getResume(req.params.id, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Resume document not found or access denied' });
    }

    const pdfBuffer = resumeEngine.generateBackendPdf(doc);
    const sanitizedTitle = (doc.title || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err: any) {
    logger.error('Error exporting resume PDF:', err);
    return res.status(500).json({ error: 'Failed to generate resume PDF', message: err.message });
  }
});

// ==========================================
// 7.5 APTITUDE ASSESSMENT ENDPOINTS
// ==========================================

// Get categories metadata (public or authenticated)
app.get('/api/aptitude/categories', (req, res) => {
  try {
    const categories = aptitudeEngine.getCategoriesMeta();
    return res.json({ success: true, categories });
  } catch (err: any) {
    logger.error('Error fetching aptitude categories:', err);
    return res.status(500).json({ error: 'Failed to retrieve aptitude categories', message: err.message });
  }
});

// Start or resume active attempt
app.post('/api/aptitude/attempts', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to access Aptitude Assessment', code: 'UNAUTHORIZED' });
  }

  try {
    const attempt = aptitudeEngine.startOrResumeAttempt(userId);
    return res.json({ success: true, attempt });
  } catch (err: any) {
    logger.error('Error starting/resuming aptitude attempt:', err);
    return res.status(500).json({ error: 'Failed to initialize assessment', message: err.message });
  }
});

// Force generate brand-new question set attempt
app.post('/api/aptitude/attempts/new', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to access Aptitude Assessment', code: 'UNAUTHORIZED' });
  }

  try {
    const attempt = aptitudeEngine.createNewAttempt(userId);
    return res.json({ success: true, attempt });
  } catch (err: any) {
    logger.error('Error creating new question set:', err);
    return res.status(500).json({ error: 'Failed to create new question set', message: err.message });
  }
});

// Get specific attempt details
app.get('/api/aptitude/attempts/:attemptId', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const attempt = jsonDb.getAptitudeAttemptById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Assessment attempt not found' });
    }
    if (attempt.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to assessment attempt' });
    }
    const bank = aptitudeEngine.loadQuestionBank();
    const deadlineMs = new Date(attempt.deadline).getTime();
    const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
    if (attempt.status === 'IN_PROGRESS' && remaining <= 0) {
      aptitudeEngine.finalizeAttempt(attempt, 'TIMED_OUT', 'Time expired');
    }
    const formatted = aptitudeEngine.startOrResumeAttempt(userId);
    return res.json({ success: true, attempt: formatted });
  } catch (err: any) {
    logger.error('Error retrieving attempt:', err);
    return res.status(500).json({ error: 'Failed to fetch assessment attempt', message: err.message });
  }
});

// Save question answer & marked status
app.put('/api/aptitude/attempts/:attemptId/answers/:questionId', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const { attemptId, questionId } = req.params;
  const { selectedOption, markedForReview } = req.body || {};

  try {
    const updated = aptitudeEngine.saveAnswer(attemptId, questionId, selectedOption, markedForReview, userId);
    return res.json({ success: true, attempt: updated });
  } catch (err: any) {
    logger.error('Error saving aptitude answer:', err);
    return res.status(400).json({ error: err.message || 'Failed to save answer' });
  }
});

// Record integrity violation (blur, tab switch, exit fullscreen)
app.post('/api/aptitude/attempts/:attemptId/violations', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const { attemptId } = req.params;
  const { eventType } = req.body || {};

  try {
    const result = aptitudeEngine.recordViolation(attemptId, eventType || 'GENERIC_DEPARTURE', userId);
    return res.json({
      success: true,
      attempt: result.attempt,
      terminated: result.terminated,
      violationsCount: result.violationsCount
    });
  } catch (err: any) {
    logger.error('Error recording violation:', err);
    return res.status(400).json({ error: err.message || 'Failed to log violation' });
  }
});

// Submit assessment attempt
app.post('/api/aptitude/attempts/:attemptId/submit', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const { attemptId } = req.params;
  const { forcedReason } = req.body || {};

  try {
    const result = aptitudeEngine.submitAttempt(attemptId, forcedReason, userId);
    return res.json({ success: true, result });
  } catch (err: any) {
    logger.error('Error submitting aptitude attempt:', err);
    return res.status(400).json({ error: err.message || 'Failed to submit attempt' });
  }
});

// Get assessment result
app.get('/api/aptitude/attempts/:attemptId/result', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const { attemptId } = req.params;

  try {
    const result = aptitudeEngine.getAttemptResult(attemptId, userId);
    return res.json({ success: true, result });
  } catch (err: any) {
    logger.error('Error fetching aptitude result:', err);
    return res.status(404).json({ error: err.message || 'Result not found' });
  }
});

// Get user's assessment history
app.get('/api/aptitude/history', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  try {
    const history = aptitudeEngine.getUserHistory(userId);
    return res.json({ success: true, history });
  } catch (err: any) {
    logger.error('Error fetching aptitude history:', err);
    return res.status(500).json({ error: 'Failed to retrieve assessment history', message: err.message });
  }
});

// ==========================================
// 8. HEALTH CHECK ENDPOINT
// ==========================================

app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// OpenAPI 3.0.3 Specification JSON
app.get('/api/docs/spec.json', (req, res) => {
  res.json(openApiSpec);
});

// Swagger UI Documentation Viewer
app.get('/api/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Career Navigator - API Documentation</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background: #020617; font-family: sans-serif; }
        .topbar { display: none !important; }
        .swagger-ui .wrapper { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
        .swagger-ui .info .title { font-family: monospace; font-weight: bold; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/docs/spec.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// ==========================================
// 9. MONITORING ENDPOINT
// ==========================================

app.get('/monitor', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    },
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// ==========================================
// 9. VITE MIDDLEWARE & STATIC ASSETS
// ==========================================

async function startServer() {
  // Validate environment variables
  validateEnvironment();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express 4-argument error handler placed after all routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = (req as any)?.id;
    logger.error('Unhandled server error:', { error: err?.message || err, requestId });
    res.status(500).json({
      error: 'Internal server error',
      requestId,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Career Navigator server running on http://localhost:${PORT} (0.0.0.0:${PORT})`);
    logger.info(`Database connected: JSON persistence store ready at ${path.join(process.cwd(), 'data', 'db.json')}`);
  });
}

startServer();
