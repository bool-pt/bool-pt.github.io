import { translations, defaultLocale } from './config';
import type { Locale } from './config';
import type en from './locales/en.json';

export type TranslationKey = keyof typeof en;

export const enKeys: string[] = Object.keys(translations['en'] ?? {});

export function t(key: string, locale: Locale = defaultLocale): string {
  return translations[locale]?.[key] ?? translations['en']?.[key] ?? key;
}
