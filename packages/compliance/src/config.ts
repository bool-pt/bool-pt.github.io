/**
 * Master switch for the cookie consent UI (banner + footer "Cookie preferences").
 *
 * When `true`, the consent banner is shown and the footer "Cookie preferences"
 * link is rendered, giving users a way to grant and withdraw consent at any time
 * (GDPR Art. 7(3)). The published Privacy Policy and Cookie Policy reference this
 * footer link, so it must remain `true` in production.
 *
 * Hard rule: analytics technologies must never run without this UI. Google
 * Analytics (`GoogleAnalytics.astro`) and Sentry (`BaseLayout.astro`) both guard
 * their injection on `CONSENT_ENABLED` in addition to their PUBLIC_* env vars, so
 * setting an analytics env var while this is `false` cannot silently start
 * tracking. Keep this `true` whenever PUBLIC_GA_MEASUREMENT_ID or
 * PUBLIC_SENTRY_DSN is configured.
 */
export const CONSENT_ENABLED = true;

export const CONSENT_STORAGE_KEY = 'bool-consent';

/**
 * Current consent policy version. Bump this whenever the categories, processors,
 * or purposes change so previously stored consent is invalidated and re-requested.
 */
export const CONSENT_VERSION = 1;

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
  // `available: false` keeps the category in the model but hides it from the
  // banner until the site actually uses marketing cookies. Flip to `true`
  // (and bump CONSENT_VERSION) when marketing cookies are introduced.
  marketing: {
    labelKey: 'consent.marketing.label',
    descriptionKey: 'consent.marketing.description',
    required: false,
    available: false,
  },
} as const;

/** Categories the user can toggle — excludes required ones like essential. */
export type ConsentCategory = 'analytics' | 'marketing';
