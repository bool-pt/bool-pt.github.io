const STORAGE_KEY = 'locale';

export function setStoredLocale(locale: string): void {
  localStorage.setItem(STORAGE_KEY, locale);
}

export function getLocaleFromUrl(
  pathname: string,
  supportedLocales: string[],
  defaultLocale: string
): string {
  const segment = pathname.split('/')[1];
  return supportedLocales.includes(segment) ? segment : defaultLocale;
}

export function buildLocalizedPath(
  pathname: string,
  targetLocale: string,
  defaultLocale: string,
  supportedLocales: string[]
): string {
  const currentLocale = getLocaleFromUrl(pathname, supportedLocales, defaultLocale);
  let basePath = pathname;

  if (currentLocale !== defaultLocale) {
    basePath = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/';
  }

  if (targetLocale === defaultLocale) {
    return basePath;
  }

  return `/${targetLocale}${basePath}`;
}
