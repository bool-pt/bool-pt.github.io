import { useId, useRef, useState } from 'react';
import { trackEvent } from '@bool/analytics';
import { submitNewsletter } from '@bool/api';
import { newsletterSchema, ROUTES } from '@bool/shared';
import { cn } from '@bool/shared';
import { InlineInputButton } from '../../primitives/InlineInputButton/InlineInputButton';
import Captcha from '../Captcha/Captcha';
import type { CaptchaHandle } from '../Captcha/Captcha';
import styles from './NewsletterForm.module.css';

interface NewsletterLabels {
  subscribed: string;
  loading: string;
  ctaBar: string;
  ctaCta: string;
  label: string;
  placeholder: string;
  nameLabel: string;
  namePlaceholder: string;
  nameRequired: string;
  captchaRequired: string;
  error: string;
  consentBefore: string;
  consentLinkText: string;
  consentAfter: string;
  consentRequired: string;
}

interface Props {
  variant?: 'bar' | 'cta';
  captchaSiteKey: string;
  labels: NewsletterLabels;
}

export default function NewsletterForm({ variant = 'bar', captchaSiteKey, labels }: Props) {
  const nameInputId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error' | 'captcha-needed' | 'consent-needed' | 'name-needed'
  >('idle');
  const captchaRef = useRef<CaptchaHandle>(null);

  async function handleSubmit() {
    const validation = newsletterSchema.safeParse({ name, email });
    if (!validation.success) {
      const hasNameIssue = validation.error.issues.some((i) => i.path[0] === 'name');
      setStatus(hasNameIssue ? 'name-needed' : 'error');
      return;
    }

    if (!marketingConsent) {
      setStatus('consent-needed');
      return;
    }

    if (captchaSiteKey && !captchaToken) {
      setStatus('captcha-needed');
      return;
    }

    setStatus('loading');
    try {
      await submitNewsletter({ name, email, captchaToken: captchaToken || '' });
      trackEvent('form_submission', { type: 'newsletter' });
      setStatus('success');
      setName('');
      setEmail('');
      setCaptchaToken('');
      captchaRef.current?.reset();
    } catch {
      setStatus('error');
    }
  }

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token);
    if (status === 'captcha-needed') {
      setStatus('idle');
    }
  }

  function handleCaptchaExpire() {
    setCaptchaToken('');
  }

  const isBar = variant === 'bar';
  const isDisabled = status === 'loading' || status === 'success';

  const buttonText =
    status === 'success'
      ? labels.subscribed
      : status === 'loading'
        ? labels.loading
        : isBar
          ? labels.ctaBar
          : labels.ctaCta;

  return (
    <div>
      <div className={styles.nameField}>
        <label htmlFor={nameInputId} className={styles.srOnly}>
          {labels.nameLabel}
        </label>
        <input
          id={nameInputId}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (status === 'name-needed') setStatus('idle');
          }}
          placeholder={labels.namePlaceholder}
          disabled={isDisabled}
          autoComplete="name"
          className={styles.nameInput}
        />
      </div>
      {status === 'name-needed' && <p className={styles.consentError}>{labels.nameRequired}</p>}
      <InlineInputButton
        value={email}
        onChange={setEmail}
        onSubmit={() => void handleSubmit()}
        label={labels.label}
        placeholder={labels.placeholder}
        buttonText={buttonText}
        disabled={isDisabled}
        type="email"
      />
      <label
        className={cn(styles.consentLabel, isBar ? styles.consentLabelBar : styles.consentLabelCta)}
      >
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => {
            setMarketingConsent(e.target.checked);
            if (e.target.checked && status === 'consent-needed') setStatus('idle');
          }}
          className={styles.checkbox}
        />
        <span>
          {labels.consentBefore}
          <a href={ROUTES.privacy} className={styles.consentLink}>
            {labels.consentLinkText}
          </a>
          {labels.consentAfter}
        </span>
      </label>
      {status === 'consent-needed' && (
        <p className={styles.consentError}>{labels.consentRequired}</p>
      )}
      {captchaSiteKey && (
        <div className={styles.captchaWrapper}>
          <Captcha
            ref={captchaRef}
            siteKey={captchaSiteKey}
            onVerify={handleCaptchaVerify}
            onExpire={handleCaptchaExpire}
            theme={isBar ? 'light' : 'dark'}
            size="compact"
          />
          {status === 'captcha-needed' && (
            <p className={styles.consentError}>{labels.captchaRequired}</p>
          )}
          {status === 'error' && <p className={styles.consentError}>{labels.error}</p>}
        </div>
      )}
    </div>
  );
}
