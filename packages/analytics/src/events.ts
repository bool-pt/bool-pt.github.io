import { getConsent } from '@bool/compliance';

type GtagFunction = (command: string, eventName: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const consent = getConsent();
  if (!consent?.analytics) return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

export function trackConversion(
  action: 'contact_form_submit' | 'newsletter_signup' | 'cta_click',
  params?: Record<string, unknown>
): void {
  trackEvent(action, { ...params, event_category: 'conversion' });
}

export function trackEngagement(
  action: 'page_scroll' | 'time_on_page' | 'outbound_click',
  params?: Record<string, unknown>
): void {
  trackEvent(action, { ...params, event_category: 'engagement' });
}
