import type { BrowserOptions } from '@sentry/react';

let initialized = false;

export async function initSentry(dsn: string, options?: Partial<BrowserOptions>): Promise<void> {
  if (initialized || !dsn || typeof window === 'undefined') return;

  const Sentry = await import('@sentry/react');

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
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
    .catch(() => {});
}

export function setUser(id: string, email?: string): void {
  if (!initialized || typeof window === 'undefined') return;

  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.setUser({ id, email });
    })
    .catch(() => {});
}
