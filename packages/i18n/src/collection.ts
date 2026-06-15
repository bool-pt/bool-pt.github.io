import type { Locale } from './config.ts';
import { t, enKeys } from './t.ts';

const INDEX_RE = /^\d+$/;

/**
 * Collect a numbered list of simple string values from flat i18n keys.
 *
 * Given prefix "knowledgeCenter.filters", scans en.json for:
 *   knowledgeCenter.filters.1, knowledgeCenter.filters.2, ...
 *
 * Returns a string[] sorted by index.
 */
export function tList(prefix: string, locale?: Locale): string[] {
  const prefixDot = prefix + '.';
  const indices = new Set<string>();
  for (const key of enKeys) {
    if (!key.startsWith(prefixDot)) continue;
    const segment = key.slice(prefixDot.length);
    if (INDEX_RE.test(segment)) {
      indices.add(segment);
    }
  }
  return [...indices]
    .sort((a, b) => Number(a) - Number(b))
    .map((index) => t(`${prefixDot}${index}`, locale));
}

/**
 * Collect numbered items from flat i18n keys.
 *
 * Given prefix "teamTestimonials" and fields ["quote", "name", "role"],
 * scans en.json for keys like:
 *   teamTestimonials.1.quote, teamTestimonials.1.name, teamTestimonials.1.role
 *   teamTestimonials.2.quote, ...
 *
 * Returns an array of objects with translated values, sorted by index.
 * Uses en.json as the source of truth for which indices exist.
 */
export function tCollection<F extends string>(
  prefix: string,
  fields: F[],
  locale?: Locale
): Record<F, string>[] {
  const prefixDot = prefix + '.';
  const firstField = fields[0];

  // Detect all unique indices under this prefix by looking for the first field
  const indices = new Set<string>();
  for (const key of enKeys) {
    if (!key.startsWith(prefixDot)) continue;
    const rest = key.slice(prefixDot.length);
    const dotPos = rest.indexOf('.');
    if (dotPos === -1) continue;
    const segment = rest.slice(0, dotPos);
    const suffix = rest.slice(dotPos + 1);
    if (suffix === firstField && INDEX_RE.test(segment)) {
      indices.add(segment);
    }
  }

  // Sort numerically
  const sorted = [...indices].sort((a, b) => Number(a) - Number(b));

  // Build objects
  return sorted.map((index) => {
    const item = {} as Record<F, string>;
    for (const field of fields) {
      item[field] = t(`${prefixDot}${index}.${field}`, locale);
    }
    return item;
  });
}
