import { describe, it, expect } from 'vitest';
import { blogSchema } from './blog';
import { eventSchema } from './events';
import { portfolioSchema } from './portfolio';
import { serviceSchema } from './services';
import { teamSchema } from './team';
import { testimonialSchema } from './testimonials';

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

describe('teamSchema', () => {
  const valid = {
    name: 'Alice',
    role: 'Engineer',
    image: '/img/alice.jpg',
    order: 1,
  };

  it('accepts valid data', () => {
    expect(teamSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional linkedin URL', () => {
    expect(teamSchema.safeParse({ ...valid, linkedin: 'https://linkedin.com/in/alice' }).success).toBe(true);
  });

  it('rejects empty linkedin', () => {
    expect(teamSchema.safeParse({ ...valid, linkedin: '' }).success).toBe(false);
  });

  it('rejects empty name', () => {
    expect(teamSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects negative order', () => {
    expect(teamSchema.safeParse({ ...valid, order: -1 }).success).toBe(false);
  });

  it('rejects fractional order', () => {
    expect(teamSchema.safeParse({ ...valid, order: 1.5 }).success).toBe(false);
  });
});

describe('testimonialSchema', () => {
  const valid = {
    author: 'Bob',
    role: 'CTO',
    company: 'Acme',
    quote: 'Excellent work.',
    order: 0,
  };

  it('accepts valid data', () => {
    expect(testimonialSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional avatar', () => {
    expect(testimonialSchema.safeParse({ ...valid, avatar: '/img/bob.jpg' }).success).toBe(true);
  });

  it('rejects empty quote', () => {
    expect(testimonialSchema.safeParse({ ...valid, quote: '' }).success).toBe(false);
  });

  it('rejects empty company', () => {
    expect(testimonialSchema.safeParse({ ...valid, company: '' }).success).toBe(false);
  });
});

describe('serviceSchema', () => {
  const valid = {
    title: 'Web Development',
    description: 'We build websites.',
    order: 0,
  };

  it('accepts valid data', () => {
    expect(serviceSchema.safeParse(valid).success).toBe(true);
  });

  it('applies default category', () => {
    const result = serviceSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.category).toBe('service');
    }
  });

  it('accepts engagement-model category', () => {
    expect(serviceSchema.safeParse({ ...valid, category: 'engagement-model' }).success).toBe(true);
  });

  it('rejects invalid category', () => {
    expect(serviceSchema.safeParse({ ...valid, category: 'unknown' }).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(serviceSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('accepts valid href URL', () => {
    expect(serviceSchema.safeParse({ ...valid, href: 'https://example.com/services' }).success).toBe(true);
  });

  it('rejects empty href', () => {
    expect(serviceSchema.safeParse({ ...valid, href: '' }).success).toBe(false);
  });
});

describe('portfolioSchema', () => {
  const valid = {
    title: 'Project X',
    description: 'A case study.',
    client: 'ClientCo',
    image: '/img/project.jpg',
    tags: ['react'],
    date: '2024-06-01',
  };

  it('accepts valid data', () => {
    expect(portfolioSchema.safeParse(valid).success).toBe(true);
  });

  it('applies default for featured', () => {
    const result = portfolioSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.featured).toBe(false);
    }
  });

  it('accepts optional metrics', () => {
    const withMetrics = {
      ...valid,
      metrics: [{ value: '50%', label: 'faster' }],
    };
    expect(portfolioSchema.safeParse(withMetrics).success).toBe(true);
  });

  it('rejects empty client', () => {
    expect(portfolioSchema.safeParse({ ...valid, client: '' }).success).toBe(false);
  });

  it('rejects empty tags entries', () => {
    expect(portfolioSchema.safeParse({ ...valid, tags: [''] }).success).toBe(false);
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
