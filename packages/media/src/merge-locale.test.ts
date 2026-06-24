import { describe, it, expect } from 'vitest';
// The sync script is import-unsafe (runs at load), so the merge logic lives in
// its own module. Tested here.
import { mergeLocale, indexedGroup, stripLegacyBase } from '../scripts/merge-locale.mjs';

const j = (o: Record<string, unknown>) => JSON.stringify(o);

describe('indexedGroup', () => {
  it('extracts the first numeric segment as the collection index', () => {
    expect(indexedGroup('serviceHighlights.items.5.title')).toEqual({
      prefix: 'serviceHighlights.items',
      index: '5',
    });
    expect(indexedGroup('caseStudies.items.10.tags.3')).toEqual({
      prefix: 'caseStudies.items',
      index: '10',
    });
  });

  it('returns null for flat keys with no numeric segment', () => {
    expect(indexedGroup('footer.address')).toBeNull();
    expect(indexedGroup('hero.heading')).toBeNull();
  });
});

describe('mergeLocale', () => {
  it('lets Drive win on shared keys and adds Drive-only keys', () => {
    const local = j({ a: 'old', keep: 'x' });
    const drive = j({ a: 'new', b: 'added' });
    const { merged, updatedKeys, addedKeys } = mergeLocale(local, drive);
    expect(merged.a).toBe('new');
    expect(merged.b).toBe('added');
    expect(updatedKeys).toContain('a');
    expect(addedKeys).toContain('b');
  });

  it('preserves a flat local-only key (code-added, leads Drive)', () => {
    const local = j({ 'newsletter.name.label': 'Name' });
    const drive = j({ 'newsletter.label': 'Email' });
    const { merged, localOnlyKeys, prunedKeys } = mergeLocale(local, drive);
    expect(merged['newsletter.name.label']).toBe('Name');
    expect(localOnlyKeys).toContain('newsletter.name.label');
    expect(prunedKeys).toHaveLength(0);
  });

  it('preserves a whole local-only collection Drive does not define', () => {
    const local = j({ 'experiment.items.1.title': 'A', 'experiment.items.2.title': 'B' });
    const drive = j({ 'hero.heading': 'Hi' });
    const { merged, prunedKeys } = mergeLocale(local, drive);
    expect(merged['experiment.items.1.title']).toBe('A');
    expect(merged['experiment.items.2.title']).toBe('B');
    expect(prunedKeys).toHaveLength(0);
  });

  it('prunes a stray over-index item in a Drive-managed collection (the items.5 bug)', () => {
    const local = j({
      'serviceHighlights.items.1.title': 'One',
      'serviceHighlights.items.4.title': 'Four',
      'serviceHighlights.items.5.title': 'Stray',
      'serviceHighlights.items.5.href': 'modal:gone',
    });
    const drive = j({
      'serviceHighlights.items.1.title': 'One',
      'serviceHighlights.items.4.title': 'Four',
    });
    const { merged, prunedKeys } = mergeLocale(local, drive);
    expect('serviceHighlights.items.5.title' in merged).toBe(false);
    expect('serviceHighlights.items.5.href' in merged).toBe(false);
    expect(prunedKeys).toEqual(
      expect.arrayContaining(['serviceHighlights.items.5.title', 'serviceHighlights.items.5.href'])
    );
    expect(merged['serviceHighlights.items.4.title']).toBe('Four');
  });

  it('keeps a new field added to an item Drive still provides', () => {
    const local = j({ 'cards.items.2.title': 'T', 'cards.items.2.badge': 'New' });
    const drive = j({ 'cards.items.2.title': 'T' });
    const { merged, localOnlyKeys, prunedKeys } = mergeLocale(local, drive);
    expect(merged['cards.items.2.badge']).toBe('New');
    expect(localOnlyKeys).toContain('cards.items.2.badge');
    expect(prunedKeys).toHaveLength(0);
  });

  it('flags a value cleared by Drive (set locally → blank from Drive)', () => {
    const local = j({ tagline: 'Hello' });
    const drive = j({ tagline: '' });
    const { clearedKeys } = mergeLocale(local, drive);
    expect(clearedKeys).toEqual([{ key: 'tagline', was: 'Hello' }]);
  });

  it('strips the legacy /bool base from Drive hrefs so a stale sync cannot reintroduce it', () => {
    const local = j({ 'nav.items.1.href': '/about' });
    const drive = j({ 'nav.items.1.href': '/bool/about', 'nav.items.2.href': '/bool/' });
    const { merged } = mergeLocale(local, drive);
    expect(merged['nav.items.1.href']).toBe('/about');
    expect(merged['nav.items.2.href']).toBe('/');
  });
});

describe('stripLegacyBase', () => {
  it('rewrites /bool/* paths to root-relative', () => {
    expect(stripLegacyBase('/bool/about')).toBe('/about');
    expect(stripLegacyBase('/bool/services#techStack')).toBe('/services#techStack');
    expect(stripLegacyBase('/bool/')).toBe('/');
    expect(stripLegacyBase('/bool')).toBe('/');
  });

  it('leaves already-root and non-string values untouched', () => {
    expect(stripLegacyBase('/about')).toBe('/about');
    expect(stripLegacyBase('https://github.com/bool-pt')).toBe('https://github.com/bool-pt');
    expect(stripLegacyBase(42)).toBe(42);
  });
});
