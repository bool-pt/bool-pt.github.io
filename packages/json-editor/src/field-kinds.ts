import type { FieldKind, SelectOption } from './types';

/**
 * Classifies a translation field by its key, returning the editor kind to use.
 *
 * Pure suffix-matching against the *last* segment of the dot-notation key.
 * Easy to extend by editing the lists below.
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

const LINK_SUFFIXES = new Set(['href', 'url', 'link']);

/** Maps key suffix → ordered option list for select fields. */
const SELECT_OPTIONS: Record<string, SelectOption[]> = {
  ctaType: [
    { value: 'link', label: 'Register Now' },
    { value: 'calendar', label: 'Add to Calendar' },
    { value: 'internal', label: 'Team Only' },
    { value: 'meet', label: 'Meet us there' },
  ],
};

export function classifyField(key: string): FieldKind {
  const lastSegment = key.slice(key.lastIndexOf('.') + 1);
  if (MEDIA_SUFFIXES.has(lastSegment)) return 'media';
  if (ICON_SUFFIXES.has(lastSegment)) return 'icon';
  if (SELECT_OPTIONS[lastSegment]) return 'select';
  if (LINK_SUFFIXES.has(lastSegment)) return 'link';
  return 'text';
}

export function getFieldOptions(key: string): SelectOption[] | undefined {
  const lastSegment = key.slice(key.lastIndexOf('.') + 1);
  return SELECT_OPTIONS[lastSegment];
}
