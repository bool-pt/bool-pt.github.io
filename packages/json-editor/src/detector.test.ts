import { describe, it, expect } from 'vitest';
import { detectRepeatingGroups } from './detector';

describe('detectRepeatingGroups', () => {
  describe('numeric groups', () => {
    it('detects groups with nested prefix before numeric index', () => {
      // The detector requires a named segment between sectionPrefix and numeric index
      // e.g., "people.slides.1.title" where "slides" is the prefix segment
      const keys = [
        'people.slides.1.quote',
        'people.slides.1.name',
        'people.slides.2.quote',
        'people.slides.2.name',
      ];

      const result = detectRepeatingGroups(keys, 'people');
      expect(result).toHaveLength(1);
      expect(result[0]?.prefix).toBe('people.slides');
      expect(result[0]?.fieldSuffixes).toEqual(['name', 'quote']);
    });

    it('ignores single-index keys (not a repeating group)', () => {
      const keys = ['items.slides.1.title', 'items.slides.1.description'];
      const result = detectRepeatingGroups(keys, 'items');
      expect(result).toHaveLength(0);
    });

    it('handles deeply nested prefix before numeric segment', () => {
      const keys = [
        'section.deep.nested.1.title',
        'section.deep.nested.1.desc',
        'section.deep.nested.2.title',
        'section.deep.nested.2.desc',
      ];

      const result = detectRepeatingGroups(keys, 'section');
      expect(result).toHaveLength(1);
      expect(result[0]?.prefix).toBe('section.deep.nested');
      expect(result[0]?.fieldSuffixes).toEqual(['desc', 'title']);
    });
  });

  describe('named groups', () => {
    it('detects 3+ siblings with identical field structure', () => {
      // Named groups need 3+ items with identical field suffixes
      const keys = [
        'section.tech.outsystems.title',
        'section.tech.outsystems.desc',
        'section.tech.mendix.title',
        'section.tech.mendix.desc',
        'section.tech.power.title',
        'section.tech.power.desc',
      ];

      const result = detectRepeatingGroups(keys, 'section');
      const namedGroup = result.find((g) => g.prefix === 'section.tech');
      expect(namedGroup).toBeDefined();
      expect(namedGroup?.fieldSuffixes).toEqual(['desc', 'title']);
    });

    it('ignores only 2 named siblings (needs 3+)', () => {
      const keys = [
        'section.tech.outsystems.title',
        'section.tech.outsystems.desc',
        'section.tech.mendix.title',
        'section.tech.mendix.desc',
      ];

      const result = detectRepeatingGroups(keys, 'section');
      const namedGroup = result.find((g) => g.prefix === 'section.tech');
      expect(namedGroup).toBeUndefined();
    });
  });

  it('detects both numeric and named groups in the same section', () => {
    const keys = [
      'section.slides.1.title',
      'section.slides.2.title',
      'section.platforms.alpha.name',
      'section.platforms.beta.name',
      'section.platforms.gamma.name',
    ];

    const result = detectRepeatingGroups(keys, 'section');
    expect(result.length).toBeGreaterThanOrEqual(1);

    const numericGroup = result.find((g) => g.prefix === 'section.slides');
    expect(numericGroup).toBeDefined();
  });

  it('returns empty array for flat keys with no groups', () => {
    const keys = ['nav.about', 'nav.services', 'nav.contacts'];
    const result = detectRepeatingGroups(keys, 'nav');
    expect(result).toHaveLength(0);
  });

  describe('nested numeric groups (prefix.N.inner.M)', () => {
    it('detects bare-value inner lists like tags.M', () => {
      const keys = [
        'caseStudies.items.1.client',
        'caseStudies.items.1.tags.1',
        'caseStudies.items.1.tags.2',
        'caseStudies.items.1.tags.3',
        'caseStudies.items.2.client',
        'caseStudies.items.2.tags.1',
      ];

      const [parent] = detectRepeatingGroups(keys, 'caseStudies');
      expect(parent).toBeDefined();
      expect(parent?.prefix).toBe('caseStudies.items');
      // tags.1, tags.2, tags.3 should be promoted to nested template, not flat fields
      expect(parent?.fieldSuffixes).toEqual(['client']);
      expect(parent?.nestedTemplates).toEqual([
        { innerPrefix: 'tags', fieldSuffixes: [''] },
      ]);
    });

    it('detects nested object-shaped inner items (inner.M.suffix)', () => {
      const keys = [
        'section.items.1.title',
        'section.items.1.metrics.1.value',
        'section.items.1.metrics.1.label',
        'section.items.1.metrics.2.value',
        'section.items.1.metrics.2.label',
        'section.items.2.title',
      ];

      const [parent] = detectRepeatingGroups(keys, 'section');
      expect(parent?.fieldSuffixes).toEqual(['title']);
      expect(parent?.nestedTemplates).toEqual([
        { innerPrefix: 'metrics', fieldSuffixes: ['label', 'value'] },
      ]);
    });

    it('returns no nestedTemplates when there are no inner numeric groups', () => {
      const keys = [
        'section.items.1.title',
        'section.items.1.body',
        'section.items.2.title',
      ];

      const [parent] = detectRepeatingGroups(keys, 'section');
      expect(parent?.nestedTemplates).toBeUndefined();
    });
  });
});
