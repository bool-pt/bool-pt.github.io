import { describe, it, expect } from 'vitest';
import { parseFlatJson } from './parser';

describe('parseFlatJson', () => {
  it('parses basic flat JSON into sections', () => {
    const json: Record<string, string> = {
      'hero.title': 'Hello',
      'hero.subtitle': 'World',
      'nav.about': 'About',
    };

    const tree = parseFlatJson(json);
    expect(tree.sections).toHaveLength(2);
    expect(tree.totalKeys).toBe(3);

    const hero = tree.sections.find((s) => s.name === 'hero');
    expect(hero).toBeDefined();
    expect(hero?.fields).toHaveLength(2);
    expect(hero?.fields[0]?.value).toBe('Hello');
  });

  it('extracts _meta keys correctly', () => {
    const json: Record<string, string> = {
      '_meta.pages.home': 'hero,nav',
      '_meta.labels.hero': 'Hero Section',
      '_meta.pageLabels.home': 'Home Page',
      '_meta.shared': 'nav,footer',
      'hero.title': 'Hello',
      'nav.about': 'About',
      'footer.copyright': '2026',
    };

    const tree = parseFlatJson(json);

    expect(tree.pages).toHaveLength(1);
    expect(tree.pages[0]?.name).toBe('home');
    expect(tree.pages[0]?.label).toBe('Home Page');
    expect(tree.pages[0]?.sectionNames).toEqual(['hero', 'nav']);

    expect(tree.sharedSections).toEqual(['nav', 'footer']);

    const hero = tree.sections.find((s) => s.name === 'hero');
    expect(hero?.label).toBe('Hero Section');

    expect(tree.metaKeys).toEqual({
      '_meta.pages.home': 'hero,nav',
      '_meta.labels.hero': 'Hero Section',
      '_meta.pageLabels.home': 'Home Page',
      '_meta.shared': 'nav,footer',
    });
  });

  it('integrates repeating group detection', () => {
    const json: Record<string, string> = {
      'testimonials.heading': 'What they say',
      'testimonials.slides.1.quote': 'Great!',
      'testimonials.slides.1.name': 'Alice',
      'testimonials.slides.2.quote': 'Amazing!',
      'testimonials.slides.2.name': 'Bob',
    };

    const tree = parseFlatJson(json);
    const section = tree.sections.find((s) => s.name === 'testimonials');
    expect(section).toBeDefined();

    // 'title' should be a simple field, not in a repeating group
    expect(section?.fields.some((f) => f.key === 'testimonials.heading')).toBe(true);

    // Repeating group should be detected
    expect(section?.repeatingGroups).toHaveLength(1);
    expect(section?.repeatingGroups[0]?.prefix).toBe('testimonials.slides');
    expect(section?.repeatingGroups[0]?.items).toHaveLength(2);
    expect(section?.repeatingGroups[0]?.items[0]?.index).toBe('1');
  });

  it('uses camelToLabel fallback when no _meta.labels entry exists', () => {
    const json: Record<string, string> = {
      'serviceCards.title': 'Our Services',
    };

    const tree = parseFlatJson(json);
    const section = tree.sections.find((s) => s.name === 'serviceCards');
    expect(section?.label).toBe('Service Cards');
  });

  it('preserves key order', () => {
    const json: Record<string, string> = {
      'b.second': '2',
      'a.first': '1',
      'c.third': '3',
    };

    const tree = parseFlatJson(json);
    expect(tree.keyOrder).toEqual(['b.second', 'a.first', 'c.third']);
  });

  it('handles empty JSON', () => {
    const tree = parseFlatJson({});
    expect(tree.sections).toHaveLength(0);
    expect(tree.pages).toHaveLength(0);
    expect(tree.totalKeys).toBe(0);
    expect(tree.metaKeys).toEqual({});
  });
});
