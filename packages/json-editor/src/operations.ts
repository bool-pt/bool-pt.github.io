import type { Section, TranslationField } from './types';

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

    // Check repeating groups
    for (let gi = 0; gi < section.repeatingGroups.length; gi++) {
      const group = section.repeatingGroups[gi];
      if (!group) return section;
      for (let ii = 0; ii < group.items.length; ii++) {
        const item = group.items[ii];
        if (!item) continue;
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
 */
function renumberItems(
  items: { index: string; fields: TranslationField[] }[],
  prefix: string,
  fieldSuffixes: string[],
): { index: string; fields: TranslationField[] }[] {
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

    return { index: newIndex, fields: newFields };
  });
}
