import { describe, it, expect } from 'vitest';
import {
  getHeaderLabels,
  getFooterLabels,
  getNewsletterLabels,
  getCalendarLabels,
  getContactFormLabels,
  getContactSectionProps,
} from './labels.ts';

function assertNonEmptyStrings(obj: Record<string, unknown>, path = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string') {
      expect(value.length, `${fullPath} should be non-empty`).toBeGreaterThan(0);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'string') {
          expect(item.length, `${fullPath}[${i}] should be non-empty`).toBeGreaterThan(0);
        } else if (typeof item === 'object' && item !== null) {
          assertNonEmptyStrings(item as Record<string, unknown>, `${fullPath}[${i}]`);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      assertNonEmptyStrings(value as Record<string, unknown>, fullPath);
    }
  }
}

describe('getHeaderLabels', () => {
  it('returns all required keys with non-empty strings', () => {
    const labels = getHeaderLabels();
    expect(labels.navAria).toBeTruthy();
    expect(labels.logoAria).toBeTruthy();
    expect(labels.logo).toBeTruthy();
    expect(labels.ctaLabel).toBeTruthy();
    expect(labels.navLinks.length).toBeGreaterThan(0);
    expect(labels.navLinks.every((l) => l.label && l.href)).toBe(true);
    expect(labels.mobileNavLabels.open).toBeTruthy();
    expect(labels.mobileNavLabels.title).toBeTruthy();
    expect(labels.languageSelectLabels.ariaLabel).toBeTruthy();
    expect(labels.languageSelectLabels.locales.length).toBeGreaterThan(0);
  });

  it('all string values resolve to real translations', () => {
    const labels = getHeaderLabels();
    assertNonEmptyStrings(labels as unknown as Record<string, unknown>);
  });
});

describe('getFooterLabels', () => {
  it('returns all required keys with non-empty strings', () => {
    const labels = getFooterLabels();
    expect(labels.tagline).toBeTruthy();
    expect(labels.copyright).toBeTruthy();
    expect(labels.companyName).toBeTruthy();
    expect(labels.companyEmail).toBeTruthy();
    // companyPhone is optional content — may be empty when the company lists no phone.
    expect(typeof labels.companyPhone).toBe('string');
    expect(labels.cookiePreferencesLabel).toBeTruthy();
    expect(labels.quickLinks.length).toBeGreaterThan(0);
    expect(labels.legalLinks.length).toBeGreaterThan(0);
    expect(labels.quickLinks.every((l) => l.label && l.href)).toBe(true);
    expect(Object.keys(labels.socialLabels).length).toBeGreaterThan(0);
  });

  it('all string values resolve to real translations', () => {
    // companyPhone is optional content (may be empty) — exclude it from the non-empty sweep.
    const { companyPhone: _companyPhone, ...rest } = getFooterLabels();
    assertNonEmptyStrings(rest as unknown as Record<string, unknown>);
  });
});

describe('getNewsletterLabels', () => {
  it('returns all required keys', () => {
    const labels = getNewsletterLabels();
    expect(labels.subscribed).toBeTruthy();
    expect(labels.loading).toBeTruthy();
    expect(labels.placeholder).toBeTruthy();
    expect(labels.error).toBeTruthy();
    expect(labels.consentRequired).toBeTruthy();
  });

  it('all string values resolve to real translations', () => {
    assertNonEmptyStrings(getNewsletterLabels() as unknown as Record<string, unknown>);
  });
});

describe('getCalendarLabels', () => {
  it('returns day and month name arrays', () => {
    const labels = getCalendarLabels();
    expect(labels.dayNames.length).toBe(7);
    expect(labels.monthNames.length).toBe(12);
    expect(labels.prevMonth).toBeTruthy();
    expect(labels.nextMonth).toBeTruthy();
  });
});

describe('getContactFormLabels', () => {
  it('returns all form field labels', () => {
    const labels = getContactFormLabels();
    expect(labels.name).toBeTruthy();
    expect(labels.email).toBeTruthy();
    expect(labels.message).toBeTruthy();
    expect(labels.submit).toBeTruthy();
    expect(labels.success).toBeTruthy();
    expect(labels.error).toBeTruthy();
  });

  it('all string values resolve to real translations', () => {
    assertNonEmptyStrings(getContactFormLabels() as unknown as Record<string, unknown>);
  });
});

describe('getContactSectionProps', () => {
  it('returns heading, body, and nested formLabels', () => {
    const props = getContactSectionProps();
    expect(props.heading).toBeTruthy();
    expect(props.body).toBeTruthy();
    expect(props.contactEmail).toBeTruthy();
    expect(props.addressLines.length).toBeGreaterThan(0);
    expect(props.formLabels.submit).toBeTruthy();
  });
});
