import { describe, expect, it } from 'vitest';
import { gradientIconPaths } from './icon-data';

/**
 * Drift guard: keeps `@bool/ui`'s `gradientIconPaths` in sync with the
 * canonical icon set hardcoded in `@bool/content/src/validation.ts`
 * (`KNOWN_GRADIENT_ICONS`). When you add or rename a gradient icon in
 * `icon-data.ts`, this test will fail and remind you to update both the
 * validator and any en.json keys that reference an old name.
 */
const CANONICAL_GRADIENT_ICONS = [
  'shield',
  'chart',
  'save-vest',
  'grid-plus',
  'rocket',
  'calendar',
  'trophy',
  'document',
  'building-education',
  'star-badge',
];

describe('gradientIconPaths', () => {
  it('exposes exactly the canonical set of gradient icons', () => {
    const actual = Object.keys(gradientIconPaths).sort();
    const expected = [...CANONICAL_GRADIENT_ICONS].sort();
    expect(actual).toEqual(expected);
  });

  it('every icon entry has a viewBox and at least one group', () => {
    for (const [name, def] of Object.entries(gradientIconPaths)) {
      expect(def.viewBox, `viewBox missing for ${name}`).toMatch(/^\d+\s+\d+\s+\d+\s+\d+$/);
      expect(def.groups.length, `groups empty for ${name}`).toBeGreaterThan(0);
    }
  });
});
