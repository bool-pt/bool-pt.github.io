import type { FieldKind } from './types';

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

const ICON_SUFFIXES = new Set([
  'iconName',
  'icon',
]);

export function classifyField(key: string): FieldKind {
  const lastSegment = key.slice(key.lastIndexOf('.') + 1);
  if (MEDIA_SUFFIXES.has(lastSegment)) return 'media';
  if (ICON_SUFFIXES.has(lastSegment)) return 'icon';
  return 'text';
}
