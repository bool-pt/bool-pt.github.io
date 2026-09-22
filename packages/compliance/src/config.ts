/**
 * Master switch for the cookie consent UI (banner + footer "Cookie preferences").
 *
 * When `true`, the consent banner is shown and the footer "Cookie preferences"
 * link is rendered, giving users a way to grant and withdraw consent at any time
 * (GDPR Art. 7(3)). The published Privacy Policy and Cookie Policy reference this
 * footer link, so it must remain `true` in production.
 *
 * Hard rule: tracking technologies must never run without this UI. Every tracker
 * loads through `onConsentGranted` (`consent-gate.ts`), which returns early when
 * this is `false`, and Sentry (`BaseLayout.astro`) guards on it directly — so
 * setting a tracking env var while this is `false` cannot silently start tracking.
 * Keep this `true` whenever PUBLIC_GA_MEASUREMENT_ID, PUBLIC_SENTRY_DSN or
 * PUBLIC_LINKEDIN_PARTNER_ID is configured.
 */
export const CONSENT_ENABLED = true;

export const CONSENT_STORAGE_KEY = 'bool-consent';

/** Fired when a category is granted; detail is the full stored consent record. */
export const CONSENT_GRANTED_EVENT = 'bool:consent-granted';

/** Fired when a previously granted category is withdrawn; detail is `{ analytics, marketing }`. */
export const CONSENT_REVOKED_EVENT = 'bool:consent-revoked';

/**
 * Current consent policy version. Bump this whenever the categories, processors,
 * or purposes change so previously stored consent is invalidated and re-requested.
 *
 * v2 — the LinkedIn Insight Tag introduced marketing cookies, so the Marketing
 * category became visible in the banner and LinkedIn was added to the Cookie and
 * Privacy policies. Consent collected under v1 was never asked about marketing,
 * so it cannot carry over.
 */
export const CONSENT_VERSION = 2;

export const CONSENT_CATEGORIES = {
  essential: {
    labelKey: 'consent.essential.label',
    descriptionKey: 'consent.essential.description',
    required: true,
    available: true,
  },
  analytics: {
    labelKey: 'consent.analytics.label',
    descriptionKey: 'consent.analytics.description',
    required: false,
    available: true,
  },
  // Visible since CONSENT_VERSION 2: the LinkedIn Insight Tag
  // (`LinkedInInsight.astro`) is ad-conversion tracking, not analytics, so it is
  // gated on this category rather than on `analytics`.
  marketing: {
    labelKey: 'consent.marketing.label',
    descriptionKey: 'consent.marketing.description',
    required: false,
    available: true,
  },
} as const;

/** Categories the user can toggle — excludes required ones like essential. */
export type ConsentCategory = 'analytics' | 'marketing';
