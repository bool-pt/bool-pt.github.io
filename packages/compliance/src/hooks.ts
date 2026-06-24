import { useState, useEffect, useCallback } from 'react';
import type { ConsentState } from '@bool/shared';
import { CONSENT_CATEGORIES } from './config';
import { getConsent, setConsent, clearConsent, isConsentExpired } from './consent';

export function useConsent() {
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [hasDecided, setHasDecided] = useState(false);

  useEffect(() => {
    function sync() {
      const stored = getConsent();
      if (stored && isConsentExpired(stored)) {
        clearConsent();
        setConsentState(null);
        setHasDecided(false);
      } else {
        setConsentState(stored);
        setHasDecided(stored !== null);
      }
    }

    sync();
    window.addEventListener('bool:consent-updated', sync);
    return () => window.removeEventListener('bool:consent-updated', sync);
  }, []);

  const acceptAll = useCallback(() => {
    // "Accept all" grants only the categories actually offered to the user.
    setConsent({
      analytics: CONSENT_CATEGORIES.analytics.available,
      marketing: CONSENT_CATEGORIES.marketing.available,
    });
    setConsentState(getConsent());
    setHasDecided(true);
  }, []);

  const rejectAll = useCallback(() => {
    setConsent({ analytics: false, marketing: false });
    setConsentState(getConsent());
    setHasDecided(true);
  }, []);

  const savePreferences = useCallback((preferences: { analytics: boolean; marketing: boolean }) => {
    setConsent(preferences);
    setConsentState(getConsent());
    setHasDecided(true);
  }, []);

  const reset = useCallback(() => {
    clearConsent();
    setConsentState(null);
    setHasDecided(false);
  }, []);

  return { consent, hasDecided, accept: acceptAll, reject: rejectAll, savePreferences, reset };
}
