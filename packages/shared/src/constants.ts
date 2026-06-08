export const SITE_URL = 'https://bool.pt';
export const BASE_PATH = '/bool';
export const SITE_NAME = 'Bool';

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

const route = (path: string) => `${BASE_PATH}${path}` as const;

export const ROUTES = {
  home: route('/'),
  about: route('/about'),
  services: route('/services'),
  people: route('/people'),
  portfolio: route('/portfolio'),
  blog: route('/blog'),
  contacts: route('/contacts'),
  events: route('/events'),
  careers: route('/careers'),
  privacy: route('/privacy'),
  terms: route('/terms'),
  cookies: route('/cookies'),
} as const;

export const NAV_LINKS = [
  { label: 'nav.home', href: ROUTES.home },
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
