import { describe, it, expect } from 'vitest';
import { byOrder, byDateDesc, byDateAsc } from './sorting.ts';

describe('byOrder', () => {
  it('sorts items by ascending order', () => {
    const items = [{ data: { order: 3 } }, { data: { order: 1 } }, { data: { order: 2 } }];
    expect(items.sort(byOrder).map((i) => i.data.order)).toEqual([1, 2, 3]);
  });

  it('handles equal orders', () => {
    const items = [{ data: { order: 1 } }, { data: { order: 1 } }];
    expect(items.sort(byOrder).map((i) => i.data.order)).toEqual([1, 1]);
  });
});

describe('byDateDesc', () => {
  it('sorts items newest first', () => {
    const items = [
      { data: { date: new Date('2024-01-01') } },
      { data: { date: new Date('2024-06-01') } },
      { data: { date: new Date('2024-03-01') } },
    ];
    const sorted = items.sort(byDateDesc).map((i) => i.data.date.toISOString());
    expect(sorted).toEqual([
      new Date('2024-06-01').toISOString(),
      new Date('2024-03-01').toISOString(),
      new Date('2024-01-01').toISOString(),
    ]);
  });
});

describe('byDateAsc', () => {
  it('sorts items oldest first', () => {
    const items = [
      { data: { date: new Date('2024-06-01') } },
      { data: { date: new Date('2024-01-01') } },
      { data: { date: new Date('2024-03-01') } },
    ];
    const sorted = items.sort(byDateAsc).map((i) => i.data.date.toISOString());
    expect(sorted).toEqual([
      new Date('2024-01-01').toISOString(),
      new Date('2024-03-01').toISOString(),
      new Date('2024-06-01').toISOString(),
    ]);
  });
});
