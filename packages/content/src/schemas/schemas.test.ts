import { describe, it, expect } from 'vitest';
import { blogSchema } from './blog';
import { eventSchema } from './events';

describe('blogSchema', () => {
  const valid = {
    title: 'My Post',
    description: 'A great post',
    date: '2025-01-15',
    author: 'Jane',
    image: '/img/post.jpg',
    tags: ['astro', 'react'],
  };

  it('accepts valid data', () => {
    expect(blogSchema.safeParse(valid).success).toBe(true);
  });

  it('coerces date string to Date', () => {
    const result = blogSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it('applies defaults for locale and draft', () => {
    const result = blogSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.locale).toBe('en');
      expect(result.data.draft).toBe(false);
    }
  });

  it('applies default for tags when omitted', () => {
    const { tags: _tags, ...noTags } = valid;
    const result = blogSchema.safeParse(noTags);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects empty title', () => {
    expect(blogSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects empty author', () => {
    expect(blogSchema.safeParse({ ...valid, author: '' }).success).toBe(false);
  });

  it('accepts any locale string', () => {
    expect(blogSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(true);
    expect(blogSchema.safeParse({ ...valid, locale: 'pt' }).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(blogSchema.safeParse({}).success).toBe(false);
  });
});



describe('eventSchema', () => {
  const valid = {
    title: 'Tech Meetup',
    description: 'Monthly gathering.',
    date: '2025-03-01',
    type: 'meetup',
  };

  it('accepts valid data', () => {
    expect(eventSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid event types', () => {
    for (const type of ['meetup', 'conference', 'workshop', 'webinar']) {
      expect(eventSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it('rejects invalid event type', () => {
    expect(eventSchema.safeParse({ ...valid, type: 'party' }).success).toBe(false);
  });

  it('accepts optional URL', () => {
    expect(eventSchema.safeParse({ ...valid, url: 'https://meetup.com/event' }).success).toBe(true);
  });

  it('rejects empty URL', () => {
    expect(eventSchema.safeParse({ ...valid, url: '' }).success).toBe(false);
  });

  it('coerces date string to Date', () => {
    const result = eventSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it('rejects empty title', () => {
    expect(eventSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });
});
