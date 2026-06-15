import { describe, it, expect, vi, beforeEach } from 'vitest';

const getCollection = vi.fn();
vi.mock('astro:content', () => ({
  getCollection: (...args: unknown[]) => getCollection(...args),
}));

const { getBlogPosts, getEvents, getUpcomingEvents } = await import('./queries');

interface Entry {
  data: { date: Date; draft?: boolean; locale?: string };
}

beforeEach(() => getCollection.mockReset());

describe('getBlogPosts', () => {
  it('excludes drafts and other locales, sorted newest first', async () => {
    const items: Entry[] = [
      { data: { date: new Date('2026-01-01'), draft: false, locale: 'en' } },
      { data: { date: new Date('2026-03-01'), draft: false, locale: 'en' } },
      { data: { date: new Date('2026-02-01'), draft: true, locale: 'en' } },
      { data: { date: new Date('2026-02-15'), draft: false, locale: 'pt' } },
    ];
    getCollection.mockImplementation((_name: string, filter?: (e: Entry) => boolean) =>
      filter ? items.filter(filter) : items
    );

    const result = (await getBlogPosts('en')) as Entry[];
    expect(result.map((r) => r.data.date.toISOString())).toEqual([
      new Date('2026-03-01').toISOString(),
      new Date('2026-01-01').toISOString(),
    ]);
  });
});

describe('getEvents', () => {
  it('returns events sorted oldest first', async () => {
    const items: Entry[] = [
      { data: { date: new Date('2026-03-01') } },
      { data: { date: new Date('2026-01-01') } },
    ];
    getCollection.mockResolvedValue(items);
    const result = (await getEvents()) as Entry[];
    expect(result[0]?.data.date.toISOString()).toBe(new Date('2026-01-01').toISOString());
  });
});

describe('getUpcomingEvents', () => {
  it('keeps only events on or after now', async () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);
    getCollection.mockResolvedValue([{ data: { date: past } }, { data: { date: future } }]);
    const result = (await getUpcomingEvents()) as Entry[];
    expect(result).toHaveLength(1);
    expect(result[0]?.data.date.toISOString()).toBe(future.toISOString());
  });
});
