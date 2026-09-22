import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './config.ts';
import { onConsentGranted, onConsentRevoked, deleteCookies } from './consent-gate.ts';

function storeConsent(
  state: { analytics: boolean; marketing: boolean },
  version = CONSENT_VERSION
) {
  localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({ ...state, timestamp: Date.now(), version })
  );
}

function grant(state: { analytics: boolean; marketing: boolean }) {
  window.dispatchEvent(new CustomEvent('bool:consent-granted', { detail: state }));
}

function revoke(state: { analytics: boolean; marketing: boolean }) {
  window.dispatchEvent(new CustomEvent('bool:consent-revoked', { detail: state }));
}

describe('onConsentGranted', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads immediately when consent for the category is already stored', () => {
    storeConsent({ analytics: true, marketing: false });
    const load = vi.fn();
    onConsentGranted('analytics', load);
    expect(load).toHaveBeenCalledOnce();
  });

  it('does not load when no consent decision has been made', () => {
    const load = vi.fn();
    onConsentGranted('marketing', load);
    expect(load).not.toHaveBeenCalled();
  });

  it('does not load for a category the user denied', () => {
    storeConsent({ analytics: true, marketing: false });
    const load = vi.fn();
    onConsentGranted('marketing', load);
    expect(load).not.toHaveBeenCalled();
  });

  it('treats a stored record from an older policy version as no decision', () => {
    storeConsent({ analytics: true, marketing: true }, CONSENT_VERSION - 1);
    const load = vi.fn();
    onConsentGranted('marketing', load);
    expect(load).not.toHaveBeenCalled();
  });

  it('loads when consent is granted later in the page', () => {
    const load = vi.fn();
    onConsentGranted('marketing', load);
    grant({ analytics: false, marketing: true });
    expect(load).toHaveBeenCalledOnce();
  });

  it('ignores a grant that does not include the category', () => {
    const load = vi.fn();
    onConsentGranted('marketing', load);
    grant({ analytics: true, marketing: false });
    expect(load).not.toHaveBeenCalled();
  });

  it('loads at most once across repeated grants', () => {
    const load = vi.fn();
    onConsentGranted('analytics', load);
    grant({ analytics: true, marketing: false });
    grant({ analytics: true, marketing: true });
    expect(load).toHaveBeenCalledOnce();
  });

  it('keeps the categories independent', () => {
    const loadAnalytics = vi.fn();
    const loadMarketing = vi.fn();
    onConsentGranted('analytics', loadAnalytics);
    onConsentGranted('marketing', loadMarketing);
    grant({ analytics: true, marketing: false });
    expect(loadAnalytics).toHaveBeenCalledOnce();
    expect(loadMarketing).not.toHaveBeenCalled();
  });
});

describe('onConsentRevoked', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tears down when the category is withdrawn', () => {
    const teardown = vi.fn();
    onConsentRevoked('marketing', teardown);
    revoke({ analytics: false, marketing: true });
    expect(teardown).toHaveBeenCalledOnce();
  });

  it('ignores a withdrawal of a different category', () => {
    const teardown = vi.fn();
    onConsentRevoked('marketing', teardown);
    revoke({ analytics: true, marketing: false });
    expect(teardown).not.toHaveBeenCalled();
  });

  it('stays subscribed so grant/withdraw cycles keep working', () => {
    const teardown = vi.fn();
    onConsentRevoked('analytics', teardown);
    revoke({ analytics: true, marketing: false });
    revoke({ analytics: true, marketing: false });
    expect(teardown).toHaveBeenCalledTimes(2);
  });
});

describe('deleteCookies', () => {
  beforeEach(() => {
    for (const entry of document.cookie.split(';')) {
      const name = entry.split('=')[0].trim();
      if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  });

  it('deletes only the cookies the predicate matches', () => {
    document.cookie = 'li_fat_id=abc; path=/';
    document.cookie = 'theme=dark; path=/';

    deleteCookies((name) => name.startsWith('li_'));

    expect(document.cookie).not.toContain('li_fat_id');
    expect(document.cookie).toContain('theme=dark');
  });

  it('deletes every matching cookie in one pass', () => {
    document.cookie = '_ga=1; path=/';
    document.cookie = '_ga_ABC=2; path=/';

    deleteCookies((name) => name === '_ga' || name.startsWith('_ga_'));

    expect(document.cookie).not.toContain('_ga');
  });

  it('does nothing when no cookie matches', () => {
    document.cookie = 'theme=dark; path=/';
    deleteCookies((name) => name.startsWith('li_'));
    expect(document.cookie).toContain('theme=dark');
  });
});
