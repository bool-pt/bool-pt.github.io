import { t, tList, LOCALE_META, locales, defaultLocale } from '@bool/i18n';
import type { Locale } from '@bool/i18n';

export function getHeaderLabels(locale: Locale = 'en') {
  return {
    navAria: t('nav.main.aria', locale),
    logoAria: t('header.logoAria', locale),
    ctaLabel: t('header.cta', locale),
    linkLabels: {
      'nav.home': t('nav.home', locale),
      'nav.about': t('nav.about', locale),
      'nav.services': t('nav.services', locale),
      'nav.people': t('nav.people', locale),
      'nav.portfolio': t('nav.portfolio', locale),
      'nav.insights': t('nav.insights', locale),
      'nav.contacts': t('nav.contacts', locale),
    },
    mobileNavLabels: {
      open: t('mobileNav.open', locale),
      title: t('mobileNav.title', locale),
      navAria: t('nav.mobile.aria', locale),
      linkLabels: {
        'nav.home': t('nav.home', locale),
        'nav.about': t('nav.about', locale),
        'nav.services': t('nav.services', locale),
        'nav.people': t('nav.people', locale),
        'nav.portfolio': t('nav.portfolio', locale),
        'nav.insights': t('nav.insights', locale),
        'nav.contacts': t('nav.contacts', locale),
      },
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
    socialAria: t('footer.social.aria', locale),
    socialLabels: {
      facebook: t('footer.social.facebook', locale),
      instagram: t('footer.social.instagram', locale),
      linkedin: t('footer.social.linkedin', locale),
      twitter: t('footer.social.twitter', locale),
      youtube: t('footer.social.youtube', locale),
    },
    quickLinksHeading: t('footer.quickLinks', locale),
    legalLinksHeading: t('footer.legalLinks', locale),
    findUsHeading: t('footer.findUs', locale),
    address: t('footer.address', locale),
    copyright: t('footer.copyright', locale),
    companyName: t('company.name', locale),
    companyEmail: t('company.email', locale),
    companyPhone: t('company.phone', locale),
    linkLabels: {
      'footer.link.services': t('footer.link.services', locale),
      'footer.link.about': t('footer.link.about', locale),
      'footer.link.careers': t('footer.link.careers', locale),
      'footer.link.contact': t('footer.link.contact', locale),
      'footer.link.insights': t('footer.link.insights', locale),
      'footer.link.useCases': t('footer.link.useCases', locale),
      'footer.link.privacy': t('footer.link.privacy', locale),
      'footer.link.terms': t('footer.link.terms', locale),
      'footer.link.cookies': t('footer.link.cookies', locale),
    },
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
    required: t('eventSchedule.required', locale),
    emailInvalid: t('eventSchedule.emailInvalid', locale),
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
