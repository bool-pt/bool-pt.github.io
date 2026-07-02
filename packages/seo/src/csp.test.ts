import { describe, it, expect } from 'vitest';
import { buildContentSecurityPolicy } from './csp.ts';

const GOOGLE_DOMAINS = [
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'analytics.google.com',
  'stats.g.doubleclick.net',
];

const API_ORIGIN = 'https://upci9flznj.execute-api.eu-west-3.amazonaws.com';

describe('buildContentSecurityPolicy', () => {
  it('omits all Google Analytics domains when GA is disabled (BOOL-08)', () => {
    const csp = buildContentSecurityPolicy(false, API_ORIGIN);
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).not.toContain(domain);
    }
  });

  it('includes the Google Analytics domains when GA is enabled', () => {
    const csp = buildContentSecurityPolicy(true, API_ORIGIN);
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).toContain(domain);
    }
  });

  it('pins connect-src to the exact API origin, not all of *.amazonaws.com', () => {
    const csp = buildContentSecurityPolicy(false, API_ORIGIN);
    expect(csp).toContain(API_ORIGIN);
    expect(csp).not.toContain('*.amazonaws.com');
  });

  it('omits the API origin when none is provided (local dev)', () => {
    const csp = buildContentSecurityPolicy(false, '');
    expect(csp).not.toContain('amazonaws.com');
    // connect-src still exists with self + Turnstile.
    expect(csp).toContain("connect-src 'self' https://challenges.cloudflare.com");
  });

  it('always keeps the core hardening directives regardless of GA', () => {
    for (const csp of [
      buildContentSecurityPolicy(false, API_ORIGIN),
      buildContentSecurityPolicy(true, API_ORIGIN),
    ]) {
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      // Form API + Turnstile must always be reachable.
      expect(csp).toContain(API_ORIGIN);
      expect(csp).toContain('https://challenges.cloudflare.com');
      expect(csp.endsWith(';')).toBe(true);
    }
  });
});
