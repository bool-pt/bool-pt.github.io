export const SITE_URL = 'https://bool.pt';
export const SITE_NAME = 'Bool';
export const SITE_DESCRIPTION =
  'Critical software built fast and built to last. With 15 years of Low-Code expertise and the power of AI, we turn your toughest challenges into measurable results.';

export const COMPANY = {
  name: 'Bool',
  email: 'info@bool.pt',
  phone: '+351 219 345 678',
  address: 'Edifício Gonçalves Zarco, R. da Cintura do Porto de Lisboa, 1350-352 Lisboa',
  vatNumber: '',
} as const;

export const SOCIAL = {
  linkedin: 'https://www.linkedin.com/company/bool-pt',
  github: 'https://github.com/bool-pt',
  twitter: 'https://twitter.com/bool_pt',
  instagram: 'https://instagram.com/bool.pt',
  facebook: 'https://facebook.com/bool.pt',
  youtube: 'https://youtube.com/@bool-pt',
} as const;

export const ROUTES = {
  home: '/',
  about: '/about',
  services: '/services',
  people: '/people',
  portfolio: '/portfolio',
  blog: '/blog',
  contacts: '/contacts',
  events: '/events',
  careers: '/careers',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
} as const;

export const NAV_LINKS = [
  { label: 'nav.about', href: ROUTES.about },
  { label: 'nav.services', href: ROUTES.services },
  { label: 'nav.people', href: ROUTES.people },
  { label: 'nav.portfolio', href: ROUTES.portfolio },
  { label: 'nav.insights', href: ROUTES.blog },
  { label: 'nav.contacts', href: ROUTES.contacts },
] as const;

export const FOOTER_QUICK_LINKS = [
  { label: 'footer.link.services', href: ROUTES.services },
  { label: 'footer.link.about', href: ROUTES.about },
  { label: 'footer.link.careers', href: ROUTES.careers },
  { label: 'footer.link.contact', href: ROUTES.contacts },
  { label: 'footer.link.insights', href: ROUTES.blog },
  { label: 'footer.link.useCases', href: ROUTES.portfolio },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { label: 'footer.link.privacy', href: ROUTES.privacy },
  { label: 'footer.link.terms', href: ROUTES.terms },
  { label: 'footer.link.cookies', href: ROUTES.cookies },
] as const;
