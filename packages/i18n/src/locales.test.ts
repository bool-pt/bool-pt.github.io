import { describe, it, expect } from 'vitest';
import en from './locales/en.json' with { type: 'json' };

const t = en as Record<string, string>;

describe('en.json compliance content', () => {
  it('contact form disclaimer reflects legitimate interest, not consent (BOOL-07c)', () => {
    const notice =
      t['contactForm.privacyNotice.before'] +
      t['contactForm.privacyNotice.linkText'] +
      t['contactForm.privacyNotice.after'];
    // The basis for contact-form processing is legitimate interest (Art. 6(1)(f)),
    // so the disclaimer must not use consent language ("agree to").
    expect(notice.toLowerCase()).not.toContain('agree to');
    expect(notice.toLowerCase()).toContain('legitimate interest');
  });

  it('privacy policy identifies the controller with VAT and address (BOOL-07a/b)', () => {
    const body = t['privacy.section.1.body'];
    expect(body).toContain('PT510768105');
    expect(body).toContain('Kube Coworking');
  });

  it('policies promise the footer "Cookie preferences" link (premise of BOOL-01)', () => {
    // These promises are only honoured when CONSENT_ENABLED is true (asserted in
    // @bool/compliance). If the wording is ever dropped, revisit that guard too.
    expect(t['privacy.section.7.body']).toContain('Cookie preferences');
    expect(t['cookies.section.4.body']).toContain('Cookie preferences');
  });
});
