export const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? '';

/**
 * LinkedIn Insight Tag partner ID (from Campaign Manager). Public by design — it
 * identifies the ad account in requests the browser makes to LinkedIn.
 *
 * The tag is ad-conversion tracking, so it is gated on the `marketing` consent
 * category rather than `analytics` (see `LinkedInInsight.astro`).
 */
export const LINKEDIN_PARTNER_ID = import.meta.env.PUBLIC_LINKEDIN_PARTNER_ID ?? '';
