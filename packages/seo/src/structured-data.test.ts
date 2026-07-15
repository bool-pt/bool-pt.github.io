import { describe, it, expect } from 'vitest';
import {
  organizationJsonLd,
  websiteJsonLd,
  blogPostingJsonLd,
  breadcrumbListJsonLd,
  eventJsonLd,
  serializeJsonLd,
} from './structured-data';

describe('organizationJsonLd', () => {
  it('returns valid Organization schema', () => {
    const result = organizationJsonLd();
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Organization');
    expect(result.name).toBe('Bool');
    expect(result.url).toContain('bool.pt');
    expect(result.sameAs).toBeInstanceOf(Array);
    expect(result.sameAs.length).toBeGreaterThan(0);
    expect(result.contactPoint).toBeDefined();
    expect(result.contactPoint['@type']).toBe('ContactPoint');
    expect(result.contactPoint.email).toBeDefined();
  });
});

describe('websiteJsonLd', () => {
  it('returns valid WebSite schema', () => {
    const result = websiteJsonLd();
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('WebSite');
    expect(result.name).toBeDefined();
    expect(result.url).toContain('bool.pt');
  });
});

describe('blogPostingJsonLd', () => {
  it('returns valid BlogPosting schema', () => {
    const result = blogPostingJsonLd({
      title: 'Test Post',
      description: 'A test blog post',
      datePublished: '2026-01-15',
      author: 'John Doe',
      image: 'https://bool.pt/images/test.png',
      url: 'https://bool.pt/blog/test-post',
    });

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('BlogPosting');
    expect(result.headline).toBe('Test Post');
    expect(result.description).toBe('A test blog post');
    expect(result.datePublished).toBe('2026-01-15');
    expect(result.author['@type']).toBe('Person');
    expect(result.author.name).toBe('John Doe');
    expect(result.image).toBe('https://bool.pt/images/test.png');
    expect(result.url).toBe('https://bool.pt/blog/test-post');
    expect(result.publisher['@type']).toBe('Organization');
    expect(result.publisher.name).toBe('Bool');
  });
});

describe('breadcrumbListJsonLd', () => {
  it('returns valid BreadcrumbList with correct positions', () => {
    const items = [
      { name: 'Home', url: 'https://bool.pt/' },
      { name: 'Blog', url: 'https://bool.pt/blog' },
      { name: 'Post', url: 'https://bool.pt/blog/my-post' },
    ];

    const result = breadcrumbListJsonLd(items);
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[0]?.position).toBe(1);
    expect(result.itemListElement[0]?.name).toBe('Home');
    expect(result.itemListElement[1]?.position).toBe(2);
    expect(result.itemListElement[2]?.position).toBe(3);
  });

  it('handles empty breadcrumbs', () => {
    const result = breadcrumbListJsonLd([]);
    expect(result.itemListElement).toHaveLength(0);
  });
});

describe('eventJsonLd', () => {
  it('returns valid Event schema with all fields', () => {
    const result = eventJsonLd({
      name: 'Tech Conference',
      description: 'Annual tech event',
      startDate: '2026-06-15',
      endDate: '2026-06-17',
      location: 'Lisbon Convention Center',
      url: 'https://bool.pt/events/tech-conf',
    });

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Event');
    expect(result.name).toBe('Tech Conference');
    expect(result.startDate).toBe('2026-06-15');
    expect(result.endDate).toBe('2026-06-17');
    expect(result.location).toEqual({
      '@type': 'Place',
      name: 'Lisbon Convention Center',
    });
    expect(result.organizer['@type']).toBe('Organization');
  });

  it('omits optional fields when not provided', () => {
    const result = eventJsonLd({
      name: 'Webinar',
      description: 'Online event',
      startDate: '2026-03-01',
      url: 'https://bool.pt/events/webinar',
    });

    expect(result.endDate).toBeUndefined();
    expect(result.location).toBeUndefined();
  });
});

describe('serializeJsonLd', () => {
  it('escapes </script> breakout attempts in string values', () => {
    const output = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(output).not.toContain('</script>');
    expect(output).not.toContain('<script>');
    expect(output).toContain('\\u003c');
  });

  it('escapes <, > and & to their \\uXXXX forms', () => {
    expect(serializeJsonLd({ v: '<' })).toContain('\\u003c');
    expect(serializeJsonLd({ v: '>' })).toContain('\\u003e');
    expect(serializeJsonLd({ v: '&' })).toContain('\\u0026');
  });

  it('produces valid JSON that round-trips back to the original object', () => {
    const data = { headline: 'A & B < C > D', nested: { url: 'https://bool.pt/</script>' } };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});
