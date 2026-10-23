import { describe, it, expect } from 'vitest';
import {
  CARTOON_AVATARS,
  DEFAULT_CARTOON_AVATAR,
  getAvatarSrc,
  isLegacyStockAvatar
} from '../src/lib/avatars.js';

describe('Cartoon Avatars Library & Utilities', () => {
  it('provides at least 12 distinct cartoon avatars (actual: 16)', () => {
    expect(CARTOON_AVATARS.length).toBeGreaterThanOrEqual(12);
    expect(CARTOON_AVATARS.length).toBe(16);
  });

  it('covers all specified categories: Student, Developer, Professional, and Creative', () => {
    const categories = new Set(CARTOON_AVATARS.map((a) => a.category));
    expect(categories.has('Student')).toBe(true);
    expect(categories.has('Developer')).toBe(true);
    expect(categories.has('Professional')).toBe(true);
    expect(categories.has('Creative')).toBe(true);
  });

  it('includes required character variations (short hair, long hair, glasses, hoodie, formal attire, curly hair, gender-neutral)', () => {
    const namesAndRoles = CARTOON_AVATARS.map((a) => `${a.name} ${a.role} ${a.description}`).join(' ');

    expect(namesAndRoles).toMatch(/short hair/i);
    expect(namesAndRoles).toMatch(/long/i);
    expect(namesAndRoles).toMatch(/curly/i);
    expect(namesAndRoles).toMatch(/hoodie/i);
    expect(namesAndRoles).toMatch(/glasses|specs|wireframe/i);
    expect(namesAndRoles).toMatch(/formal|suit|blazer/i);
  });

  it('each avatar is a valid, lightweight, self-contained SVG Data URI', () => {
    for (const avatar of CARTOON_AVATARS) {
      expect(avatar.id).toBeTruthy();
      expect(avatar.name).toBeTruthy();
      expect(avatar.role).toBeTruthy();
      expect(avatar.description).toBeTruthy();
      expect(avatar.dataUri.startsWith('data:image/svg+xml;utf8,')).toBe(true);

      // Verify decode contains clean SVG markup with viewBox
      const decodedSvg = decodeURIComponent(avatar.dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('<svg');
      expect(decodedSvg).toContain('viewBox="0 0 120 120"');
      expect(decodedSvg).toContain('</svg>');
    }
  });

  it('assigns a sensible default cartoon avatar if a user has no profile picture', () => {
    expect(DEFAULT_CARTOON_AVATAR).toBeTruthy();
    expect(DEFAULT_CARTOON_AVATAR.startsWith('data:image/svg+xml;utf8,')).toBe(true);

    expect(getAvatarSrc(undefined)).toBe(DEFAULT_CARTOON_AVATAR);
    expect(getAvatarSrc(null)).toBe(DEFAULT_CARTOON_AVATAR);
    expect(getAvatarSrc('')).toBe(DEFAULT_CARTOON_AVATAR);
    expect(getAvatarSrc('   ')).toBe(DEFAULT_CARTOON_AVATAR);
  });

  it('replaces obsolete realistic Unsplash stock photo URLs with default cartoon avatar', () => {
    const legacyUnsplashUrl =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
    expect(isLegacyStockAvatar(legacyUnsplashUrl)).toBe(true);
    expect(getAvatarSrc(legacyUnsplashUrl)).toBe(DEFAULT_CARTOON_AVATAR);
  });

  it('preserves valid custom cartoon avatars and custom user images', () => {
    const selectedCartoon = CARTOON_AVATARS[4].dataUri;
    expect(getAvatarSrc(selectedCartoon)).toBe(selectedCartoon);

    const customBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    expect(getAvatarSrc(customBase64)).toBe(customBase64);

    const customHttpsUrl = 'https://custom-domain.org/my-avatar.png';
    expect(getAvatarSrc(customHttpsUrl)).toBe(customHttpsUrl);
  });
});
