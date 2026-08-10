import { useId, useRef, useState } from 'react';
import { trackEvent } from '@bool/analytics';
import { ApiError, submitNewsletter } from '@bool/api';
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
    | 'idle'
    | 'loading'
    | 'success'
    | 'error'
    | 'captcha-needed'
    | 'consent-needed'
    | 'name-needed'
    | 'email-needed'
  >('idle');
  const [emailError, setEmailError] = useState('');
  const captchaRef = useRef<CaptchaHandle>(null);

  async function handleSubmit() {
    const validation = newsletterSchema.safeParse({ name, email });
    if (!validation.success) {
      const nameIssue = validation.error.issues.find((i) => i.path[0] === 'name');
      if (nameIssue) {
        setStatus('name-needed');
      } else {
        // No dedicated locale key for an invalid newsletter email; surface the
        // schema's own message rather than the generic failure text.
        const emailIssue = validation.error.issues.find((i) => i.path[0] === 'email');
        setEmailError(emailIssue?.message ?? labels.error);
        setStatus('email-needed');
      }
      return;
    }

    if (!marketingConsent) {
      setStatus('consent-needed');
      return;
    }

    let token = captchaToken;
    if (captchaSiteKey && !token) {
      token = (await captchaRef.current?.execute()) ?? '';
    }
    if (captchaSiteKey && !token) {
      setStatus('captcha-needed');
      return;
    }

    setStatus('loading');
    try {
      await submitNewsletter({ name, email, turnstileToken: token || '' });
      trackEvent('form_submission', { type: 'newsletter' });
      setStatus('success');
      setName('');
      setEmail('');
      setCaptchaToken('');
      captchaRef.current?.reset();
    } catch (err) {
      // Token is single-use and now spent — reset the widget so the next submit
      // runs a fresh challenge. A 403 is a failed token validation, so point the
      // user at the captcha rather than showing the generic error.
      setStatus(err instanceof ApiError && err.status === 403 ? 'captcha-needed' : 'error');
      setCaptchaToken('');
      captchaRef.current?.reset();
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
  // Only mount the captcha once the user starts filling the form — avoids an
  // idle widget on every page load.
  const hasInput = name.trim() !== '' || email.trim() !== '';

  const errorClass = cn(
    styles.consentError,
    isBar ? styles.consentErrorBar : styles.consentErrorCta
  );

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
      {status === 'name-needed' && (
        <p className={cn(errorClass, styles.fieldError)}>{labels.nameRequired}</p>
      )}
      <InlineInputButton
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (status === 'email-needed') setStatus('idle');
        }}
        onSubmit={() => void handleSubmit()}
        label={labels.label}
        placeholder={labels.placeholder}
        buttonText={buttonText}
        disabled={isDisabled}
        type="email"
      />
      {status === 'email-needed' && <p className={errorClass}>{emailError}</p>}
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
      {status === 'consent-needed' && <p className={errorClass}>{labels.consentRequired}</p>}
      {captchaSiteKey && hasInput && (
        <div className={styles.captchaWrapper}>
          <Captcha
            ref={captchaRef}
            siteKey={captchaSiteKey}
            onVerify={handleCaptchaVerify}
            onExpire={handleCaptchaExpire}
            theme={isBar ? 'light' : 'dark'}
            size="flexible"
          />
        </div>
      )}
      {/* Kept outside the captcha wrapper so a failed submit is never silent,
          even when the widget is not mounted (no site key / no input yet). */}
      {status === 'captcha-needed' && <p className={errorClass}>{labels.captchaRequired}</p>}
      {status === 'error' && <p className={errorClass}>{labels.error}</p>}
    </div>
  );
}
