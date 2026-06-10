import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CheckCircle, ChevronDown, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { trackEvent } from '@bool/analytics';
import { submitEventSchedule } from '@bool/api';
import Captcha from '../Captcha/Captcha';
import type { CaptchaHandle } from '../Captcha/Captcha';
import styles from './EventScheduleModal.module.css';

export interface EventScheduleLabels {
  eyebrow: string;
  subtitle: string;
  close: string;
  formAria: string;
  fullName: string;
  fullNamePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  time: string;
  timePlaceholder: string;
  timeOptions: string[];
  message: string;
  messagePlaceholder: string;
  submit: string;
  success: string;
  required: string;
  emailInvalid: string;
  captchaRequired: string;
  error: string;
}

interface FormFields {
  fullName: string;
  phone: string;
  email: string;
  time: string;
  message: string;
}

/** Event detail dispatched by the "Meet us there" triggers in EventsSection. */
interface OpenEventDetail {
  title?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  labels: EventScheduleLabels;
  captchaSiteKey: string;
}

export default function EventScheduleModal({ labels, captchaSiteKey }: Props) {
  const formId = useId();
  const captchaRef = useRef<CaptchaHandle>(null);
  const [open, setOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>();

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<OpenEventDetail>).detail;
      setEventTitle(detail?.title ?? '');
      setSubmitted(false);
      setCaptchaToken('');
      setCaptchaError(false);
      reset();
      setOpen(true);
    }
    window.addEventListener('bool:open-event-schedule', handleOpen);
    return () => window.removeEventListener('bool:open-event-schedule', handleOpen);
  }, [reset]);

  async function onSubmit(data: FormFields) {
    if (captchaSiteKey && !captchaToken) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);

    try {
      await submitEventSchedule({
        eventName: eventTitle,
        name: data.fullName,
        phone: data.phone,
        email: data.email,
        timeSuggestion: data.time,
        message: data.message,
        turnstileToken: captchaToken || '',
      });
      trackEvent('form_submission', { type: 'event' });
      setSubmitted(true);
    } catch {
      setError('root', { message: labels.error });
      setCaptchaToken('');
      captchaRef.current?.reset();
    }
  }

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token);
    setCaptchaError(false);
  }

  function handleCaptchaExpire() {
    setCaptchaToken('');
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setSubmitted(false);
      setCaptchaToken('');
      setCaptchaError(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content className={styles.dialog} aria-describedby={undefined}>
          <DialogPrimitive.Close className={styles.closeButton} aria-label={labels.close}>
            <X size={24} aria-hidden="true" />
          </DialogPrimitive.Close>

          <span className={styles.eyebrow}>{labels.eyebrow}</span>
          <DialogPrimitive.Title className={styles.title}>{eventTitle}</DialogPrimitive.Title>
          <p className={styles.subtitle}>{labels.subtitle}</p>

          {submitted ? (
            <div className={styles.success}>
              <CheckCircle
                size={48}
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className={styles.successText}>{labels.success}</p>
            </div>
          ) : (
            <form
              className={styles.form}
              aria-label={labels.formAria}
              onSubmit={(e) => void handleSubmit(onSubmit)(e)}
              noValidate
            >
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor={`${formId}-fullName`} className={styles.label}>
                    {labels.fullName}
                  </label>
                  <input
                    id={`${formId}-fullName`}
                    type="text"
                    autoComplete="name"
                    placeholder={labels.fullNamePlaceholder}
                    className={styles.input}
                    {...register('fullName', { required: labels.required })}
                  />
                  {errors.fullName && (
                    <p className={styles.fieldError}>{errors.fullName.message}</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-phone`} className={styles.label}>
                    {labels.phone}
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    autoComplete="tel"
                    placeholder={labels.phonePlaceholder}
                    className={styles.input}
                    {...register('phone')}
                  />
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor={`${formId}-email`} className={styles.label}>
                    {labels.email}
                  </label>
                  <input
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder={labels.emailPlaceholder}
                    className={styles.input}
                    {...register('email', {
                      required: labels.required,
                      pattern: { value: EMAIL_PATTERN, message: labels.emailInvalid },
                    })}
                  />
                  {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-time`} className={styles.label}>
                    {labels.time}
                  </label>
                  <div className={styles.selectWrap}>
                    <select
                      id={`${formId}-time`}
                      defaultValue=""
                      className={styles.select}
                      {...register('time', { required: labels.required })}
                    >
                      <option value="" disabled>
                        {labels.timePlaceholder}
                      </option>
                      {labels.timeOptions.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} className={styles.selectIcon} aria-hidden="true" />
                  </div>
                  {errors.time && <p className={styles.fieldError}>{errors.time.message}</p>}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor={`${formId}-message`} className={styles.label}>
                  {labels.message}
                </label>
                <textarea
                  id={`${formId}-message`}
                  rows={4}
                  placeholder={labels.messagePlaceholder}
                  className={styles.textarea}
                  {...register('message', { required: labels.required })}
                />
                {errors.message && <p className={styles.fieldError}>{errors.message.message}</p>}
              </div>

              {captchaSiteKey && (
                <div className={styles.field}>
                  <Captcha
                    ref={captchaRef}
                    siteKey={captchaSiteKey}
                    onVerify={handleCaptchaVerify}
                    onExpire={handleCaptchaExpire}
                    theme="dark"
                    size="compact"
                  />
                  {captchaError && <p className={styles.fieldError}>{labels.captchaRequired}</p>}
                </div>
              )}

              {errors.root && <p className={styles.fieldError}>{errors.root.message}</p>}

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {labels.submit}
              </button>
            </form>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
