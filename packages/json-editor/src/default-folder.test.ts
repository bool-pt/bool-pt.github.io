import { describe, it, expect } from 'vitest';
import {
  defaultFolderForField,
  FALLBACK_DEFAULT_FOLDER,
  SECTION_FOLDER_NAMES,
} from './default-folder';

describe('defaultFolderForField — section-specific rules (precedence)', () => {
  it.each([
    ['caseStudies.items.1.coverImage', 'case-study'],
    ['caseStudies.items.42.coverImage', 'case-study'],
    ['teamGrid.items.3.image', 'team'],
    ['testimonials.items.1.avatar', 'testimonials'],
    ['home.testimonials.items.2.avatar', 'testimonials'],
    ['people.testimonials.items.5.avatar', 'testimonials'],
    ['blog.newsUpdates.item.4.image', 'news'],
    ['blog.latestPosts.item.1.image', 'blog-posts'],
    ['blog.knowledgeCenter.article.7.image', 'knowledge-center'],
    ['blog.eventsCalendar.eventCards.2.image', 'events'],
    ['home.events.items.1.image', 'events'],
    ['portfolio.clientLogos.items.1.logo', 'client-logos'],
    ['header.logo', 'logos/brand'],
  ])('"%s" → "%s"', (key, expected) => {
    expect(defaultFolderForField(key)).toBe(expected);
  });
});

describe('defaultFolderForField — field-suffix fallback rules', () => {
  it.each([
    ['hero.backgroundImage', 'backgrounds'],
    ['something.heroImage', 'backgrounds'],
    ['featuredTech.items.1.logo', 'logos/platforms'],
    ['some.avatar', 'portraits'],
    ['something.portrait', 'portraits'],
    ['ExpertPortrait.photo', 'portraits'],
    ['unknown.thumbnail', 'covers'],
    ['unknown.coverImage', 'covers'],
    ['unknown.image', 'covers'],
  ])('"%s" → "%s"', (key, expected) => {
    expect(defaultFolderForField(key)).toBe(expected);
  });
});

describe('defaultFolderForField — fallback', () => {
  it('returns the fallback for a key with no recognized field suffix', () => {
    expect(defaultFolderForField('some.random.field')).toBe(FALLBACK_DEFAULT_FOLDER);
    expect(FALLBACK_DEFAULT_FOLDER).toBe('covers');
  });
});

describe('SECTION_FOLDER_NAMES', () => {
  it('contains the canonical content-heavy section folders', () => {
    expect([...SECTION_FOLDER_NAMES].sort()).toEqual([
      'blog-posts',
      'case-study',
      'client-logos',
      'events',
      'knowledge-center',
      'news',
      'team',
      'testimonials',
    ]);
  });

  it('every folder targeted by a section rule is in SECTION_FOLDER_NAMES', () => {
    // If a new section rule is added with a folder not in this set, the
    // MediaPicker would put it under "Shared folders" by mistake. This
    // assertion forces consistency.
    const sectionFolders = new Set<string>();
    sectionFolders.add(defaultFolderForField('caseStudies.items.1.coverImage'));
    sectionFolders.add(defaultFolderForField('teamGrid.items.1.image'));
    sectionFolders.add(defaultFolderForField('testimonials.items.1.avatar'));
    sectionFolders.add(defaultFolderForField('blog.newsUpdates.item.1.image'));
    sectionFolders.add(defaultFolderForField('blog.latestPosts.item.1.image'));
    sectionFolders.add(defaultFolderForField('blog.knowledgeCenter.article.1.image'));
    sectionFolders.add(defaultFolderForField('home.events.items.1.image'));
    sectionFolders.add(defaultFolderForField('portfolio.clientLogos.items.1.logo'));
    for (const folder of sectionFolders) {
      expect(SECTION_FOLDER_NAMES.has(folder), `${folder} not in SECTION_FOLDER_NAMES`).toBe(true);
    }
  });
});
