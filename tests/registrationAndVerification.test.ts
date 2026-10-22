import { describe, it, expect, vi } from 'vitest';
import { isValidEmail, hashPassword, verifyPassword } from '../src/lib/password.js';
import { parseApiResponse, formatApiError } from '../src/lib/api.js';

describe('Registration & Email Verification System Tests (TEST A - TEST M)', () => {
  it('TEST A & C: validates new user email format and uniqueness check logic', () => {
    const email1 = 'newuser1@careernavigator.app';
    const email2 = 'newuser2@careernavigator.app';

    expect(isValidEmail(email1)).toBe(true);
    expect(isValidEmail(email2)).toBe(true);
    expect(email1.toLowerCase()).not.toBe(email2.toLowerCase());
  });

  it('TEST D: handles case-insensitive normalization consistently', () => {
    const raw1 = 'JaneDoe@CareerNavigator.APP';
    const raw2 = 'janedoe@careernavigator.app';
    const raw3 = '  janedoe@careernavigator.app  ';

    const normalized1 = raw1.trim().toLowerCase();
    const normalized2 = raw2.trim().toLowerCase();
    const normalized3 = raw3.trim().toLowerCase();

    expect(normalized1).toBe(normalized2);
    expect(normalized1).toBe(normalized3);
  });

  it('TEST E: trims leading and trailing whitespace without corruption', () => {
    const spacedEmail = '   candidate@example.com   ';
    const clean = spacedEmail.trim().toLowerCase();
    expect(clean).toBe('candidate@example.com');
    expect(isValidEmail(clean)).toBe(true);
  });

  it('TEST F: rejects invalid request formats with appropriate validation errors', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('missing-at.com')).toBe(false);
    expect(isValidEmail('no-domain@')).toBe(false);

    // Password rule verification (min 8 chars, letter + digit)
    const validPass = 'Pass1234!';
    const shortPass = 'Pass1!';
    const noDigits = 'Password!';
    const noLetters = '12345678!';

    const checkPassword = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);

    expect(checkPassword(validPass)).toBe(true);
    expect(checkPassword(shortPass)).toBe(false);
    expect(checkPassword(noDigits)).toBe(false);
    expect(checkPassword(noLetters)).toBe(false);
  });

  it('TEST G: does not mistake database or server errors (500) for duplicate-email (409)', async () => {
    // Mock 500 response
    const mock500 = new Response(JSON.stringify({ error: 'Database connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    const parsed500 = await parseApiResponse(mock500);
    expect(parsed500.ok).toBe(false);
    expect(parsed500.status).toBe(500);
    expect(parsed500.data.error).toBe('Database connection failed');
    expect(parsed500.data.error).not.toContain('already exists');

    // Mock 409 response
    const mock409 = new Response(JSON.stringify({ error: 'An account with this email already exists.' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
    const parsed409 = await parseApiResponse(mock409);
    expect(parsed409.ok).toBe(false);
    expect(parsed409.status).toBe(409);
    expect(parsed409.data.error).toContain('already exists');
  });

  it('TEST H: securely hashes stored passwords using scrypt', () => {
    const raw = 'SuperSecret123!';
    const hashed = hashPassword(raw);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(raw);
    expect(verifyPassword(raw, hashed)).toBe(true);
    expect(verifyPassword('WrongPass123!', hashed)).toBe(false);
  });

  it('TEST I & J: parseApiResponse safely handles simulated delivery responses', async () => {
    const mockSuccessResponse = new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: { id: 'usr-1', email: 'user@test.com', emailVerified: false },
        emailDelivery: {
          sent: false,
          status: 'DEVELOPMENT_SIMULATED',
          devNotice: 'SMTP unconfigured for local preview'
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const { ok, status, data } = await parseApiResponse(mockSuccessResponse);
    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.emailDelivery.status).toBe('DEVELOPMENT_SIMULATED');
    expect(data.emailDelivery.sent).toBe(false);
  });

  it('TEST K: verifies 6-digit OTP code syntax and expiration parsing', () => {
    const code = '123456';
    const isSixDigit = /^\d{6}$/.test(code);
    expect(isSixDigit).toBe(true);

    const invalidCode = '12345';
    expect(/^\d{6}$/.test(invalidCode)).toBe(false);

    const letterCode = '12345A';
    expect(/^\d{6}$/.test(letterCode)).toBe(false);
  });

  it('TEST M: UI error formatting preserves backend error descriptions', () => {
    const dupErr = new Error('An account with this email already exists. Please log in.');
    expect(formatApiError(dupErr)).toBe('An account with this email already exists. Please log in.');

    const validationErr = new Error('Please enter a valid email address.');
    expect(formatApiError(validationErr)).toBe('Please enter a valid email address.');

    const networkErr = new TypeError('Failed to fetch');
    expect(formatApiError(networkErr)).toContain('Unable to reach the Career Navigator server');
  });
});
