import { t, tList, tCollection, LOCALE_META, locales, defaultLocale } from '@bool/i18n';
import type { Locale } from '@bool/i18n';
import { resolveImage } from './media.ts';

export function getHeaderLabels(locale: Locale = 'en') {
  return {
    skipToContent: t('nav.skipToContent', locale),
    navAria: t('nav.main.aria', locale),
    logoAria: t('header.logoAria', locale),
    logo: resolveImage(t('header.logo', locale)),
    ctaLabel: t('header.cta', locale),
    navLinks: tCollection('nav.items', ['label', 'href'], locale),
    mobileNavLabels: {
      open: t('mobileNav.open', locale),
      title: t('mobileNav.title', locale),
      navAria: t('nav.mobile.aria', locale),
    },
    languageSelectLabels: {
      ariaLabel: t('languageSelect.aria', locale),
      currentLocale: locale,
      defaultLocale,
      locales: locales.map((l) => ({
        code: l,
        flag: LOCALE_META[l]?.flag ?? l.toUpperCase(),
        name: LOCALE_META[l]?.name ?? l,
      })),
    },
  };
}

export function getFooterLabels(locale: Locale = 'en') {
  return {
    tagline: t('footer.tagline', locale),
    taglineHref: t('footer.tagline.href', locale),
    socialAria: t('footer.social.aria', locale),
    socialLabels: {
      facebook: t('footer.social.facebook.label', locale),
      instagram: t('footer.social.instagram.label', locale),
      linkedin: t('footer.social.linkedin.label', locale),
      twitter: t('footer.social.twitter.label', locale),
      youtube: t('footer.social.youtube.label', locale),
    },
    socialUrls: {
      facebook: t('footer.social.facebook.href', locale),
      instagram: t('footer.social.instagram.href', locale),
      linkedin: t('footer.social.linkedin.href', locale),
      twitter: t('footer.social.twitter.href', locale),
      youtube: t('footer.social.youtube.href', locale),
    },
    quickLinksHeading: t('footer.quickLinks.heading', locale),
    legalLinksHeading: t('footer.legalLinks.heading', locale),
    findUsHeading: t('footer.findUs', locale),
    address: t('footer.address', locale),
    copyright: t('footer.copyright', locale),
    signatureImage: resolveImage(t('footer.signature.image', locale)),
    signatureAlt: t('footer.signature.alt', locale),
    companyName: t('company.name', locale),
    companyEmail: t('company.email', locale),
    companyPhone: t('company.phone', locale),
    quickLinks: tCollection('footer.quickLinks.items', ['label', 'href'], locale),
    legalLinks: tCollection('footer.legalLinks.items', ['label', 'href'], locale),
    cookiePreferencesLabel: t('cookie.preferences', locale),
  };
}

export function getNewsletterLabels(locale: Locale = 'en') {
  return {
    subscribed: t('newsletter.subscribed', locale),
    loading: t('newsletter.loading', locale),
    ctaBar: t('newsletter.cta.bar', locale),
    ctaCta: t('newsletter.cta.cta', locale),
    label: t('newsletter.label', locale),
    placeholder: t('newsletter.placeholder', locale),
    nameLabel: t('newsletter.name.label', locale),
    namePlaceholder: t('newsletter.name.placeholder', locale),
    nameRequired: t('newsletter.name.required', locale),
    captchaRequired: t('contactForm.captcha.required', locale),
    error: t('newsletter.error', locale),
    consentBefore: t('newsletter.consent.before', locale),
    consentLinkText: t('newsletter.consent.linkText', locale),
    consentAfter: t('newsletter.consent.after', locale),
    consentRequired: t('newsletter.consent.required', locale),
  };
}

export function getCalendarLabels(locale: Locale = 'en') {
  return {
    prevMonth: t('calendar.previousMonth', locale),
    nextMonth: t('calendar.nextMonth', locale),
    dayNames: t('calendar.days', locale).split(','),
    monthNames: t('calendar.months', locale).split(','),
    eventPrefix: t('calendar.eventPrefix', locale),
  };
}

export function getContactFormLabels(locale: Locale = 'en') {
  return {
    formAria: t('contactForm.form.aria', locale),
    name: t('contactForm.name', locale),
    namePlaceholder: t('contactForm.name.placeholder', locale),
    firstName: t('contactForm.firstName', locale),
    firstNamePlaceholder: t('contactForm.firstName.placeholder', locale),
    lastName: t('contactForm.lastName', locale),
    lastNamePlaceholder: t('contactForm.lastName.placeholder', locale),
    phone: t('contactForm.phone', locale),
    phonePlaceholder: t('contactForm.phone.placeholder', locale),
    email: t('contactForm.email', locale),
    emailPlaceholder: t('contactForm.email.placeholder', locale),
    message: t('contactForm.message', locale),
    messagePlaceholder: t('contactForm.message.placeholder', locale),
    submit: t('contactForm.submit', locale),
    submitting: t('contactForm.submitting', locale),
    success: t('contactForm.success', locale),
    error: t('contactForm.error', locale),
    captchaRequired: t('contactForm.captcha.required', locale),
    privacyNoticeBefore: t('contactForm.privacyNotice.before', locale),
    privacyNoticeLinkText: t('contactForm.privacyNotice.linkText', locale),
    privacyNoticeAfter: t('contactForm.privacyNotice.after', locale),
  };
}

export function getEventScheduleLabels(locale: Locale = 'en') {
  return {
    eyebrow: t('eventSchedule.eyebrow', locale),
    subtitle: t('eventSchedule.subtitle', locale),
    close: t('eventSchedule.close', locale),
    formAria: t('eventSchedule.formAria', locale),
    fullName: t('eventSchedule.fullName', locale),
    fullNamePlaceholder: t('eventSchedule.fullNamePlaceholder', locale),
    phone: t('eventSchedule.phone', locale),
    phonePlaceholder: t('eventSchedule.phonePlaceholder', locale),
    email: t('eventSchedule.email', locale),
    emailPlaceholder: t('eventSchedule.emailPlaceholder', locale),
    time: t('eventSchedule.time', locale),
    timePlaceholder: t('eventSchedule.timePlaceholder', locale),
    timeOptions: t('eventSchedule.timeOptions', locale).split(','),
    message: t('eventSchedule.message', locale),
    messagePlaceholder: t('eventSchedule.messagePlaceholder', locale),
    submit: t('eventSchedule.submit', locale),
    success: t('eventSchedule.success', locale),
    captchaRequired: t('eventSchedule.captchaRequired', locale),
    error: t('eventSchedule.error', locale),
  };
}

export function getContactSectionProps(locale: Locale = 'en') {
  return {
    heading: t('contactForm.heading', locale),
    body: t('contactForm.body', locale),
    addressLabel: t('contactForm.addressLabel', locale),
    addressLines: tList('contactForm.addressLines', locale),
    contactEmail: t('company.email', locale),
    formLabels: getContactFormLabels(locale),
  };
}
