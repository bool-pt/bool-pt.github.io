import type { ConsentState } from '@bool/shared';
import { CONSENT_STORAGE_KEY } from './config';

const DEFAULT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export function getConsent(): ConsentState | null {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ConsentState;
  } catch {
    return null;
  }
}

export function setConsent(state: Omit<ConsentState, 'timestamp'>): void {
  const consentWithTimestamp: ConsentState = { ...state, timestamp: Date.now() };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentWithTimestamp));
  window.dispatchEvent(new CustomEvent('bool:consent-updated', { detail: consentWithTimestamp }));
  if (state.analytics || state.marketing) {
    window.dispatchEvent(new CustomEvent('bool:consent-granted', { detail: consentWithTimestamp }));
  }
}

export function clearConsent(): void {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('bool:consent-updated', { detail: null }));
}

export function isConsentExpired(
  consent: ConsentState,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): boolean {
  return Date.now() - consent.timestamp > maxAgeMs;
}
