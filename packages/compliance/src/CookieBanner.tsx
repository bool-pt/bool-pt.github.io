import { useState, useEffect } from 'react';
import { t } from '@bool/i18n';
import { CONSENT_CATEGORIES } from './config';
import type { ConsentCategory } from './config';
import { getConsent } from './consent';
import styles from './CookieBanner.module.css';
import { useConsent } from './hooks';

const allCategoryKeys = Object.keys(CONSENT_CATEGORIES) as (keyof typeof CONSENT_CATEGORIES)[];
const requiredKeys = allCategoryKeys.filter((k) => CONSENT_CATEGORIES[k].required);
const optionalKeys = allCategoryKeys.filter(
  (k) => !CONSENT_CATEGORIES[k].required && CONSENT_CATEGORIES[k].available
) as ConsentCategory[];

export function CookieBanner() {
  const { consent, hasDecided, accept, reject, savePreferences } = useConsent();
  const [view, setView] = useState<'initial' | 'preferences'>('initial');
  const [forcedOpen, setForcedOpen] = useState(false);
  const [preferences, setPreferences] = useState<Record<ConsentCategory, boolean>>({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleOpenPreferences() {
      const stored = getConsent();
      setPreferences({
        analytics: stored?.analytics ?? false,
        marketing: stored?.marketing ?? false,
      });
      setView('preferences');
      setForcedOpen(true);
    }
    window.addEventListener('bool:open-preferences', handleOpenPreferences);
    return () => window.removeEventListener('bool:open-preferences', handleOpenPreferences);
  }, []);

  const isOpen = !hasDecided || forcedOpen;

  if (!mounted || !isOpen) return null;

  function handleToggle(category: ConsentCategory) {
    setPreferences((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  function handleSave() {
    // Never record consent for a category the user wasn't shown.
    savePreferences({
      analytics: CONSENT_CATEGORIES.analytics.available ? preferences.analytics : false,
      marketing: CONSENT_CATEGORIES.marketing.available ? preferences.marketing : false,
    });
    setForcedOpen(false);
  }

  function handleBack() {
    if (forcedOpen && hasDecided) {
      setForcedOpen(false);
    } else {
      setView('initial');
    }
  }

  return (
    <div role="region" aria-label={t('cookie.aria')} className={styles.banner}>
      {view === 'initial' ? (
        <>
          <p className={styles.message}>{t('cookie.message')}</p>
          <div className={styles.actions}>
            <button onClick={accept} className={styles.acceptButton}>
              {t('cookie.accept')}
            </button>
            <button onClick={reject} className={styles.rejectButton}>
              {t('cookie.reject')}
            </button>
          </div>
          <button onClick={() => setView('preferences')} className={styles.manageLink}>
            {t('cookie.manage')}
          </button>
        </>
      ) : (
        <>
          <p className={styles.message}>{t('cookie.manage')}</p>
          <div className={styles.categories}>
            {requiredKeys.map((key) => {
              const category = CONSENT_CATEGORIES[key];
              return (
                <label key={key} className={styles.category}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryLabel}>{t(category.labelKey)}</span>
                    <span className={styles.categoryDescription}>{t(category.descriptionKey)}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className={styles.toggle}
                    aria-label={t(category.labelKey)}
                  />
                </label>
              );
            })}
            {optionalKeys.map((key) => {
              const category = CONSENT_CATEGORIES[key];
              return (
                <label key={key} className={styles.category}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryLabel}>{t(category.labelKey)}</span>
                    <span className={styles.categoryDescription}>{t(category.descriptionKey)}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => handleToggle(key)}
                    className={styles.toggle}
                  />
                </label>
              );
            })}
          </div>
          <div className={styles.actions}>
            <button onClick={handleSave} className={styles.acceptButton}>
              {t('cookie.save')}
            </button>
            <button onClick={handleBack} className={styles.rejectButton}>
              {t('cookie.back')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Opens the manage-preferences panel directly (e.g. from footer). */
export function CookiePreferencesButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('bool:open-preferences'))}
      className={styles.preferencesButton}
    >
      {label}
    </button>
  );
}
