import type { RepeatingGroupTemplate } from './types';

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
  return [...numericGroups, ...namedGroups];
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
