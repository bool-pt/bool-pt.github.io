import { describe, it, expect } from 'vitest';
import { buildContentSecurityPolicy } from './csp.ts';

const GOOGLE_DOMAINS = [
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'analytics.google.com',
  'stats.g.doubleclick.net',
];

describe('buildContentSecurityPolicy', () => {
  it('omits all Google Analytics domains when GA is disabled (BOOL-08)', () => {
    const csp = buildContentSecurityPolicy(false);
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).not.toContain(domain);
    }
  });

  it('includes the Google Analytics domains when GA is enabled', () => {
    const csp = buildContentSecurityPolicy(true);
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).toContain(domain);
    }
  });

  it('always keeps the core hardening directives regardless of GA', () => {
    for (const csp of [buildContentSecurityPolicy(false), buildContentSecurityPolicy(true)]) {
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      // Form API + Turnstile must always be reachable.
      expect(csp).toContain('https://*.amazonaws.com');
      expect(csp).toContain('https://challenges.cloudflare.com');
      expect(csp.endsWith(';')).toBe(true);
    }
  });
});
