import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/database.js';
const jsonDb = db;
import { aiService } from './src/lib/gemini.js';
import { User, ResumeAnalysis, MockInterview, StudentFeedback, ResumeTemplate } from './src/types.js';
import { validateEnvironment } from './src/lib/validateEnv.js';
import { logger } from './src/lib/logger.js';
import { openApiSpec } from './src/lib/openapi.js';
import { hashPassword, verifyPassword, sanitizeUser, isValidEmail } from './src/lib/password.js';

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

// Answer the current interview question and evaluate it
app.post('/api/interview/:id/answer', aiRateLimiter(20), async (req, res) => {
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

  try {
    // Evaluate current answer
    const evaluation = await aiService.evaluateAnswer(currentQuestion, answer);
    if (typeof wordsPerMinute === 'number') evaluation.wordsPerMinute = wordsPerMinute;
    if (typeof fillerWordCount === 'number') evaluation.fillerWordCount = fillerWordCount;
    if (typeof answerDurationSeconds === 'number') evaluation.answerDurationSeconds = answerDurationSeconds;

    interview.answers.push({
      question: currentQuestion,
      answer,
      evaluation
    });

    // Conversational follow-up: If candidate demonstrated depth (score >= 6) and under max 3 follow-ups
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

    // Check if that was the last question
    if (interview.currentQuestionIndex >= interview.questions.length) {
      interview.status = 'completed';

      // Generate overall evaluation report
      const report = await aiService.generateOverallReport(interview.jobRole, interview.answers);

      interview.overallScore = report.overallScore;
      interview.technicalScore = report.technicalScore;
      interview.communicationScore = report.communicationScore;
      interview.confidenceScore = report.confidenceScore;
      interview.feedbackText = report.feedbackText;
      interview.suggestions = report.suggestions;
    }

    const saved = jsonDb.saveInterview(interview);
    res.json({ success: true, interview: saved, currentEvaluation: evaluation });

  } catch (error: any) {
    logger.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to evaluate your answer', details: error.message });
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

        const report = await aiService.generateOverallReport(interview.jobRole, interview.answers);
        interview.overallScore = report.overallScore;
        interview.technicalScore = report.technicalScore;
        interview.communicationScore = report.communicationScore;
        interview.confidenceScore = report.confidenceScore;
        interview.feedbackText = report.feedbackText;
        interview.suggestions = report.suggestions;
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
// 8. HEALTH CHECK ENDPOINT
// ==========================================

app.get('/health', (req, res) => {
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
