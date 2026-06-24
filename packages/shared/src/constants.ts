export const SITE_URL = 'https://bool.pt';
export const BASE_PATH = '';
export const SITE_NAME = 'Bool';

export const COMPANY = {
  name: 'Bool',
  email: 'info@bool.pt',
  phone: '+351 219 345 678',
  address: 'Kube Coworking, R. do Centro Cultural 27A, 1700-106 Lisboa',
  vatNumber: 'PT510768105',
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
