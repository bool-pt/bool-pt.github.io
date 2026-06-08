import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CheckCircle, ChevronDown, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
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
}

export default function EventScheduleModal({ labels }: Props) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormFields>();

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<OpenEventDetail>).detail;
      setEventTitle(detail?.title ?? '');
      reset();
      setOpen(true);
    }
    window.addEventListener('bool:open-event-schedule', handleOpen);
    return () => window.removeEventListener('bool:open-event-schedule', handleOpen);
  }, [reset]);

  // UI-only: no network call. A successful submit flips isSubmitSuccessful and
  // swaps the form for the confirmation view.
  function onSubmit() {}

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
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

          {isSubmitSuccessful ? (
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

              <button type="submit" className={styles.submitBtn}>
                {labels.submit}
              </button>
            </form>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
