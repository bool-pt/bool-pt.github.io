import { describe, it, expect } from 'vitest';
import { CONSENT_ENABLED, CONSENT_CATEGORIES } from './config.ts';

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
});
