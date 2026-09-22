export { CookieBanner, CookiePreferencesButton } from './src/CookieBanner.tsx';
export { getConsent, setConsent, clearConsent, isConsentExpired } from './src/consent.ts';
export { useConsent } from './src/hooks.ts';
export { onConsentGranted, onConsentRevoked, deleteCookies } from './src/consent-gate.ts';
export {
  CONSENT_ENABLED,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  CONSENT_CATEGORIES,
} from './src/config.ts';
export type { ConsentCategory } from './src/config.ts';
