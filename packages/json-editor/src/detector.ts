import type { NestedRepeatingTemplate, RepeatingGroupTemplate } from './types';

const NUMERIC_RE = /^\d+$/;

/**
 * Detect repeating groups within a set of flat keys that share a section prefix.
 *
 * A repeating group is identified when multiple keys share a common prefix
 * followed by a numeric segment (e.g., "testimonials.1.quote", "testimonials.2.quote").
 *
 * Also detects "named" repeating groups where 3+ siblings share identical field
 * structures under a common prefix (e.g., "tech.outsystems.*", "tech.mendix.*").
 */
export function detectRepeatingGroups(
  keys: string[],
  sectionPrefix: string,
): RepeatingGroupTemplate[] {
  const numericGroups = detectNumericGroups(keys, sectionPrefix);
  const namedGroups = detectNamedGroups(keys, sectionPrefix, numericGroups);
  const all = [...numericGroups, ...namedGroups];
  return all.map((template) => withNestedTemplates(template, keys));
}

/**
 * For a top-level group, finds inner `prefix.N.inner.M[.suffix]` patterns and
 * promotes them to nested templates. Suffixes that match an inner-prefix get
 * stripped from the parent's flat field list so they don't show up twice in the
 * UI.
 */
function withNestedTemplates(
  template: RepeatingGroupTemplate,
  allKeys: string[],
): RepeatingGroupTemplate {
  const innerMap = new Map<string, Map<string, Set<string>>>();
  const dot = `${template.prefix}.`;

  for (const key of allKeys) {
    if (!key.startsWith(dot)) continue;
    const rest = key.slice(dot.length);
    const segments = rest.split('.');
    if (segments.length < 4) continue;
    const parentIndex = segments[0];
    const innerPrefix = segments[1];
    const innerIndex = segments[2];
    if (!parentIndex || !innerPrefix || !innerIndex) continue;
    if (!NUMERIC_RE.test(parentIndex)) continue;
    if (!NUMERIC_RE.test(innerIndex)) continue;
    const innerSuffix = segments.slice(3).join('.');

    let perItemMap = innerMap.get(innerPrefix);
    if (!perItemMap) {
      perItemMap = new Map();
      innerMap.set(innerPrefix, perItemMap);
    }
    let suffixSet = perItemMap.get(innerIndex);
    if (!suffixSet) {
      suffixSet = new Set();
      perItemMap.set(innerIndex, suffixSet);
    }
    suffixSet.add(innerSuffix);
  }

  // Also detect the simpler `prefix.N.inner.M` (bare value, no inner suffix).
  for (const key of allKeys) {
    if (!key.startsWith(dot)) continue;
    const rest = key.slice(dot.length);
    const segments = rest.split('.');
    if (segments.length !== 3) continue;
    const parentIndex = segments[0];
    const innerPrefix = segments[1];
    const innerIndex = segments[2];
    if (!parentIndex || !innerPrefix || !innerIndex) continue;
    if (!NUMERIC_RE.test(parentIndex)) continue;
    if (!NUMERIC_RE.test(innerIndex)) continue;

    let perItemMap = innerMap.get(innerPrefix);
    if (!perItemMap) {
      perItemMap = new Map();
      innerMap.set(innerPrefix, perItemMap);
    }
    let suffixSet = perItemMap.get(innerIndex);
    if (!suffixSet) {
      suffixSet = new Set();
      perItemMap.set(innerIndex, suffixSet);
    }
    suffixSet.add('');
  }

  if (innerMap.size === 0) return template;

  const nestedTemplates: NestedRepeatingTemplate[] = [];
  const consumedSuffixes = new Set<string>();

  for (const [innerPrefix, perItemMap] of innerMap) {
    // Collect every suffix used across every parent item for this inner prefix.
    const allInnerSuffixes = new Set<string>();
    for (const set of perItemMap.values()) {
      for (const s of set) allInnerSuffixes.add(s);
    }
    nestedTemplates.push({
      innerPrefix,
      fieldSuffixes: [...allInnerSuffixes].sort(),
    });
    // Mark the parent suffixes that belong to this inner group as consumed.
    for (const innerSuffix of allInnerSuffixes) {
      consumedSuffixes.add(innerSuffix === '' ? `${innerPrefix}` : `${innerPrefix}.${innerSuffix}`);
    }
    // Also catch inner index suffixes like `tags.1`, `tags.2` — these appear in
    // the parent's flat field list when only bare values are used.
    for (const [innerIndex, suffixSet] of perItemMap.entries()) {
      consumedSuffixes.add(`${innerPrefix}.${innerIndex}`);
      for (const innerSuffix of suffixSet) {
        if (innerSuffix === '') continue;
        consumedSuffixes.add(`${innerPrefix}.${innerIndex}.${innerSuffix}`);
      }
    }
  }

  const remainingSuffixes = template.fieldSuffixes.filter((s) => !consumedSuffixes.has(s));

  return {
    ...template,
    fieldSuffixes: remainingSuffixes,
    nestedTemplates: nestedTemplates.sort((a, b) => a.innerPrefix.localeCompare(b.innerPrefix)),
  };
}

function detectNumericGroups(
  keys: string[],
  sectionPrefix: string,
): RepeatingGroupTemplate[] {
  // Map: prefix-before-numeric → Map<numericIndex, Set<suffix-after-numeric>>
  const groupMap = new Map<string, Map<string, Set<string>>>();

  for (const key of keys) {
    const relative = stripPrefix(key, sectionPrefix);
    if (!relative) continue;

    const segments = relative.split('.');
    const numericIdx = segments.findIndex((s) => NUMERIC_RE.test(s));
    if (numericIdx === -1) continue;

    const prefix = sectionPrefix + '.' + segments.slice(0, numericIdx).join('.');
    const index = segments[numericIdx];
    if (!index) continue;
    const suffix = segments.slice(numericIdx + 1).join('.');

    let indexMap = groupMap.get(prefix);
    if (!indexMap) {
      indexMap = new Map();
      groupMap.set(prefix, indexMap);
    }
    let suffixSet = indexMap.get(index);
    if (!suffixSet) {
      suffixSet = new Set();
      indexMap.set(index, suffixSet);
    }
    suffixSet.add(suffix);
  }

  const templates: RepeatingGroupTemplate[] = [];

  for (const [prefix, indexMap] of groupMap) {
    // Need at least 2 distinct indices to qualify as a repeating group
    if (indexMap.size < 2) continue;

    // Collect all unique suffixes across all items as the template
    const allSuffixes = new Set<string>();
    for (const suffixes of indexMap.values()) {
      for (const s of suffixes) {
        allSuffixes.add(s);
      }
    }

    templates.push({
      prefix,
      fieldSuffixes: [...allSuffixes].sort(),
    });
  }

  return templates.sort((a, b) => a.prefix.localeCompare(b.prefix));
}

function detectNamedGroups(
  keys: string[],
  sectionPrefix: string,
  existingGroups: RepeatingGroupTemplate[],
): RepeatingGroupTemplate[] {
  const existingPrefixes = new Set(existingGroups.map((g) => g.prefix));

  // Map: potential prefix → Map<named-key, Set<suffix>>
  const groupMap = new Map<string, Map<string, Set<string>>>();

  for (const key of keys) {
    const relative = stripPrefix(key, sectionPrefix);
    if (!relative) continue;

    const segments = relative.split('.');
    // Skip keys that are part of numeric repeating groups
    if (segments.some((s) => NUMERIC_RE.test(s))) continue;
    // Need at least 3 segments: prefix.name.field
    if (segments.length < 3) continue;

    // Try each possible split point for prefix.name.suffix
    for (let splitAt = 1; splitAt < segments.length - 1; splitAt++) {
      const prefix = sectionPrefix + '.' + segments.slice(0, splitAt).join('.');
      if (existingPrefixes.has(prefix)) continue;

      const name = segments[splitAt];
      if (!name) continue;
      const suffix = segments.slice(splitAt + 1).join('.');

      let nameMap = groupMap.get(prefix);
      if (!nameMap) {
        nameMap = new Map();
        groupMap.set(prefix, nameMap);
      }
      let suffixSet = nameMap.get(name);
      if (!suffixSet) {
        suffixSet = new Set();
        nameMap.set(name, suffixSet);
      }
      suffixSet.add(suffix);
    }
  }

  const templates: RepeatingGroupTemplate[] = [];

  for (const [prefix, nameMap] of groupMap) {
    // Need at least 3 named siblings to detect as a group
    if (nameMap.size < 3) continue;

    // Check if all named items share a similar field structure
    const suffixSets = [...nameMap.values()];
    const firstSet = suffixSets[0];
    if (!firstSet) continue;
    const referenceSuffixes = [...firstSet].sort().join(',');
    const allSimilar = suffixSets.every((s) => {
      const sorted = [...s].sort().join(',');
      return sorted === referenceSuffixes;
    });

    if (!allSimilar) continue;

    templates.push({
      prefix,
      fieldSuffixes: [...firstSet].sort(),
    });
  }

  return templates.sort((a, b) => a.prefix.localeCompare(b.prefix));
}

function stripPrefix(key: string, prefix: string): string | null {
  if (!key.startsWith(prefix + '.')) return null;
  return key.slice(prefix.length + 1);
}
