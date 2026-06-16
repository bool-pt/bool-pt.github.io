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

/**
 * Media fields are detected by the *ending* of the last segment
 * (case-insensitive), so `expertImage`, `authorAvatar`, `coverImage`, etc. are
 * all caught — not just the bare names. Keep in sync with the matching logic in
 * `@bool/json-editor-core`'s `field-kinds.ts` (which picks the MediaPicker).
 */
const MEDIA_SUFFIX_ENDINGS = ['image', 'photo', 'avatar', 'logo', 'thumbnail', 'portrait'];

function isMediaSegment(lastSegment: string): boolean {
  const s = lastSegment.toLowerCase();
  return MEDIA_SUFFIX_ENDINGS.some((ending) => s.endsWith(ending));
}

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

    if (isMediaSegment(suffix)) {
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

export interface MetaError {
  key: string;
  reason: string;
}

/**
 * Validate `_meta` ↔ content consistency for the json-editor wiring:
 *
 * - Every page in `_meta.pages.*` must have a `_meta.pageLabels.*` entry,
 *   otherwise it never appears in the editor's page list.
 * - Every section namespace a page lists must have a `_meta.labels.*` entry
 *   (so it shows a friendly name) and at least one content key (so it isn't a
 *   stale entry pointing at deleted content).
 *
 * This cannot catch a section that renders in a page but is missing from
 * `_meta.pages` (that needs the page source, not the locale) — but it stops
 * the inverse drift: dangling editor wiring after content is added or removed.
 */
export function validateMeta(locale: Locale = defaultLocale): MetaError[] {
  const data = translations[locale] ?? {};
  const errors: MetaError[] = [];

  const contentNamespaces = new Set<string>();
  for (const key of Object.keys(data)) {
    if (key.startsWith('_meta.')) continue;
    const dot = key.indexOf('.');
    if (dot > 0) contentNamespaces.add(key.slice(0, dot));
  }

  for (const key of Object.keys(data)) {
    if (!key.startsWith('_meta.pages.')) continue;
    const page = key.slice('_meta.pages.'.length);

    if (!data[`_meta.pageLabels.${page}`]) {
      errors.push({ key, reason: `page "${page}" has no _meta.pageLabels.${page}` });
    }

    const sections = (data[key] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const ns of sections) {
      if (!data[`_meta.labels.${ns}`]) {
        errors.push({ key, reason: `section "${ns}" on page "${page}" has no _meta.labels.${ns}` });
      }
      if (!contentNamespaces.has(ns)) {
        errors.push({
          key,
          reason: `section "${ns}" on page "${page}" has no content keys in "${locale}"`,
        });
      }
    }
  }

  return errors;
}
