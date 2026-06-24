import type { ConsentState } from '@bool/shared';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './config';

const DEFAULT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function isValidConsent(value: unknown): value is ConsentState {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.analytics === 'boolean' &&
    typeof obj.marketing === 'boolean' &&
    typeof obj.timestamp === 'number' &&
    Number.isFinite(obj.timestamp) &&
    obj.version === CONSENT_VERSION
  );
}

export function getConsent(): ConsentState | null {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    // A version mismatch (or any malformed record) is treated as "no decision",
    // which re-prompts the user against the current policy.
    return isValidConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setConsent(state: Omit<ConsentState, 'timestamp' | 'version'>): void {
  const previous = getConsent();
  const record: ConsentState = { ...state, timestamp: Date.now(), version: CONSENT_VERSION };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent('bool:consent-updated', { detail: record }));
  if (state.analytics || state.marketing) {
    window.dispatchEvent(new CustomEvent('bool:consent-granted', { detail: record }));
  }
  // Fire a revoke event for any category that was previously granted and is now
  // denied, so already-loaded trackers (GA, Sentry) can tear themselves down.
  const analyticsRevoked = previous?.analytics === true && state.analytics === false;
  const marketingRevoked = previous?.marketing === true && state.marketing === false;
  if (analyticsRevoked || marketingRevoked) {
    window.dispatchEvent(
      new CustomEvent('bool:consent-revoked', {
        detail: { analytics: analyticsRevoked, marketing: marketingRevoked },
      })
    );
  }
}

export function clearConsent(): void {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('bool:consent-updated', { detail: null }));
}

export function isConsentExpired(
  consent: ConsentState,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): boolean {
  return Date.now() - consent.timestamp > maxAgeMs;
}
