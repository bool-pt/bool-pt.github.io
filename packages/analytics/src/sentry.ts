import type { BrowserOptions } from '@sentry/react';

let initialized = false;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Redact email addresses from free-text before an event leaves the browser. */
function redactEmails(text: string): string {
  return text.replace(EMAIL_RE, '[redacted-email]');
}

export async function initSentry(dsn: string, options?: Partial<BrowserOptions>): Promise<void> {
  if (initialized || !dsn || typeof window === 'undefined') return;

  const Sentry = await import('@sentry/react');

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    // Sample a fraction of errored sessions for replay rather than all of them —
    // enough to diagnose issues without recording every consenting user's session.
    replaysOnErrorSampleRate: 0.2,
    // Error replays must not capture personal data. Mask all text and inputs
    // (form fields, names, emails) and block media so replays stay PII-free.
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    // Never attach cookies/headers/IP to events.
    sendDefaultPii: false,
    // Defense-in-depth PII scrubbing on the error-payload path (replays already
    // mask text/inputs): the site runs contact/newsletter forms, so redact any
    // email addresses that reach exception messages or breadcrumbs, and drop cookies.
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) exception.value = redactEmails(exception.value);
      }
      for (const breadcrumb of event.breadcrumbs ?? []) {
        if (breadcrumb.message) breadcrumb.message = redactEmails(breadcrumb.message);
      }
      return event;
    },
    ...options,
  });

  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized || typeof window === 'undefined') return;

  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    })
    // Error monitoring is non-critical; if the Sentry chunk fails to load,
    // silently continue rather than throwing inside an error handler.
    .catch(() => {});
}

export function setUser(id: string, email?: string): void {
  if (!initialized || typeof window === 'undefined') return;

  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.setUser({ id, email });
    })
    // Non-critical; ignore a failed Sentry chunk load.
    .catch(() => {});
}
