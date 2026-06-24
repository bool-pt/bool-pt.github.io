import { describe, it, expect } from 'vitest';
import { defaultLocale, locales, isValidLocale, LOCALE_META } from './config.ts';

describe('i18n config', () => {
  it('has en as default locale', () => {
    expect(defaultLocale).toBe('en');
  });

  it('includes en in locales', () => {
    expect(locales).toContain('en');
  });

  it('validates en as a valid locale', () => {
    expect(isValidLocale('en')).toBe(true);
  });

  it('rejects invalid locale', () => {
    expect(isValidLocale('xx')).toBe(false);
  });

  it('auto-discovers locale metadata from JSON files', () => {
    expect(LOCALE_META['en']).toEqual({ flag: '🇬🇧', name: 'English' });
  });

  it('has matching locales and LOCALE_META keys', () => {
    for (const locale of locales) {
      expect(LOCALE_META[locale]).toBeDefined();
    }
  });
});
