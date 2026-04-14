import { classifyField } from './field-kinds';
import type {
  NestedRepeatingItem,
  Section,
  TranslationField,
} from './types';

const NUMERIC_RE = /^\d+$/;

/**
 * Update a single field's value by its full key.
 * Returns a new sections array (immutable).
 */
export function updateField(
  sections: Section[],
  fullKey: string,
  newValue: string,
): Section[] {
  return sections.map((section) => {
    // Check simple fields
    const fieldIdx = section.fields.findIndex((f) => f.key === fullKey);
    if (fieldIdx !== -1) {
      const newFields = [...section.fields];
      const existing = newFields[fieldIdx];
      if (existing) {
        newFields[fieldIdx] = { ...existing, value: newValue, isDirty: true };
      }
      return { ...section, fields: newFields };
    }

    // Check repeating groups (and their nested inner groups)
    for (let gi = 0; gi < section.repeatingGroups.length; gi++) {
      const group = section.repeatingGroups[gi];
      if (!group) continue;
      for (let ii = 0; ii < group.items.length; ii++) {
        const item = group.items[ii];
        if (!item) continue;

        // Direct (top-level) field on the item
        const fi = item.fields.findIndex((f) => f.key === fullKey);
        if (fi !== -1) {
          const existingField = item.fields[fi];
          if (!existingField) continue;
          const newField = { ...existingField, value: newValue, isDirty: true };
          const newFields = [...item.fields];
          newFields[fi] = newField;
          const newItem = { ...item, fields: newFields };
          const newItems = [...group.items];
          newItems[ii] = newItem;
          const newGroup = { ...group, items: newItems };
          const newGroups = [...section.repeatingGroups];
          newGroups[gi] = newGroup;
          return { ...section, repeatingGroups: newGroups };
        }

        // Nested-group fields under this item
        if (item.nestedGroups) {
          for (let ngi = 0; ngi < item.nestedGroups.length; ngi++) {
            const nested = item.nestedGroups[ngi];
            if (!nested) continue;
            for (let nii = 0; nii < nested.items.length; nii++) {
              const innerItem = nested.items[nii];
              if (!innerItem) continue;
              const nfi = innerItem.fields.findIndex((f) => f.key === fullKey);
              if (nfi === -1) continue;
              const existingField = innerItem.fields[nfi];
              if (!existingField) continue;
              const newField = { ...existingField, value: newValue, isDirty: true };
              const newInnerFields = [...innerItem.fields];
              newInnerFields[nfi] = newField;
              const newInnerItem = { ...innerItem, fields: newInnerFields };
              const newInnerItems = [...nested.items];
              newInnerItems[nii] = newInnerItem;
              const newNested = { ...nested, items: newInnerItems };
              const newNestedGroups = [...item.nestedGroups];
              newNestedGroups[ngi] = newNested;
              const newItem = { ...item, nestedGroups: newNestedGroups };
              const newItems = [...group.items];
              newItems[ii] = newItem;
              const newGroup = { ...group, items: newItems };
              const newGroups = [...section.repeatingGroups];
              newGroups[gi] = newGroup;
              return { ...section, repeatingGroups: newGroups };
            }
          }
        }
      }
    }

    return section;
  });
}

/**
 * Add a new empty item to a repeating group.
 * For numeric groups, uses the next sequential index.
 * Returns a new sections array.
 */
export function addItem(sections: Section[], groupPrefix: string): Section[] {
  return sections.map((section) => {
    const gi = section.repeatingGroups.findIndex((g) => g.prefix === groupPrefix);
    if (gi === -1) return section;

    const group = section.repeatingGroups[gi];
    if (!group) return section;
    const { template, items } = group;

    // Determine next index
    const numericIndices = items
      .map((item) => Number(item.index))
      .filter((n) => !isNaN(n));

    const nextIndex =
      numericIndices.length > 0 ? String(Math.max(...numericIndices) + 1) : '1';

    // Create new item with empty fields from the template
    const newFields: TranslationField[] = template.fieldSuffixes.map((suffix) => ({
      key: suffix ? `${groupPrefix}.${nextIndex}.${suffix}` : `${groupPrefix}.${nextIndex}`,
      value: '',
      isDirty: true,
    }));

    const newItem = { index: nextIndex, fields: newFields };
    const newItems = [...items, newItem];
    const newGroup = { ...group, items: newItems };
    const newGroups = [...section.repeatingGroups];
    newGroups[gi] = newGroup;

    return {
      ...section,
      repeatingGroups: newGroups,
      keyCount: section.keyCount + template.fieldSuffixes.length,
    };
  });
}

/**
 * Remove an item from a repeating group and renumber subsequent items.
 * Returns a new sections array.
 */
export function removeItem(
  sections: Section[],
  groupPrefix: string,
  index: string,
): Section[] {
  return sections.map((section) => {
    const gi = section.repeatingGroups.findIndex((g) => g.prefix === groupPrefix);
    if (gi === -1) return section;

    const group = section.repeatingGroups[gi];
    if (!group) return section;
    const removedItem = group.items.find((item) => item.index === index);
    if (!removedItem) return section;

    const removedCount = removedItem.fields.length;
    const isNumeric = NUMERIC_RE.test(index);

    let newItems = group.items.filter((item) => item.index !== index);

    // Renumber if numeric indices
    if (isNumeric) {
      newItems = renumberItems(newItems, groupPrefix, group.template.fieldSuffixes);
    }

    const newGroup = { ...group, items: newItems };
    const newGroups = [...section.repeatingGroups];
    newGroups[gi] = newGroup;

    return {
      ...section,
      repeatingGroups: newGroups,
      keyCount: section.keyCount - removedCount,
    };
  });
}

/**
 * Reorder an item within a repeating group.
 * Moves the item at `fromIndex` to `toIndex` position and renumbers.
 */
export function reorderItem(
  sections: Section[],
  groupPrefix: string,
  fromPosition: number,
  toPosition: number,
): Section[] {
  return sections.map((section) => {
    const gi = section.repeatingGroups.findIndex((g) => g.prefix === groupPrefix);
    if (gi === -1) return section;

    const group = section.repeatingGroups[gi];
    if (!group) return section;
    const items = [...group.items];

    if (
      fromPosition < 0 ||
      fromPosition >= items.length ||
      toPosition < 0 ||
      toPosition >= items.length
    ) {
      return section;
    }

    // Move item
    const [moved] = items.splice(fromPosition, 1);
    if (!moved) return section;
    items.splice(toPosition, 0, moved);

    // Renumber all items
    const renumbered = renumberItems(
      items,
      groupPrefix,
      group.template.fieldSuffixes,
    );

    const newGroup = { ...group, items: renumbered };
    const newGroups = [...section.repeatingGroups];
    newGroups[gi] = newGroup;

    return { ...section, repeatingGroups: newGroups };
  });
}

/**
 * Renumber items sequentially starting from 1, updating all field keys.
 * Also rewrites keys inside any nested groups under each item.
 */
function renumberItems(
  items: { index: string; fields: TranslationField[]; nestedGroups?: Array<{ prefix: string; innerPrefix: string; template: { innerPrefix: string; fieldSuffixes: string[] }; items: NestedRepeatingItem[] }> }[],
  prefix: string,
  fieldSuffixes: string[],
): typeof items {
  return items.map((item, i) => {
    const newIndex = String(i + 1);
    if (item.index === newIndex) return item;

    const newFields = item.fields.map((field) => {
      // Reconstruct key with new index
      const suffix = fieldSuffixes.find((s) => {
        const expectedKey = s ? `${prefix}.${item.index}.${s}` : `${prefix}.${item.index}`;
        return field.key === expectedKey;
      });
      if (suffix === undefined) return { ...field, isDirty: true };

      return {
        ...field,
        key: suffix ? `${prefix}.${newIndex}.${suffix}` : `${prefix}.${newIndex}`,
        isDirty: true,
      };
    });

    const newNestedGroups = item.nestedGroups?.map((nested) => {
      const newInnerPrefix = `${prefix}.${newIndex}.${nested.innerPrefix}`;
      return {
        ...nested,
        prefix: newInnerPrefix,
        items: nested.items.map((innerItem) => ({
          ...innerItem,
          fields: innerItem.fields.map((field) => {
            const innerSuffix = field.key.slice(nested.prefix.length + innerItem.index.length + 2);
            const newKey = innerSuffix
              ? `${newInnerPrefix}.${innerItem.index}.${innerSuffix}`
              : `${newInnerPrefix}.${innerItem.index}`;
            return { ...field, key: newKey, isDirty: true };
          }),
        })),
      };
    });

    return newNestedGroups
      ? { index: newIndex, fields: newFields, nestedGroups: newNestedGroups }
      : { index: newIndex, fields: newFields };
  });
}

/* ------------------------------------------------------------------ */
/*  Nested-group operations                                            */
/* ------------------------------------------------------------------ */

/**
 * Add an empty inner item to a nested group (e.g. add another `tags` entry to
 * `caseStudies.items.1.tags`).
 */
export function addNestedItem(
  sections: Section[],
  parentGroupPrefix: string,
  parentIndex: string,
  innerPrefix: string,
): Section[] {
  return mapNestedGroup(sections, parentGroupPrefix, parentIndex, innerPrefix, (nested) => {
    const numericIndices = nested.items
      .map((it) => Number(it.index))
      .filter((n) => !isNaN(n));
    const nextIndex = numericIndices.length > 0 ? String(Math.max(...numericIndices) + 1) : '1';
    const newFields: TranslationField[] = nested.template.fieldSuffixes.map((suffix) => {
      const key = suffix
        ? `${nested.prefix}.${nextIndex}.${suffix}`
        : `${nested.prefix}.${nextIndex}`;
      return { key, value: '', isDirty: true, kind: classifyField(key) };
    });
    const newItem: NestedRepeatingItem = { index: nextIndex, fields: newFields };
    return { ...nested, items: [...nested.items, newItem] };
  });
}

export function removeNestedItem(
  sections: Section[],
  parentGroupPrefix: string,
  parentIndex: string,
  innerPrefix: string,
  index: string,
): Section[] {
  return mapNestedGroup(sections, parentGroupPrefix, parentIndex, innerPrefix, (nested) => {
    const filtered = nested.items.filter((it) => it.index !== index);
    if (filtered.length === nested.items.length) return nested;
    const renumbered = renumberNestedItems(filtered, nested.prefix, nested.template.fieldSuffixes);
    return { ...nested, items: renumbered };
  });
}

export function reorderNestedItem(
  sections: Section[],
  parentGroupPrefix: string,
  parentIndex: string,
  innerPrefix: string,
  fromPosition: number,
  toPosition: number,
): Section[] {
  return mapNestedGroup(sections, parentGroupPrefix, parentIndex, innerPrefix, (nested) => {
    if (
      fromPosition < 0 ||
      fromPosition >= nested.items.length ||
      toPosition < 0 ||
      toPosition >= nested.items.length
    ) {
      return nested;
    }
    const items = [...nested.items];
    const [moved] = items.splice(fromPosition, 1);
    if (!moved) return nested;
    items.splice(toPosition, 0, moved);
    const renumbered = renumberNestedItems(items, nested.prefix, nested.template.fieldSuffixes);
    return { ...nested, items: renumbered };
  });
}

function renumberNestedItems(
  items: NestedRepeatingItem[],
  prefix: string,
  fieldSuffixes: string[],
): NestedRepeatingItem[] {
  return items.map((item, i) => {
    const newIndex = String(i + 1);
    if (item.index === newIndex) return item;
    const newFields = item.fields.map((field) => {
      const suffix = fieldSuffixes.find((s) => {
        const expectedKey = s ? `${prefix}.${item.index}.${s}` : `${prefix}.${item.index}`;
        return field.key === expectedKey;
      });
      if (suffix === undefined) return { ...field, isDirty: true };
      return {
        ...field,
        key: suffix ? `${prefix}.${newIndex}.${suffix}` : `${prefix}.${newIndex}`,
        isDirty: true,
      };
    });
    return { index: newIndex, fields: newFields };
  });
}

/**
 * Helper: locate a single nested group inside the section tree and apply a
 * pure transform to it. Returns a new sections array; if the group isn't found
 * the input is returned unchanged.
 */
function mapNestedGroup(
  sections: Section[],
  parentGroupPrefix: string,
  parentIndex: string,
  innerPrefix: string,
  transform: (
    nested: NonNullable<Section['repeatingGroups'][number]['items'][number]['nestedGroups']>[number],
  ) => typeof nested,
): Section[] {
  return sections.map((section) => {
    const gi = section.repeatingGroups.findIndex((g) => g.prefix === parentGroupPrefix);
    if (gi === -1) return section;
    const group = section.repeatingGroups[gi];
    if (!group) return section;
    const ii = group.items.findIndex((it) => it.index === parentIndex);
    if (ii === -1) return section;
    const item = group.items[ii];
    if (!item?.nestedGroups) return section;
    const ngi = item.nestedGroups.findIndex((ng) => ng.innerPrefix === innerPrefix);
    if (ngi === -1) return section;
    const oldNested = item.nestedGroups[ngi];
    if (!oldNested) return section;
    const newNested = transform(oldNested);
    if (newNested === oldNested) return section;

    const newNestedGroups = [...item.nestedGroups];
    newNestedGroups[ngi] = newNested;
    const newItem = { ...item, nestedGroups: newNestedGroups };
    const newItems = [...group.items];
    newItems[ii] = newItem;
    const newGroup = { ...group, items: newItems };
    const newGroups = [...section.repeatingGroups];
    newGroups[gi] = newGroup;
    return { ...section, repeatingGroups: newGroups };
  });
}
