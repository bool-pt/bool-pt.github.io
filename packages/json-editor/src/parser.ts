import { detectRepeatingGroups } from './detector';
import { classifyField } from './field-kinds';
import type {
  NestedRepeatingGroup,
  NestedRepeatingItem,
  PageMeta,
  ParsedTree,
  RepeatingGroup,
  RepeatingGroupItem,
  RepeatingGroupTemplate,
  Section,
  TranslationField,
} from './types';

const NUMERIC_RE = /^\d+$/;

/**
 * Convert a camelCase or dot.notation prefix to a human-readable label.
 * Used as fallback when no _meta.labels.* key exists for a prefix.
 */
function camelToLabel(str: string): string {
  const parts = str.split('.');
  const lastSegment = (parts.length > 1 ? parts[parts.length - 1] : str) ?? str;
  return lastSegment
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Parse all _meta keys from the JSON.
 * Extracts pages, shared sections, section labels, and page labels.
 */
function parseMetaKeys(json: Record<string, string>): {
  pages: PageMeta[];
  sharedSections: string[];
  sectionLabels: Record<string, string>;
  pageLabels: Record<string, string>;
} {
  const pages: PageMeta[] = [];
  let sharedSections: string[] = [];
  const sectionLabels: Record<string, string> = {};
  const pageLabels: Record<string, string> = {};

  for (const [key, value] of Object.entries(json)) {
    if (key.startsWith('_meta.pages.')) {
      const pageName = key.slice('_meta.pages.'.length);
      const sectionNames = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      pages.push({
        name: pageName,
        label: pageName, // placeholder, resolved below
        sectionNames,
      });
    } else if (key === '_meta.shared') {
      sharedSections = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (key.startsWith('_meta.labels.')) {
      const prefix = key.slice('_meta.labels.'.length);
      sectionLabels[prefix] = value;
    } else if (key.startsWith('_meta.pageLabels.')) {
      const pageName = key.slice('_meta.pageLabels.'.length);
      pageLabels[pageName] = value;
    }
  }

  // Resolve page labels
  for (const page of pages) {
    page.label = pageLabels[page.name] ?? camelToLabel(page.name);
  }

  return { pages, sharedSections, sectionLabels, pageLabels };
}

/**
 * Parse a flat dot-notation JSON into a structured tree of sections,
 * with automatic repeating group detection and _meta page mappings.
 * Fully generic — all labels and structure come from the JSON itself.
 */
export function parseFlatJson(json: Record<string, string>): ParsedTree {
  const keyOrder = Object.keys(json);
  const { pages, sharedSections, sectionLabels } = parseMetaKeys(json);

  const sectionMap = new Map<string, string[]>();

  // Group keys by first segment (skip _meta keys)
  for (const key of keyOrder) {
    if (key.startsWith('_meta.')) continue;

    const firstDot = key.indexOf('.');
    const sectionName = firstDot === -1 ? key : key.slice(0, firstDot);

    let sectionKeys = sectionMap.get(sectionName);
    if (!sectionKeys) {
      sectionKeys = [];
      sectionMap.set(sectionName, sectionKeys);
    }
    sectionKeys.push(key);
  }

  const sections: Section[] = [];

  for (const [sectionName, keys] of sectionMap) {
    const templates = detectRepeatingGroups(keys, sectionName);
    const repeatingGroups = buildRepeatingGroups(keys, json, templates);

    const repeatingKeys = new Set<string>();
    for (const group of repeatingGroups) {
      for (const item of group.items) {
        for (const field of item.fields) {
          repeatingKeys.add(field.key);
        }
        if (item.nestedGroups) {
          for (const nested of item.nestedGroups) {
            for (const innerItem of nested.items) {
              for (const field of innerItem.fields) {
                repeatingKeys.add(field.key);
              }
            }
          }
        }
      }
    }

    const fields: TranslationField[] = keys
      .filter((k) => !repeatingKeys.has(k))
      .map((k) => ({
        key: k,
        value: json[k] ?? '',
        isDirty: false,
        kind: classifyField(k),
      }));

    sections.push({
      name: sectionName,
      label: sectionLabels[sectionName] ?? camelToLabel(sectionName),
      fields,
      repeatingGroups,
      keyCount: keys.length,
    });
  }

  // Preserve all _meta keys for round-trip serialization
  const metaKeys: Record<string, string> = {};
  for (const key of keyOrder) {
    const metaValue = json[key];
    if (key.startsWith('_meta.') && metaValue !== undefined) {
      metaKeys[key] = metaValue;
    }
  }

  return {
    sections,
    pages,
    sharedSections,
    metaKeys,
    totalKeys: keyOrder.length,
    keyOrder,
  };
}

function buildRepeatingGroups(
  keys: string[],
  json: Record<string, string>,
  templates: RepeatingGroupTemplate[],
): RepeatingGroup[] {
  const groups: RepeatingGroup[] = [];

  for (const template of templates) {
    const itemMap = new Map<string, TranslationField[]>();

    for (const key of keys) {
      if (!key.startsWith(template.prefix + '.')) continue;

      const afterPrefix = key.slice(template.prefix.length + 1);
      const segments = afterPrefix.split('.');
      const index = segments[0];
      if (!index) continue;

      const isNumericIndex = NUMERIC_RE.test(index);
      const isNamedIndex = !isNumericIndex && template.fieldSuffixes.some((s) => s !== '');

      if (!isNumericIndex && !isNamedIndex) continue;

      const suffix = segments.length > 1 ? segments.slice(1).join('.') : '';
      if (!template.fieldSuffixes.includes(suffix)) continue;

      let items = itemMap.get(index);
      if (!items) {
        items = [];
        itemMap.set(index, items);
      }
      items.push({
        key,
        value: json[key] ?? '',
        isDirty: false,
        kind: classifyField(key),
      });
    }

    const sortedEntries = [...itemMap.entries()].sort((a, b) => {
      const aNum = Number(a[0]);
      const bNum = Number(b[0]);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a[0].localeCompare(b[0]);
    });

    const items: RepeatingGroupItem[] = sortedEntries.map(([index, fields]) => {
      const sortedFields = fields.sort((a, b) => {
        const aSuffix = a.key.slice(template.prefix.length + index.length + 2);
        const bSuffix = b.key.slice(template.prefix.length + index.length + 2);
        return (
          template.fieldSuffixes.indexOf(aSuffix) -
          template.fieldSuffixes.indexOf(bSuffix)
        );
      });
      const nestedGroups = buildNestedGroups(
        template,
        index,
        keys,
        json,
      );
      return nestedGroups.length > 0
        ? { index, fields: sortedFields, nestedGroups }
        : { index, fields: sortedFields };
    });

    if (items.length > 0) {
      groups.push({
        prefix: template.prefix,
        label: camelToLabel(template.prefix),
        template,
        items,
      });
    }
  }

  return groups;
}

function buildNestedGroups(
  parentTemplate: RepeatingGroupTemplate,
  parentIndex: string,
  allKeys: string[],
  json: Record<string, string>,
): NestedRepeatingGroup[] {
  const nestedTemplates = parentTemplate.nestedTemplates ?? [];
  if (nestedTemplates.length === 0) return [];

  const result: NestedRepeatingGroup[] = [];

  for (const nestedTemplate of nestedTemplates) {
    const innerPrefix = `${parentTemplate.prefix}.${parentIndex}.${nestedTemplate.innerPrefix}`;
    const innerDot = `${innerPrefix}.`;
    const itemMap = new Map<string, TranslationField[]>();

    for (const key of allKeys) {
      if (!key.startsWith(innerDot)) continue;
      const rest = key.slice(innerDot.length);
      const segments = rest.split('.');
      const innerIndex = segments[0];
      if (!innerIndex || !NUMERIC_RE.test(innerIndex)) continue;
      const innerSuffix = segments.slice(1).join('.');
      if (!nestedTemplate.fieldSuffixes.includes(innerSuffix)) continue;

      let fields = itemMap.get(innerIndex);
      if (!fields) {
        fields = [];
        itemMap.set(innerIndex, fields);
      }
      fields.push({
        key,
        value: json[key] ?? '',
        isDirty: false,
        kind: classifyField(key),
      });
    }

    const sortedEntries = [...itemMap.entries()].sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    );

    const items: NestedRepeatingItem[] = sortedEntries.map(([index, fields]) => ({
      index,
      fields: fields.sort((a, b) => {
        const aSuffix = a.key.slice(innerDot.length + index.length + (nestedTemplate.fieldSuffixes.includes('') ? 0 : 1));
        const bSuffix = b.key.slice(innerDot.length + index.length + (nestedTemplate.fieldSuffixes.includes('') ? 0 : 1));
        return nestedTemplate.fieldSuffixes.indexOf(aSuffix) - nestedTemplate.fieldSuffixes.indexOf(bSuffix);
      }),
    }));

    result.push({
      prefix: innerPrefix,
      innerPrefix: nestedTemplate.innerPrefix,
      template: nestedTemplate,
      items,
    });
  }

  return result;
}
