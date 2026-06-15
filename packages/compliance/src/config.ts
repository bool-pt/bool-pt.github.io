/**
 * Master switch for the cookie consent UI (banner + footer "Cookie preferences").
 *
 * Set to `false` to hide the consent UI entirely. This is appropriate while the
 * site runs no consent-requiring technologies — i.e. no Google Analytics or
 * Sentry configured (their PUBLIC_* env vars unset) — so no banner is legally
 * required. Flip back to `true` to re-enable it.
 *
 * This only controls the UI. Analytics/Sentry are independently gated by their
 * env vars; keep those unset while this is `false` so nothing requiring consent
 * can run without a way for the user to grant or withdraw it.
 */
export const CONSENT_ENABLED = false;

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
