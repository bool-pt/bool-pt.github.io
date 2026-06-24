import en from './locales/en.json' with { type: 'json' };

const localeModules: Record<string, Record<string, string>> = {
  en,
};

const discoveredTranslations: Record<string, Record<string, string>> = {};
const discoveredMeta: Record<string, { flag: string; name: string }> = {};
const discoveredLocales: string[] = [];

for (const [code, mod] of Object.entries(localeModules)) {
  const flag = mod['_locale.flag'];
  const name = mod['_locale.name'];

  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(mod)) {
    if (!k.startsWith('_locale.')) cleaned[k] = v;
  }

  discoveredTranslations[code] = cleaned;
  discoveredMeta[code] = {
    flag: flag ?? code.toUpperCase(),
    name: name ?? code,
  };
  discoveredLocales.push(code);
}

export const defaultLocale = 'en';
export const locales: string[] = discoveredLocales;
export type Locale = string;
export const LOCALE_META: Record<string, { flag: string; name: string }> = discoveredMeta;
export const translations: Record<string, Record<string, string>> = discoveredTranslations;

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value);
}
