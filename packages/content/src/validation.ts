import { defaultLocale, translations } from '@bool/i18n';
import type { Locale } from '@bool/i18n';
import { resolveImage, resolveSvgUrl } from './media.ts';

/**
 * Validation against drift between en.json keys and the rest of the codebase.
 *
 * - Every key whose suffix names a media field (`image`, `coverImage`, `logo`, ...)
 *   must point to a real file on disk under `packages/media/images/`.
 * - Every key whose suffix names an icon field (`iconName`, `icon`) must be one
 *   of the registered `GradientIcon` names.
 *
 * Used by tests in CI to catch broken paths and renamed icons before they ship.
 */

const MEDIA_SUFFIXES = new Set([
  'image',
  'coverImage',
  'backgroundImage',
  'heroImage',
  'photo',
  'avatar',
  'logo',
  'thumbnail',
]);

const ICON_SUFFIXES = new Set(['iconName', 'icon']);

/**
 * Canonical list of `GradientIcon` names. Kept in sync with
 * `packages/ui/src/primitives/Icon/icon-data.ts`. A test in `@bool/ui` should
 * assert this list matches the source of truth.
 */
export const KNOWN_GRADIENT_ICONS: ReadonlySet<string> = new Set([
  'shield',
  'chart',
  'save-vest',
  'grid-plus',
  'rocket',
  'calendar',
  'trophy',
  'document',
  'building-education',
  'star-badge',
]);

export interface MediaError {
  key: string;
  value: string;
  reason: string;
}

export interface IconError {
  key: string;
  value: string;
  reason: string;
}

export interface ValidationReport {
  mediaErrors: MediaError[];
  iconErrors: IconError[];
}

function lastSegment(key: string): string {
  return key.slice(key.lastIndexOf('.') + 1);
}

function isSvgPath(value: string): boolean {
  return value.toLowerCase().endsWith('.svg');
}

/**
 * Walk every key in the given locale and report any media path that doesn't
 * resolve, or any iconName that isn't a registered gradient icon.
 */
export function validateLocale(locale: Locale = defaultLocale): ValidationReport {
  const data = translations[locale] ?? {};
  const mediaErrors: MediaError[] = [];
  const iconErrors: IconError[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed === '') continue;

    const suffix = lastSegment(key);

    if (MEDIA_SUFFIXES.has(suffix)) {
      try {
        if (isSvgPath(trimmed)) {
          resolveSvgUrl(trimmed);
        } else {
          resolveImage(trimmed);
        }
      } catch (err) {
        mediaErrors.push({ key, value: trimmed, reason: (err as Error).message });
      }
    } else if (ICON_SUFFIXES.has(suffix)) {
      if (!KNOWN_GRADIENT_ICONS.has(trimmed)) {
        iconErrors.push({
          key,
          value: trimmed,
          reason: `Unknown icon "${trimmed}". Allowed: ${[...KNOWN_GRADIENT_ICONS].join(', ')}`,
        });
      }
    }
  }

  return { mediaErrors, iconErrors };
}
