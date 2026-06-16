import { describe, it, expect, beforeEach } from 'vitest';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './config';
import { getConsent, setConsent, clearConsent, isConsentExpired } from './consent';

describe('consent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no consent stored', () => {
    expect(getConsent()).toBeNull();
  });

  it('stores and retrieves consent', () => {
    setConsent({ analytics: true, marketing: false });
    const consent = getConsent();
    expect(consent).not.toBeNull();
    expect(consent?.analytics).toBe(true);
    expect(consent?.marketing).toBe(false);
    expect(consent?.timestamp).toBeGreaterThan(0);
  });

  it('clears consent', () => {
    setConsent({ analytics: true, marketing: true });
    expect(getConsent()).not.toBeNull();
    clearConsent();
    expect(getConsent()).toBeNull();
  });

  it('uses the correct storage key', () => {
    setConsent({ analytics: true, marketing: true });
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored ?? '');
    expect(parsed.analytics).toBe(true);
  });

  it('returns null for corrupted storage', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'not-json');
    expect(getConsent()).toBeNull();
  });

  it('stamps the current policy version on setConsent', () => {
    setConsent({ analytics: true, marketing: false });
    expect(getConsent()?.version).toBe(CONSENT_VERSION);
  });

  it('returns null when the stored consent version does not match', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: true,
        marketing: true,
        timestamp: Date.now(),
        version: CONSENT_VERSION + 1,
      })
    );
    expect(getConsent()).toBeNull();
  });

  it('dispatches consent-revoked when a granted category is later denied', () => {
    setConsent({ analytics: true, marketing: false });

    let revokedDetail: unknown = null;
    window.addEventListener('bool:consent-revoked', ((e: CustomEvent) => {
      revokedDetail = e.detail;
    }) as EventListener);

    setConsent({ analytics: false, marketing: false });
    expect(revokedDetail).toMatchObject({ analytics: true, marketing: false });
  });

  it('does not dispatch consent-revoked when no category is downgraded', () => {
    let revokedFired = false;
    window.addEventListener('bool:consent-revoked', () => {
      revokedFired = true;
    });

    setConsent({ analytics: false, marketing: false });
    setConsent({ analytics: true, marketing: true });
    expect(revokedFired).toBe(false);
  });

  it('dispatches consent-updated event on setConsent', () => {
    let eventDetail: unknown = null;
    window.addEventListener('bool:consent-updated', ((e: CustomEvent) => {
      eventDetail = e.detail;
    }) as EventListener);

    setConsent({ analytics: true, marketing: false });
    expect(eventDetail).toMatchObject({ analytics: true, marketing: false });
  });

  it('dispatches consent-updated event with null on clearConsent', () => {
    let eventDetail: unknown = 'not-called';
    setConsent({ analytics: true, marketing: true });
    window.addEventListener('bool:consent-updated', ((e: CustomEvent) => {
      eventDetail = e.detail;
    }) as EventListener);

    clearConsent();
    expect(eventDetail).toBeNull();
  });

  it('detects expired consent', () => {
    const expired = {
      analytics: true,
      marketing: true,
      timestamp: Date.now() - 400 * 24 * 60 * 60 * 1000,
      version: CONSENT_VERSION,
    };
    expect(isConsentExpired(expired)).toBe(true);
  });

  it('detects valid consent', () => {
    const fresh = {
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    expect(isConsentExpired(fresh)).toBe(false);
  });

  it('accepts custom max age', () => {
    const recent = {
      analytics: true,
      marketing: true,
      timestamp: Date.now() - 5000,
      version: CONSENT_VERSION,
    };
    expect(isConsentExpired(recent, 1000)).toBe(true);
    expect(isConsentExpired(recent, 10000)).toBe(false);
  });

  it('dispatches consent-granted when at least one category is true', () => {
    let grantedFired = false;
    window.addEventListener('bool:consent-granted', () => {
      grantedFired = true;
    });

    setConsent({ analytics: true, marketing: false });
    expect(grantedFired).toBe(true);
  });

  it('does not dispatch consent-granted when all categories are false', () => {
    let grantedFired = false;
    window.addEventListener('bool:consent-granted', () => {
      grantedFired = true;
    });

    setConsent({ analytics: false, marketing: false });
    expect(grantedFired).toBe(false);
  });
});
