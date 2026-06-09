import { describe, it, expect } from 'vitest';
import { t } from './t.ts';

// Translation VALUES are marketing copy synced from Google Drive (the source of
// truth) and change without notice. Tests here assert `t()`'s behaviour against
// a stable, structural key — never the copy itself — so a Drive edit can't break CI.
const KNOWN_KEY = 'nav.about';

describe('t', () => {
  it('resolves a known key to a non-empty value', () => {
    const result = t(KNOWN_KEY);
    expect(result).not.toBe(KNOWN_KEY);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the key itself for an unknown key', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('defaults to the en locale when none is given', () => {
    expect(t(KNOWN_KEY)).toBe(t(KNOWN_KEY, 'en'));
  });

  it('falls back to en for an unknown locale', () => {
    expect(t(KNOWN_KEY, 'xx')).toBe(t(KNOWN_KEY, 'en'));
  });
});
