import { describe, it, expect } from 'vitest';
import { sitemapConfig } from './sitemap';

describe('sitemapConfig.filter', () => {
  it('excludes 404 pages (default and localized)', () => {
    expect(sitemapConfig.filter('https://bool.pt/404')).toBe(false);
    expect(sitemapConfig.filter('https://bool.pt/pt/404')).toBe(false);
  });

  it('keeps normal pages', () => {
    expect(sitemapConfig.filter('https://bool.pt/')).toBe(true);
    expect(sitemapConfig.filter('https://bool.pt/about')).toBe(true);
    expect(sitemapConfig.filter('https://bool.pt/pt/services')).toBe(true);
  });
});
