import { describe, it, expect, beforeEach } from 'vitest';
import { setStoredLocale, getLocaleFromUrl, buildLocalizedPath } from './locale';

const SUPPORTED = ['en', 'pt'];
const DEFAULT = 'en';

describe('setStoredLocale', () => {
  beforeEach(() => localStorage.clear());

  it('persists the locale under the "locale" key', () => {
    setStoredLocale('pt');
    expect(localStorage.getItem('locale')).toBe('pt');
  });
});

describe('getLocaleFromUrl', () => {
  it('returns the leading path segment when it is a supported locale', () => {
    expect(getLocaleFromUrl('/pt/about', SUPPORTED, DEFAULT)).toBe('pt');
  });

  it('returns the default locale when the first segment is not a locale', () => {
    expect(getLocaleFromUrl('/about', SUPPORTED, DEFAULT)).toBe('en');
  });

  it('returns the default locale for the root path', () => {
    expect(getLocaleFromUrl('/', SUPPORTED, DEFAULT)).toBe('en');
  });
});

describe('buildLocalizedPath', () => {
  it('prefixes a non-default target locale onto a default-locale path', () => {
    expect(buildLocalizedPath('/about', 'pt', DEFAULT, SUPPORTED)).toBe('/pt/about');
  });

  it('strips the locale prefix when switching back to the default locale', () => {
    expect(buildLocalizedPath('/pt/about', 'en', DEFAULT, SUPPORTED)).toBe('/about');
  });

  it('keeps a default-locale path unchanged when target is also default', () => {
    expect(buildLocalizedPath('/about', 'en', DEFAULT, SUPPORTED)).toBe('/about');
  });

  it('returns "/" when switching a non-default root back to default', () => {
    expect(buildLocalizedPath('/pt', 'en', DEFAULT, SUPPORTED)).toBe('/');
  });

  it('builds a non-default path from the default root', () => {
    expect(buildLocalizedPath('/', 'pt', DEFAULT, SUPPORTED)).toBe('/pt/');
  });
});
