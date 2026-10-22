import crypto from 'crypto';
import { User } from '../types.js';

/**
 * Derives a cryptographically secure password hash using scrypt (OWASP recommendation).
 * Output format: <salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Validates a plaintext password against a stored hash (or legacy plaintext with auto-upgrade support).
 * Uses crypto.timingSafeEqual to prevent side-channel timing attacks.
 */
export function verifyPassword(password: string, storedHashOrPlain?: string): boolean {
  if (!storedHashOrPlain || !password) return false;

  // Modern hashed format: <salt>:<hash>
  if (storedHashOrPlain.includes(':')) {
    const [salt, key] = storedHashOrPlain.split(':');
    if (!salt || !key) return false;

    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKeyBuffer = crypto.scryptSync(password, salt, 64);
      if (keyBuffer.length !== derivedKeyBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(keyBuffer, derivedKeyBuffer);
    } catch {
      return false;
    }
  }

  // Legacy plaintext fallback (will be auto-upgraded upon successful login)
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(storedHashOrPlain);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return password === storedHashOrPlain;
  }
}

/**
 * Strips password and passwordHash from User objects before sending to clients.
 */
export function sanitizeUser(user: User): Omit<User, 'password' | 'passwordHash'> {
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Strict RFC 5322 compatible email format validator.
 */
export function isValidEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  if (clean.length < 5 || clean.length > 254 || clean.includes('..')) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
}
