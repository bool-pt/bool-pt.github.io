import { describe, it, expect } from 'vitest';
import { blogSchema } from './schemas/blog';
import { transformEvent, transformBlogPost } from './transformers';

describe('transformEvent', () => {
  it('maps event fields and formats the date', () => {
    const date = new Date('2026-03-15T00:00:00Z');
    const result = transformEvent({
      data: {
        date,
        title: 'Launch',
        description: 'Desc',
        tag: 'News',
        tagColor: 'red',
        location: 'Lisbon',
      },
    });
    expect(result).toMatchObject({
      title: 'Launch',
      description: 'Desc',
      tag: 'News',
      tagColor: 'red',
      location: 'Lisbon',
      rawDate: date.toISOString(),
    });
    expect(result.date).toContain('2026');
  });

  it('leaves optional fields undefined', () => {
    const result = transformEvent({
      data: { date: new Date('2026-01-01T00:00:00Z'), title: 'T', description: 'D' },
    });
    expect(result.tag).toBeUndefined();
    expect(result.tagColor).toBeUndefined();
    expect(result.location).toBeUndefined();
  });
});

describe('transformBlogPost', () => {
  it('maps id to slug and formats a short date', () => {
    const data = blogSchema.parse({
      title: 'Title',
      description: 'D',
      date: '2026-03-15',
      author: 'Jane',
      image: 'cover.png',
    });
    const result = transformBlogPost({ id: 'my-post', data });
    expect(result.slug).toBe('my-post');
    expect(result.title).toBe('Title');
    expect(result.author).toBe('Jane');
    expect(result.date).toContain('2026');
  });
});
