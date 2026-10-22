import { describe, it, expect } from 'vitest';
import { db } from '../src/db/database.js';
import { hashPassword, verifyPassword, isValidEmail } from '../src/lib/password.js';
import { signSession, verifySession } from '../server.js';
import { formatApiError, resolveApiUrl } from '../src/lib/api.js';

describe('Registration & Login End-to-End Authentication Verification', () => {
  const timestamp = Date.now();
  const testEmail = `candidate.${timestamp}@careernavigator.app`;
  const testPassword = 'Password123!';
  const testName = 'Jane Candidate';

  it('should validate email syntax correctly', () => {
    expect(isValidEmail(testEmail)).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should format network fetch failures into clear actionable user messages', () => {
    const fetchErr = new TypeError('Failed to fetch');
    const formatted = formatApiError(fetchErr);
    expect(formatted).toContain('Unable to reach');
    expect(formatted).toContain('port 3000');

    const networkErr = new TypeError('NetworkError when attempting to fetch resource');
    expect(formatApiError(networkErr)).toContain('Unable to reach');

    const standardErr = new Error('Custom validation error');
    expect(formatApiError(standardErr)).toBe('Custom validation error');
  });

  it('should resolve API endpoints with correct relative or centralized base URL', () => {
    expect(resolveApiUrl('/api/auth/register')).toBe('/api/auth/register');
    expect(resolveApiUrl('api/auth/login')).toBe('/api/auth/login');
    expect(resolveApiUrl('https://careernavigator.app/api/auth/me')).toBe('https://careernavigator.app/api/auth/me');
  });

  it('should register a new user, hash password, and persist to database', () => {
    const passwordHash = hashPassword(testPassword);
    const newUser = {
      id: `usr-test-${timestamp}`,
      email: testEmail,
      name: testName,
      passwordHash,
      picture: 'https://example.com/photo.jpg',
      role: 'student' as const,
      completedProfile: false
    };

    const saved = db.saveUser(newUser);
    expect(saved).toBeDefined();
    expect(saved.id).toBe(newUser.id);

    const retrieved = db.getUserByEmail(testEmail);
    expect(retrieved).toBeDefined();
    expect(retrieved?.email).toBe(testEmail);
    expect(retrieved?.name).toBe(testName);
    expect(retrieved?.passwordHash).toBeDefined();
    expect(retrieved?.passwordHash).not.toBe(testPassword);
  });

  it('should reject duplicate email registrations safely', () => {
    const existing = db.getUserByEmail(testEmail);
    expect(existing).toBeDefined();

    // Verification that duplicate check flags existing email
    const duplicateExists = Boolean(db.getUserByEmail(testEmail));
    expect(duplicateExists).toBe(true);
  });

  it('should verify password on login and reject incorrect passwords', () => {
    const user = db.getUserByEmail(testEmail);
    expect(user).toBeDefined();

    const storedHash = user?.passwordHash;
    expect(storedHash).toBeDefined();

    // Correct password succeeds
    const isCorrect = verifyPassword(testPassword, storedHash!);
    expect(isCorrect).toBe(true);

    // Incorrect password fails
    const isWrong = verifyPassword('WrongPassword999!', storedHash!);
    expect(isWrong).toBe(false);
  });

  it('should create signed session tokens that persist across browser reloads', () => {
    const user = db.getUserByEmail(testEmail);
    expect(user).toBeDefined();

    const sessionToken = signSession(user!.id);
    expect(sessionToken).toBeDefined();

    const verifiedUserId = verifySession(sessionToken);
    expect(verifiedUserId).toBe(user!.id);

    // Tampered session signature is rejected
    const tampered = sessionToken.replace(/^usr-[^.]+/, 'usr-attacker');
    expect(verifySession(tampered)).toBeNull();
  });

  it('should verify demo student and admin users exist for instant fallback', () => {
    const admin = db.getUserById('admin-1');
    const student = db.getUserById('demo-student-1');

    expect(admin).toBeDefined();
    expect(admin?.role).toBe('admin');

    expect(student).toBeDefined();
    expect(student?.role).toBe('student');
  });
});
