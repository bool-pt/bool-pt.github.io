import { useState, useEffect, useCallback } from 'react';
import type { ConsentState } from '@bool/shared';
import { getConsent, setConsent, clearConsent, isConsentExpired } from './consent';

export function useConsent() {
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [hasDecided, setHasDecided] = useState(false);

  useEffect(() => {
    const stored = getConsent();
    if (stored && isConsentExpired(stored)) {
      clearConsent();
      setConsentState(null);
      setHasDecided(false);
    } else {
      setConsentState(stored);
      setHasDecided(stored !== null);
    }
  }, []);

  const acceptAll = useCallback(() => {
    setConsent({ analytics: true, marketing: true });
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
