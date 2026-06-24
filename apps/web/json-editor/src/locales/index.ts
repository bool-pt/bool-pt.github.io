import en from './en.json';

type LocaleStrings = typeof en;
type LocaleKey = keyof LocaleStrings;

const currentLocale: LocaleStrings = en;

/**
 * Get a localized string by key.
 * Falls back to the key itself if not found.
 */
export function l(key: LocaleKey): string {
  return currentLocale[key] ?? key;
}

export type { LocaleKey, LocaleStrings };
