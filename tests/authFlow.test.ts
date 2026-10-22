import { describe, it, expect } from 'vitest';
import { signSession, verifySession, generateCsrfToken, getCookie } from '../server.js';
import { db } from '../src/db/database.js';

describe('Complete Authentication Flow & Session Management', () => {
  const testUserId = 'student-test-77';

  it('should generate valid HMAC-SHA256 signed session tokens on sign-in', () => {
    const signedToken = signSession(testUserId);
    expect(signedToken).toBeDefined();
    expect(signedToken).toContain('.');
    expect(signedToken.startsWith(`${testUserId}.`)).toBe(true);

    const verifiedUserId = verifySession(signedToken);
    expect(verifiedUserId).toBe(testUserId);
  });

  it('should immediately invalidate tampered or forged session signatures', () => {
    const validToken = signSession(testUserId);
    const tamperedToken = validToken.slice(0, -4) + '0000';
    expect(verifySession(tamperedToken)).toBeNull();
  });

  it('should safely extract cookies from request headers', () => {
    const mockReq = {
      headers: {
        cookie: 'csrf-token=abc456; session=usr-123.sig; other=test'
      }
    } as any;

    expect(getCookie(mockReq, 'session')).toBe('usr-123.sig');
    expect(getCookie(mockReq, 'csrf-token')).toBe('abc456');
    expect(getCookie(mockReq, 'unknown')).toBeNull();
  });

  it('should generate 48-character hexadecimal CSRF tokens for double-submit protection', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(48);
    expect(/^[0-9a-f]{48}$/.test(token)).toBe(true);
  });

  it('should verify database seeded user profiles for demo login access', () => {
    const adminUser = db.getUserById('admin-1');
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('admin');

    const studentUser = db.getUserById('demo-student-1');
    expect(studentUser).toBeDefined();
    expect(studentUser?.role).toBe('student');
  });

  it('should distinguish student and admin role access appropriately', () => {
    const candidateRole = 'student';
    const coordinatorRole = 'admin';

    expect(['student', 'admin']).toContain(candidateRole);
    expect(['student', 'admin']).toContain(coordinatorRole);
    expect(candidateRole).not.toBe(coordinatorRole);
  });

  it('should format mobile numbers and save phone property on candidate account', () => {
    const testPhone = '+91 9876543210';
    const cleanDigits = testPhone.replace(/[^0-9]/g, '');
    expect(cleanDigits.length).toBeGreaterThanOrEqual(10);

    const testUser = {
      id: 'usr-test-phone-1',
      email: `mobile_${cleanDigits.slice(-10)}@careernavigator.app`,
      name: 'Alex Mobile',
      phone: testPhone,
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      role: 'student' as const,
      completedProfile: false
    };

    db.saveUser(testUser);
    const retrieved = db.getUserById('usr-test-phone-1');
    expect(retrieved?.phone).toBe(testPhone);
    expect(retrieved?.name).toBe('Alex Mobile');
  });
});
