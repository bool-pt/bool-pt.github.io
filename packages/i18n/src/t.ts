import { translations, defaultLocale } from './config.ts';
import type { Locale } from './config.ts';
import type en from './locales/en.json';

export type TranslationKey = keyof typeof en;

export const enKeys: string[] = Object.keys(translations['en'] ?? {});

export function t(key: string, locale: Locale = defaultLocale): string {
  return translations[locale]?.[key] ?? translations['en']?.[key] ?? key;
}

/**
 * Like `t()` but returns `undefined` instead of the key fallback when the
 * key is missing or its value is an empty string. Use this for optional
 * content such as background images that may not exist yet.
 */
export function tOptional(key: string, locale: Locale = defaultLocale): string | undefined {
  const value = translations[locale]?.[key] ?? translations['en']?.[key];
  return value || undefined;
}
