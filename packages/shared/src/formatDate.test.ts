import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  const date = new Date('2026-03-15T00:00:00Z');

  it('formats date in long style by default', () => {
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('March');
    expect(result).toContain('2026');
  });

  it('formats date in short style', () => {
    const result = formatDate(date, 'short');
    expect(result).toContain('15');
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
  });

  it('accepts a custom locale parameter', () => {
    const result = formatDate(date, 'long', 'en-US');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});
