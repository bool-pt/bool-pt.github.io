import { useState } from 'react';
import { t } from '@bool/i18n';
import { CONSENT_CATEGORIES } from './config';
import type { ConsentCategory } from './config';
import styles from './CookieBanner.module.css';
import { useConsent } from './hooks';

const allCategoryKeys = Object.keys(CONSENT_CATEGORIES) as (keyof typeof CONSENT_CATEGORIES)[];
const requiredKeys = allCategoryKeys.filter((k) => CONSENT_CATEGORIES[k].required);
const optionalKeys = allCategoryKeys.filter((k) => !CONSENT_CATEGORIES[k].required) as ConsentCategory[];

export function CookieBanner() {
  const { consent, hasDecided, accept, savePreferences } = useConsent();
  const [view, setView] = useState<'initial' | 'preferences'>('initial');
  const [preferences, setPreferences] = useState<Record<ConsentCategory, boolean>>({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  const isOpen = !hasDecided;

  if (!isOpen) return null;

  function handleToggle(category: ConsentCategory) {
    setPreferences((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  function handleSave() {
    savePreferences(preferences);
  }

  return (
    <div
      role="dialog"
      aria-label={t('cookie.aria')}
      aria-live="polite"
      className={styles.banner}
    >
      {view === 'initial' ? (
        <>
          <p className={styles.message}>{t('cookie.message')}</p>
          <div className={styles.actions}>
            <button onClick={accept} className={styles.acceptButton}>
              {t('cookie.accept')}
            </button>
            <button
              onClick={() => setView('preferences')}
              className={styles.rejectButton}
            >
              {t('cookie.manage')}
            </button>
          </div>
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
            <button
              onClick={() => setView('initial')}
              className={styles.rejectButton}
            >
              {t('cookie.back')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Trigger to reopen the consent banner from anywhere (e.g. footer link). */
export function CookiePreferencesButton({ label }: { label: string }) {
  const { reset } = useConsent();

  return (
    <button onClick={reset} className={styles.preferencesButton}>
      {label}
    </button>
  );
}
