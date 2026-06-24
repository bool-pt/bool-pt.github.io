import { describe, it, expect } from 'vitest';
import { parseFlatJson } from './parser';
import { serialize, serializeToString } from './serializer';

describe('serialize', () => {
  it('flattens sections to a dot-notation object', () => {
    const json: Record<string, string> = {
      'hero.title': 'Hello',
      'hero.subtitle': 'World',
      'nav.about': 'About',
    };

    const tree = parseFlatJson(json);
    const result = serialize(tree.sections);

    expect(result['hero.title']).toBe('Hello');
    expect(result['hero.subtitle']).toBe('World');
    expect(result['nav.about']).toBe('About');
  });

  it('includes meta keys when provided', () => {
    const json: Record<string, string> = {
      '_meta.pages.home': 'hero',
      'hero.title': 'Hello',
    };

    const tree = parseFlatJson(json);
    const result = serialize(tree.sections, tree.metaKeys);

    expect(result['_meta.pages.home']).toBe('hero');
    expect(result['hero.title']).toBe('Hello');
  });

  it('serializes repeating group fields', () => {
    const json: Record<string, string> = {
      'items.1.name': 'First',
      'items.1.desc': 'Description 1',
      'items.2.name': 'Second',
      'items.2.desc': 'Description 2',
    };

    const tree = parseFlatJson(json);
    const result = serialize(tree.sections, tree.metaKeys);

    expect(result['items.1.name']).toBe('First');
    expect(result['items.2.desc']).toBe('Description 2');
  });
});

describe('serializeToString', () => {
  it('produces formatted JSON with trailing newline', () => {
    const json: Record<string, string> = {
      'hero.title': 'Hello',
    };

    const tree = parseFlatJson(json);
    const result = serializeToString(tree.sections);

    expect(result).toContain('"hero.title": "Hello"');
    expect(result.endsWith('\n')).toBe(true);
    // Should be parseable
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe('round-trip fidelity', () => {
  it('parse then serialize produces identical output', () => {
    const original: Record<string, string> = {
      '_meta.pages.home': 'hero,nav',
      '_meta.labels.hero': 'Hero Section',
      '_meta.shared': 'nav',
      'hero.title': 'Welcome',
      'hero.subtitle': 'to Bool',
      'nav.about': 'About',
      'nav.services': 'Services',
    };

    const tree = parseFlatJson(original);
    const roundTripped = serialize(tree.sections, tree.metaKeys);

    expect(roundTripped).toEqual(original);
  });

  it('round-trips with repeating groups', () => {
    const original: Record<string, string> = {
      'testimonials.slides.1.quote': 'Great!',
      'testimonials.slides.1.name': 'Alice',
      'testimonials.slides.2.quote': 'Amazing!',
      'testimonials.slides.2.name': 'Bob',
    };

    const tree = parseFlatJson(original);
    const roundTripped = serialize(tree.sections, tree.metaKeys);

    expect(roundTripped).toEqual(original);
  });
});
