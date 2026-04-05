export const CONSENT_STORAGE_KEY = 'bool-consent';

export const CONSENT_CATEGORIES = {
  essential: {
    labelKey: 'consent.essential.label',
    descriptionKey: 'consent.essential.description',
    required: true,
  },
  analytics: {
    labelKey: 'consent.analytics.label',
    descriptionKey: 'consent.analytics.description',
    required: false,
  },
  marketing: {
    labelKey: 'consent.marketing.label',
    descriptionKey: 'consent.marketing.description',
    required: false,
  },
} as const;

/** Categories the user can toggle — excludes required ones like essential. */
export type ConsentCategory = 'analytics' | 'marketing';
