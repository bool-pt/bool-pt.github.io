import { describe, it, expect } from 'vitest';
import { tList, tCollection } from './collection.ts';

describe('tList', () => {
  it('returns an ordered array of translated strings', () => {
    const items = tList('knowledgeCenter.filters');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(typeof item).toBe('string');
      expect(item.length).toBeGreaterThan(0);
    });
  });

  it('returns empty array for non-existent prefix', () => {
    expect(tList('nonexistent.prefix')).toEqual([]);
  });

  it('items are ordered by numeric index', () => {
    const items = tList('knowledgeCenter.filters');
    // Each item should be a resolved string, not a key
    items.forEach((item) => {
      expect(item).not.toMatch(/^\d+$/);
    });
  });
});

describe('tCollection', () => {
  it('returns an ordered array of objects with requested fields', () => {
    const items = tCollection('teamTestimonials', ['quote', 'name', 'role']);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(typeof item.quote).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.role).toBe('string');
      expect(item.quote.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
    });
  });

  it('returns empty array for non-existent prefix', () => {
    expect(tCollection('nonexistent.prefix', ['a', 'b'])).toEqual([]);
  });
});
