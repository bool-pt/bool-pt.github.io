import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { trackEvent } from '@bool/analytics';
import { submitContactForm } from '@bool/api';
import {
  contactFormSchema,
  contactFormSimpleSchema,
  type ContactFormInput,
  type ContactFormSimpleInput,
} from '@bool/shared';
import Captcha from '../Captcha/Captcha';
import type { CaptchaHandle } from '../Captcha/Captcha';
import styles from './ContactForm.module.css';

type ContactFormFields = ContactFormInput & ContactFormSimpleInput;

interface ContactFormLabels {
  formAria: string;
  name: string;
  namePlaceholder: string;
  firstName: string;
  firstNamePlaceholder: string;
  lastName: string;
  lastNamePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  captchaRequired: string;
  privacyNoticeBefore: string;
  privacyNoticeLinkText: string;
  privacyNoticeAfter: string;
}

interface ContactFormProps {
  variant?: 'dark' | 'light';
  layout?: 'full' | 'simple';
  captchaSiteKey: string;
  labels: ContactFormLabels;
}

export default function ContactForm({
  variant = 'dark',
  layout = 'full',
  captchaSiteKey,
  labels,
}: ContactFormProps) {
  const formId = useId();
  const captchaRef = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const schema = layout === 'simple' ? contactFormSimpleSchema : contactFormSchema;
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful, errors },
    reset,
    setError,
  } = useForm<ContactFormFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit = useCallback(
    async (data: ContactFormFields) => {
      if (captchaSiteKey && !captchaToken) {
        setCaptchaError(true);
        return;
      }
      setCaptchaError(false);

      try {
        const name = layout === 'simple' ? data.name : `${data.firstName} ${data.lastName}`;
        await submitContactForm({
          name,
          email: data.email,
          phone: data.phone ?? undefined,
          message: data.message,
          captchaToken: captchaToken || '',
        });
        trackEvent('form_submission', { type: 'contact', layout });
        reset();
        setCaptchaToken('');
        captchaRef.current?.reset();
      } catch {
        setError('root', { message: labels.error });
      }
    },
    [captchaSiteKey, captchaToken, layout, labels.error, reset, setError],
  );

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token);
    setCaptchaError(false);
  }

  function handleCaptchaExpire() {
    setCaptchaToken('');
  }

  const inputClass = variant === 'light' ? styles.lightInput : styles.darkInput;
  const textareaClass = variant === 'light' ? styles.lightTextarea : styles.darkTextarea;
  const labelClass = variant === 'light' ? styles.lightLabel : styles.label;
  const successClass = variant === 'light' ? styles.lightSuccess : styles.success;

  if (isSubmitSuccessful) {
    return (
      <div className={successClass}>
        <CheckCircle
          size={48}
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          className={styles.successIcon}
          aria-hidden="true"
        />
        <p className={styles.successText}>{labels.success}</p>
      </div>
    );
  }

  const captchaWidget = captchaSiteKey ? (
    <div className={styles.captchaWrap}>
      <Captcha
        ref={captchaRef}
        siteKey={captchaSiteKey}
        onVerify={handleCaptchaVerify}
        onExpire={handleCaptchaExpire}
        theme={variant === 'light' ? 'light' : 'dark'}
      />
      {captchaError && <p className={styles.captchaError}>{labels.captchaRequired}</p>}
    </div>
  ) : null;

  const errorMessage = errors.root?.message && (
    <p className={styles.formError}>{errors.root.message}</p>
  );

  const privacyNotice = (
    <p className={styles.privacyNotice}>
      {labels.privacyNoticeBefore}
      <a href="/privacy" className={styles.privacyLink}>{labels.privacyNoticeLinkText}</a>
      {labels.privacyNoticeAfter}
    </p>
  );

  if (layout === 'simple') {
    return (
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className={styles.form}
        aria-label={labels.formAria}
      >
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor={`${formId}-name`} className={labelClass}>
              {labels.name}
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              placeholder={labels.namePlaceholder}
              autoComplete="name"
              className={inputClass}
              {...register('name')}
            />
            {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-email`} className={labelClass}>
              {labels.email}
            </label>
            <input
              id={`${formId}-email`}
              type="email"
              placeholder={labels.emailPlaceholder}
              autoComplete="email"
              className={inputClass}
              {...register('email')}
            />
            {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${formId}-message`} className={labelClass}>
            {labels.message}
          </label>
          <textarea
            id={`${formId}-message`}
            placeholder={labels.messagePlaceholder}
            rows={4}
            className={textareaClass}
            {...register('message')}
          />
          {errors.message && <p className={styles.fieldError}>{errors.message.message}</p>}
        </div>

        {captchaWidget}
        {errorMessage}
        {privacyNotice}

        <div>
          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            {isSubmitting ? labels.submitting : labels.submit}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className={styles.form}
      aria-label={labels.formAria}
    >
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor={`${formId}-firstName`} className={labelClass}>
            {labels.firstName}
          </label>
          <input
            id={`${formId}-firstName`}
            type="text"
            placeholder={labels.firstNamePlaceholder}
            autoComplete="given-name"
            className={inputClass}
            {...register('firstName')}
          />
          {errors.firstName && <p className={styles.fieldError}>{errors.firstName.message}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${formId}-lastName`} className={labelClass}>
            {labels.lastName}
          </label>
          <input
            id={`${formId}-lastName`}
            type="text"
            placeholder={labels.lastNamePlaceholder}
            autoComplete="family-name"
            className={inputClass}
            {...register('lastName')}
          />
          {errors.lastName && <p className={styles.fieldError}>{errors.lastName.message}</p>}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor={`${formId}-phone`} className={labelClass}>
            {labels.phone}
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            placeholder={labels.phonePlaceholder}
            autoComplete="tel"
            className={inputClass}
            {...register('phone')}
          />
          {errors.phone && <p className={styles.fieldError}>{errors.phone.message}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${formId}-email`} className={labelClass}>
            {labels.email}
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            placeholder={labels.emailPlaceholder}
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
          {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-message`} className={labelClass}>
          {labels.message}
        </label>
        <textarea
          id={`${formId}-message`}
          placeholder={labels.messagePlaceholder}
          rows={4}
          className={textareaClass}
          {...register('message')}
        />
        {errors.message && <p className={styles.fieldError}>{errors.message.message}</p>}
      </div>

      {captchaWidget}
      {errorMessage}
      {privacyNotice}

      <div>
        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
          {isSubmitting ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
}
