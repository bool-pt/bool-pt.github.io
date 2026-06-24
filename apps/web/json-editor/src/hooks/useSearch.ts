import { useMemo } from 'react';
import type { Section, TranslationField } from '@bool/json-editor-core';

export interface SearchResult {
  sectionName: string;
  sectionLabel: string;
  field: TranslationField;
  /** Which part matched: 'key', 'value', or 'both' */
  matchType: 'key' | 'value' | 'both';
}

/**
 * Search across all sections for fields matching the query.
 * Searches both keys and values (case-insensitive).
 */
export function useSearch(sections: Section[], query: string): SearchResult[] {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const results: SearchResult[] = [];

    for (const section of sections) {
      const addMatch = (field: TranslationField) => {
        const keyMatch = field.key.toLowerCase().includes(trimmed);
        const valueMatch = field.value.toLowerCase().includes(trimmed);

        if (keyMatch || valueMatch) {
          results.push({
            sectionName: section.name,
            sectionLabel: section.label,
            field,
            matchType: keyMatch && valueMatch ? 'both' : keyMatch ? 'key' : 'value',
          });
        }
      };

      for (const field of section.fields) {
        addMatch(field);
      }

      for (const group of section.repeatingGroups) {
        for (const item of group.items) {
          for (const field of item.fields) {
            addMatch(field);
          }
        }
      }
    }

    return results;
  }, [sections, query]);
}
