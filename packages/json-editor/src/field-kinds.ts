import type { FieldKind, SelectOption } from './types';

/**
 * Classifies a translation field by its key, returning the editor kind to use.
 *
 * Pure suffix-matching against the *last* segment of the dot-notation key.
 * Easy to extend by editing the lists below.
 */

/**
 * Media fields are detected by the *ending* of the last segment
 * (case-insensitive), so variants like `expertImage`, `authorAvatar`,
 * `coverImage`, and `backgroundImage` are all recognised — not just the bare
 * names. Keep in sync with the matching logic in `@bool/content`'s
 * `validation.ts` (the media drift guard).
 */
const MEDIA_SUFFIX_ENDINGS = ['image', 'photo', 'avatar', 'logo', 'thumbnail', 'portrait'];

function isMediaSegment(lastSegment: string): boolean {
  const s = lastSegment.toLowerCase();
  return MEDIA_SUFFIX_ENDINGS.some((ending) => s.endsWith(ending));
}

const ICON_SUFFIXES = new Set(['iconName', 'icon']);

const LINK_SUFFIXES = new Set(['href', 'url', 'link']);

/**
 * Boolean fields render as a toggle that still serializes to the strings
 * "true"/"false". Detected by the last segment — `visible` covers the
 * section-visibility flags (`<section>.visible`) and the per-channel share
 * toggles (`knowledgeCenter.share.*.visible`).
 */
const BOOLEAN_SUFFIXES = new Set(['visible']);

/**
 * A field is a link when its key says so (`href`/`url`/`link`, or any
 * `*Href`/`*Url` variant like `meetHref`) OR its value looks like a
 * destination — an absolute URL, a site-relative path, an in-page anchor, or a
 * `mailto:`. The value check is what lets URL-valued fields under non-link
 * suffixes (e.g. `teamGrid.items.N.linkedin`) get the link picker, while
 * label fields that happen to share a suffix (`footer.social.linkedin` =
 * "Bool on LinkedIn") stay plain text.
 */
function isLinkSuffix(lastSegment: string): boolean {
  if (LINK_SUFFIXES.has(lastSegment)) return true;
  const s = lastSegment.toLowerCase();
  return s.endsWith('href') || s.endsWith('url');
}

function looksLikeUrl(value: string | undefined): boolean {
  if (!value) return false;
  return (
    /^(https?:)?\/\//.test(value) ||
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:')
  );
}

/** Maps key suffix → ordered option list for select fields. */
const SELECT_OPTIONS: Record<string, SelectOption[]> = {
  ctaType: [
    { value: 'link', label: 'Register Now' },
    { value: 'calendar', label: 'Add to Calendar' },
    { value: 'internal', label: 'Team Only' },
    { value: 'meet', label: 'Meet us there' },
  ],
};

export function classifyField(key: string, value?: string): FieldKind {
  const lastSegment = key.slice(key.lastIndexOf('.') + 1);
  if (BOOLEAN_SUFFIXES.has(lastSegment)) return 'boolean';
  if (ICON_SUFFIXES.has(lastSegment)) return 'icon';
  if (isMediaSegment(lastSegment)) return 'media';
  if (isLinkSuffix(lastSegment) || looksLikeUrl(value)) return 'link';
  if (SELECT_OPTIONS[lastSegment]) return 'select';
  return 'text';
}

export function getFieldOptions(key: string): SelectOption[] | undefined {
  const lastSegment = key.slice(key.lastIndexOf('.') + 1);
  return SELECT_OPTIONS[lastSegment];
}
