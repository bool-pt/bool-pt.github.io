import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent, trackConversion, trackEngagement } from './events';

vi.mock('@bool/compliance', () => ({
  getConsent: vi.fn(),
}));

const { getConsent } = await import('@bool/compliance');
const mockedGetConsent = vi.mocked(getConsent);

describe('trackEvent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.gtag = vi.fn();
  });

  it('sends event when analytics consent is granted', () => {
    mockedGetConsent.mockReturnValue({ analytics: true, marketing: false, timestamp: Date.now() });
    trackEvent('page_view', { page: '/about' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', { page: '/about' });
  });

  it('does not send event when analytics consent is denied', () => {
    mockedGetConsent.mockReturnValue({ analytics: false, marketing: false, timestamp: Date.now() });
    trackEvent('page_view');
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('does not send event when no consent exists', () => {
    mockedGetConsent.mockReturnValue(null);
    trackEvent('page_view');
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('does not throw when gtag is not defined', () => {
    mockedGetConsent.mockReturnValue({ analytics: true, marketing: true, timestamp: Date.now() });
    window.gtag = undefined;
    expect(() => trackEvent('page_view')).not.toThrow();
  });
});

describe('trackConversion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.gtag = vi.fn();
    mockedGetConsent.mockReturnValue({ analytics: true, marketing: true, timestamp: Date.now() });
  });

  it('sends contact_form_submit conversion', () => {
    trackConversion('contact_form_submit', { form_location: 'footer' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'contact_form_submit', {
      form_location: 'footer',
      event_category: 'conversion',
    });
  });

  it('sends newsletter_signup conversion', () => {
    trackConversion('newsletter_signup');
    expect(window.gtag).toHaveBeenCalledWith('event', 'newsletter_signup', {
      event_category: 'conversion',
    });
  });

  it('sends cta_click conversion', () => {
    trackConversion('cta_click', { cta_text: 'Get Started' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'cta_click', {
      cta_text: 'Get Started',
      event_category: 'conversion',
    });
  });
});

describe('trackEngagement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.gtag = vi.fn();
    mockedGetConsent.mockReturnValue({ analytics: true, marketing: true, timestamp: Date.now() });
  });

  it('sends engagement event with category', () => {
    trackEngagement('outbound_click', { url: 'https://example.com' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'outbound_click', {
      url: 'https://example.com',
      event_category: 'engagement',
    });
  });
});
