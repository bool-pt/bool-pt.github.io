import { translations, defaultLocale } from '@bool/i18n';
import type { Locale } from '@bool/i18n';

const NUMERIC_RE = /^\d+$/;

/**
 * Walks flat i18n keys and reconstructs an array of items from a `prefix.N.*` group.
 *
 * Given prefix `caseStudies.items` and an en.json with keys like:
 *   caseStudies.items.1.client
 *   caseStudies.items.1.title
 *   caseStudies.items.1.tags.1
 *   caseStudies.items.1.tags.2
 *   caseStudies.items.2.client
 *   ...
 *
 * Returns an array of plain records keyed by suffix:
 *   [
 *     { client: '...', title: '...', 'tags.1': '...', 'tags.2': '...' },
 *     { client: '...', title: '...', ... },
 *   ]
 *
 * Items are sorted by numeric index. Missing suffixes default to empty string,
 * letting consumer schemas validate / coerce.
 */
export function collectArray(
  prefix: string,
  locale: Locale = defaultLocale
): Record<string, string>[] {
  const source = translations[locale] ?? translations[defaultLocale] ?? {};
  const fallback = translations[defaultLocale] ?? {};

  const prefixDot = `${prefix}.`;
  const itemMap = new Map<number, Record<string, string>>();

  for (const key of Object.keys(source)) {
    if (!key.startsWith(prefixDot)) continue;
    const rest = key.slice(prefixDot.length);
    const dotPos = rest.indexOf('.');
    if (dotPos === -1) continue;
    const indexSegment = rest.slice(0, dotPos);
    if (!NUMERIC_RE.test(indexSegment)) continue;
    const idx = Number(indexSegment);
    const suffix = rest.slice(dotPos + 1);

    let item = itemMap.get(idx);
    if (!item) {
      item = {};
      itemMap.set(idx, item);
    }
    const value = source[key] ?? fallback[key] ?? '';
    item[suffix] = value;
  }

  return [...itemMap.entries()].sort((a, b) => a[0] - b[0]).map(([, item]) => item);
}

/**
 * Collapses nested numbered keys (e.g. `tags.1`, `tags.2`, `tags.3`) into an
 * array of non-empty strings, in numeric order.
 */
export function collectNestedList(item: Record<string, string>, innerPrefix: string): string[] {
  const innerDot = `${innerPrefix}.`;
  const indexed: Array<{ idx: number; value: string }> = [];
  for (const [suffix, value] of Object.entries(item)) {
    if (!suffix.startsWith(innerDot)) continue;
    const rest = suffix.slice(innerDot.length);
    if (!NUMERIC_RE.test(rest)) continue;
    if (!value || !value.trim()) continue;
    indexed.push({ idx: Number(rest), value: value.trim() });
  }
  return indexed.sort((a, b) => a.idx - b.idx).map((x) => x.value);
}
