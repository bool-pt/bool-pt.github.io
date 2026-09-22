import { describe, it, expect } from 'vitest';
import { CONSENT_ENABLED, CONSENT_CATEGORIES, CONSENT_VERSION } from './config.ts';

describe('consent configuration (BOOL-01 / BOOL-06)', () => {
  it('keeps the consent UI enabled so the promised withdrawal mechanism exists', () => {
    // The published Privacy & Cookie policies promise a footer "Cookie preferences"
    // link (GDPR Art. 7(3)). That link, the banner, and the GA/Sentry consent gates
    // all key off this flag — flipping it to false reintroduces BOOL-01.
    expect(CONSENT_ENABLED).toBe(true);
  });

  it('exposes a toggleable analytics category for the banner', () => {
    expect(CONSENT_CATEGORIES.analytics.available).toBe(true);
    expect(CONSENT_CATEGORIES.analytics.required).toBe(false);
  });

  it('exposes a toggleable marketing category, since the LinkedIn Insight Tag needs one', () => {
    // The Insight Tag is ad-conversion tracking gated on `marketing`. Hiding this
    // category while PUBLIC_LINKEDIN_PARTNER_ID is set would make the tag
    // unreachable AND contradict the published Cookie Policy, which documents it.
    expect(CONSENT_CATEGORIES.marketing.available).toBe(true);
    expect(CONSENT_CATEGORIES.marketing.required).toBe(false);
  });

  it('is on a policy version that post-dates the marketing category becoming visible', () => {
    // Consent stored under v1 was never asked about marketing, so it must not
    // carry over. Bumping this is what re-prompts those visitors.
    expect(CONSENT_VERSION).toBeGreaterThanOrEqual(2);
  });
});
