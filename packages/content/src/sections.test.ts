import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { translations } from '@bool/i18n';
import { collectArray, collectNestedList } from './sections.ts';

const SCRATCH_LOCALE = '__scratch__';

describe('collectArray', () => {
  beforeEach(() => {
    translations[SCRATCH_LOCALE] = {
      'demo.items.1.title': 'First',
      'demo.items.1.body': 'Body 1',
      'demo.items.1.tags.1': 'react',
      'demo.items.1.tags.2': 'astro',
      'demo.items.2.title': 'Second',
      'demo.items.2.body': 'Body 2',
      'demo.items.3.title': 'Third',
      'demo.unrelated': 'noise',
    };
  });
  afterEach(() => {
    delete translations[SCRATCH_LOCALE];
  });

  it('returns one record per numeric index, sorted ascending', () => {
    const items = collectArray('demo.items', SCRATCH_LOCALE);
    expect(items).toHaveLength(3);
    expect(items[0]?.title).toBe('First');
    expect(items[1]?.title).toBe('Second');
    expect(items[2]?.title).toBe('Third');
  });

  it('preserves nested-key suffixes inside each record', () => {
    const items = collectArray('demo.items', SCRATCH_LOCALE);
    expect(items[0]?.['tags.1']).toBe('react');
    expect(items[0]?.['tags.2']).toBe('astro');
  });

  it('ignores keys that share a prefix segment but not the index', () => {
    const items = collectArray('demo.items', SCRATCH_LOCALE);
    expect(items.find((i) => 'unrelated' in i)).toBeUndefined();
  });

  it('returns an empty array when the prefix has no items', () => {
    expect(collectArray('nonexistent.prefix', SCRATCH_LOCALE)).toEqual([]);
  });

  it('falls back to en when the requested locale is missing', () => {
    const items = collectArray('demo.items', '__not-a-real-locale__');
    expect(Array.isArray(items)).toBe(true);
  });
});

describe('collectNestedList', () => {
  it('compacts numbered nested keys into a string array, ignoring empty values', () => {
    const item: Record<string, string> = {
      'tags.1': 'one',
      'tags.2': '',
      'tags.3': 'three',
      other: 'x',
    };
    expect(collectNestedList(item, 'tags')).toEqual(['one', 'three']);
  });

  it('returns [] when no inner keys match', () => {
    expect(collectNestedList({}, 'tags')).toEqual([]);
  });

  it('trims whitespace and drops whitespace-only entries', () => {
    expect(
      collectNestedList({ 'list.1': '  alpha  ', 'list.2': '   ', 'list.3': 'beta' }, 'list')
    ).toEqual(['alpha', 'beta']);
  });
});
