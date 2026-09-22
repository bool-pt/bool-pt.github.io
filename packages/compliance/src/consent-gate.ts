import { CONSENT_ENABLED, CONSENT_GRANTED_EVENT, CONSENT_REVOKED_EVENT } from './config';
import type { ConsentCategory } from './config';
import { getConsent } from './consent';

/**
 * Shared consent gate for every tracker on the site (GA4, LinkedIn Insight Tag).
 *
 * Trackers must never reach for `localStorage` or the consent events themselves —
 * they call `onConsentGranted` / `onConsentRevoked` and get the same behaviour:
 * load only after an explicit, current-version grant, and tear down on withdrawal
 * (GDPR Art. 7(3)).
 */

/**
 * Runs `load` once the user has granted `category` — immediately if consent is
 * already stored, otherwise the first time it is granted during this page's life.
 *
 * Gated on `CONSENT_ENABLED` so a tracker can never run without the banner that
 * lets users withdraw it. `getConsent()` validates the stored record's shape and
 * policy version, so a stale record cannot silently re-enable a tracker after the
 * policy changes.
 */
export function onConsentGranted(category: ConsentCategory, load: () => void): void {
  if (!CONSENT_ENABLED) return;

  if (getConsent()?.[category] === true) {
    load();
    return;
  }

  window.addEventListener(CONSENT_GRANTED_EVENT, function handler(event: Event) {
    const detail = (event as CustomEvent).detail as Record<string, unknown> | null;
    if (detail?.[category] === true) {
      window.removeEventListener(CONSENT_GRANTED_EVENT, handler);
      load();
    }
  });
}

/**
 * Runs `teardown` whenever the user withdraws `category`. Stays subscribed: a user
 * can grant and withdraw repeatedly within one page.
 */
export function onConsentRevoked(category: ConsentCategory, teardown: () => void): void {
  if (!CONSENT_ENABLED) return;

  window.addEventListener(CONSENT_REVOKED_EVENT, (event: Event) => {
    const detail = (event as CustomEvent).detail as Record<string, unknown> | null;
    if (detail?.[category] === true) teardown();
  });
}

/**
 * Deletes every cookie whose name satisfies `matches`, across every domain scope a
 * third-party tag may have written it to.
 *
 * Tags like GA4 (`cookie_domain:'auto'`) and the LinkedIn Insight Tag set cookies on
 * the registrable domain — e.g. `.bool.pt` even when served from `www.bool.pt`. A
 * cookie can only be deleted from the exact domain/path it was set on, so we try the
 * host-only form plus every parent-domain suffix down to eTLD+1, each with and
 * without a leading dot.
 */
export function deleteCookies(matches: (name: string) => boolean): void {
  const parts = location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join('.');
    domains.push(suffix, `.${suffix}`);
  }

  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim();
    if (!name || !matches(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}
