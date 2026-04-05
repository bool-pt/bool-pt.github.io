import type { Section } from './types';

/**
 * Serialize sections back to a flat dot-notation JSON object.
 * Optionally prepends _meta keys for round-trip fidelity.
 */
export function serialize(
  sections: Section[],
  metaKeys?: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  // _meta keys first (preserves structure on round-trip)
  if (metaKeys) {
    for (const [key, value] of Object.entries(metaKeys)) {
      result[key] = value;
    }
  }

  for (const section of sections) {
    for (const field of section.fields) {
      result[field.key] = field.value;
    }

    for (const group of section.repeatingGroups) {
      for (const item of group.items) {
        for (const field of item.fields) {
          result[field.key] = field.value;
        }
      }
    }
  }

  return result;
}

/**
 * Serialize to a formatted JSON string with 2-space indentation.
 */
export function serializeToString(
  sections: Section[],
  metaKeys?: Record<string, string>,
): string {
  return JSON.stringify(serialize(sections, metaKeys), null, 2) + '\n';
}
