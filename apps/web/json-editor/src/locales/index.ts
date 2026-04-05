import en from './en.json';

type LocaleStrings = typeof en;
type LocaleKey = keyof LocaleStrings;

let currentLocale: LocaleStrings = en;

/**
 * Get a localized string by key.
 * Falls back to the key itself if not found.
 */
export function l(key: LocaleKey): string {
  return currentLocale[key] ?? key;
}

/**
 * Load a different locale (for future multi-language support).
 */
export function setLocale(strings: LocaleStrings): void {
  currentLocale = strings;
}

export type { LocaleKey, LocaleStrings };
