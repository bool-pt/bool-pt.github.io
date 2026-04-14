import { describe, it, expect } from 'vitest';
import { t } from './t.ts';

describe('t', () => {
  it('returns translated string for known key', () => {
    expect(t('nav.about')).toBe('About');
  });

  it('returns key itself for unknown key', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('defaults to en locale', () => {
    const result = t('hero.slides.1.title');
    expect(result).toBe('We get it done!');
  });

  it('falls back to en for unknown locale', () => {
    const result = t('nav.about', 'en');
    expect(result).toBe('About');
  });
});
