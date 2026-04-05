import { describe, it, expect } from 'vitest';
import { updateField, addItem, removeItem, reorderItem } from './operations';
import { parseFlatJson } from './parser';

const testJson: Record<string, string> = {
  'hero.title': 'Hello',
  'hero.subtitle': 'World',
  'testimonials.slides.1.quote': 'Great!',
  'testimonials.slides.1.name': 'Alice',
  'testimonials.slides.2.quote': 'Amazing!',
  'testimonials.slides.2.name': 'Bob',
  'testimonials.slides.3.quote': 'Excellent!',
  'testimonials.slides.3.name': 'Charlie',
};

function getSections() {
  return parseFlatJson(testJson).sections;
}

describe('updateField', () => {
  it('updates a simple field value and marks isDirty', () => {
    const sections = getSections();
    const updated = updateField(sections, 'hero.title', 'New Title');

    const hero = updated.find((s) => s.name === 'hero');
    const field = hero?.fields.find((f) => f.key === 'hero.title');
    expect(field?.value).toBe('New Title');
    expect(field?.isDirty).toBe(true);
  });

  it('does not mutate the original sections', () => {
    const sections = getSections();
    const original = sections.find((s) => s.name === 'hero');
    const originalValue = original?.fields.find((f) => f.key === 'hero.title')?.value;

    updateField(sections, 'hero.title', 'Changed');

    const unchanged = sections.find((s) => s.name === 'hero');
    expect(unchanged?.fields.find((f) => f.key === 'hero.title')?.value).toBe(originalValue);
  });

  it('updates a field inside a repeating group', () => {
    const sections = getSections();
    const updated = updateField(sections, 'testimonials.slides.1.quote', 'Updated quote');

    const testimonials = updated.find((s) => s.name === 'testimonials');
    const item = testimonials?.repeatingGroups[0]?.items[0];
    const field = item?.fields.find((f) => f.key === 'testimonials.slides.1.quote');
    expect(field?.value).toBe('Updated quote');
    expect(field?.isDirty).toBe(true);
  });

  it('returns sections unchanged for nonexistent key', () => {
    const sections = getSections();
    const updated = updateField(sections, 'nonexistent.key', 'value');
    expect(updated).toEqual(sections);
  });
});

describe('addItem', () => {
  it('adds a new item with the next sequential index', () => {
    const sections = getSections();
    const testimonials = sections.find((s) => s.name === 'testimonials');
    const groupPrefix = testimonials?.repeatingGroups[0]?.prefix ?? '';

    const updated = addItem(sections, groupPrefix);
    const updatedSection = updated.find((s) => s.name === 'testimonials');
    const group = updatedSection?.repeatingGroups[0];

    expect(group?.items).toHaveLength(4);
    expect(group?.items[3]?.index).toBe('4');
    expect(group?.items[3]?.fields.every((f) => f.value === '')).toBe(true);
    expect(group?.items[3]?.fields.every((f) => f.isDirty === true)).toBe(true);
  });

  it('returns sections unchanged for nonexistent group prefix', () => {
    const sections = getSections();
    const updated = addItem(sections, 'nonexistent.prefix');
    expect(updated).toEqual(sections);
  });
});

describe('removeItem', () => {
  it('removes an item and renumbers subsequent items', () => {
    const sections = getSections();
    const testimonials = sections.find((s) => s.name === 'testimonials');
    const groupPrefix = testimonials?.repeatingGroups[0]?.prefix ?? '';

    const updated = removeItem(sections, groupPrefix, '2');
    const updatedSection = updated.find((s) => s.name === 'testimonials');
    const group = updatedSection?.repeatingGroups[0];

    expect(group?.items).toHaveLength(2);
    // Item 1 stays as 1, item 3 becomes 2
    expect(group?.items[0]?.index).toBe('1');
    expect(group?.items[1]?.index).toBe('2');
    // The renamed item should have Charlie's data
    const renamedQuote = group?.items[1]?.fields.find((f) =>
      f.key.endsWith('.quote'),
    );
    expect(renamedQuote?.value).toBe('Excellent!');
  });

  it('returns sections unchanged for nonexistent index', () => {
    const sections = getSections();
    const testimonials = sections.find((s) => s.name === 'testimonials');
    const groupPrefix = testimonials?.repeatingGroups[0]?.prefix ?? '';

    const updated = removeItem(sections, groupPrefix, '99');
    expect(updated).toEqual(sections);
  });
});

describe('reorderItem', () => {
  it('moves an item and renumbers correctly', () => {
    const sections = getSections();
    const testimonials = sections.find((s) => s.name === 'testimonials');
    const groupPrefix = testimonials?.repeatingGroups[0]?.prefix ?? '';

    // Move first item to last position
    const updated = reorderItem(sections, groupPrefix, 0, 2);
    const updatedSection = updated.find((s) => s.name === 'testimonials');
    const group = updatedSection?.repeatingGroups[0];

    expect(group?.items).toHaveLength(3);
    // Original item 1 (Alice) moved to position 3
    // Original item 2 (Bob) is now position 1
    const firstQuote = group?.items[0]?.fields.find((f) => f.key.endsWith('.quote'));
    expect(firstQuote?.value).toBe('Amazing!');
  });

  it('returns sections unchanged for out-of-bounds positions', () => {
    const sections = getSections();
    const testimonials = sections.find((s) => s.name === 'testimonials');
    const groupPrefix = testimonials?.repeatingGroups[0]?.prefix ?? '';

    const updated = reorderItem(sections, groupPrefix, 0, 99);
    expect(updated).toEqual(sections);
  });

  it('returns sections unchanged for same position', () => {
    const sections = getSections();
    const testimonials = sections.find((s) => s.name === 'testimonials');
    const groupPrefix = testimonials?.repeatingGroups[0]?.prefix ?? '';

    const updated = reorderItem(sections, groupPrefix, 1, 1);
    // Same position — items should be identical
    const updatedSection = updated.find((s) => s.name === 'testimonials');
    const originalSection = sections.find((s) => s.name === 'testimonials');
    expect(updatedSection?.repeatingGroups[0]?.items.length).toBe(
      originalSection?.repeatingGroups[0]?.items.length,
    );
  });
});
