import { describe, it, expect } from 'vitest';
import { buildContentSecurityPolicy } from './csp.ts';

const GOOGLE_DOMAINS = [
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'analytics.google.com',
  'stats.g.doubleclick.net',
];

const LINKEDIN_DOMAINS = [
  'snap.licdn.com',
  'px.ads.linkedin.com',
  'px4.ads.linkedin.com',
  'www.linkedin.com',
];

const API_ORIGIN = 'https://upci9flznj.execute-api.eu-west-3.amazonaws.com';

const policy = (overrides: Partial<Parameters<typeof buildContentSecurityPolicy>[0]> = {}) =>
  buildContentSecurityPolicy({
    gaEnabled: false,
    linkedInEnabled: false,
    apiOrigin: API_ORIGIN,
    ...overrides,
  });

describe('buildContentSecurityPolicy', () => {
  it('omits all Google Analytics domains when GA is disabled (BOOL-08)', () => {
    const csp = policy();
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).not.toContain(domain);
    }
  });

  it('includes the Google Analytics domains when GA is enabled', () => {
    const csp = policy({ gaEnabled: true });
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).toContain(domain);
    }
  });

  it('omits all LinkedIn Insight Tag domains when LinkedIn is disabled', () => {
    const csp = policy({ gaEnabled: true });
    for (const domain of LINKEDIN_DOMAINS) {
      expect(csp).not.toContain(domain);
    }
  });

  it('includes the LinkedIn Insight Tag domains when LinkedIn is enabled', () => {
    const csp = policy({ linkedInEnabled: true });
    for (const domain of LINKEDIN_DOMAINS) {
      expect(csp).toContain(domain);
    }
  });

  it('keeps each tracker independent — enabling LinkedIn never widens to Google', () => {
    const csp = policy({ linkedInEnabled: true });
    for (const domain of GOOGLE_DOMAINS) {
      expect(csp).not.toContain(domain);
    }
  });

  it('allows the LinkedIn script only in script-src, not the pixel hosts', () => {
    const csp = policy({ linkedInEnabled: true });
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'));
    expect(scriptSrc).toContain('https://snap.licdn.com');
    expect(scriptSrc).not.toContain('px.ads.linkedin.com');
  });

  it('pins connect-src to the exact API origin, not all of *.amazonaws.com', () => {
    const csp = policy();
    expect(csp).toContain(API_ORIGIN);
    expect(csp).not.toContain('*.amazonaws.com');
  });

  it('omits the API origin when none is provided (local dev)', () => {
    const csp = policy({ apiOrigin: '' });
    expect(csp).not.toContain('amazonaws.com');
    // connect-src still exists with self + Turnstile.
    expect(csp).toContain("connect-src 'self' https://challenges.cloudflare.com");
  });

  it('always keeps the core hardening directives regardless of trackers', () => {
    for (const csp of [
      policy(),
      policy({ gaEnabled: true }),
      policy({ linkedInEnabled: true }),
      policy({ gaEnabled: true, linkedInEnabled: true }),
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
