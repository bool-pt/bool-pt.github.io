import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { parseFlatJson } from '@bool/json-editor-core';
import { useSearch } from './useSearch';

const { sections } = parseFlatJson({
  'home.heading': 'Hello World',
  'home.subtitle': 'Welcome aboard',
});

describe('useSearch', () => {
  it('returns nothing for a blank query', () => {
    const { result } = renderHook(() => useSearch(sections, '   '));
    expect(result.current).toEqual([]);
  });

  it('matches field values case-insensitively', () => {
    const { result } = renderHook(() => useSearch(sections, 'HELLO'));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((r) => r.matchType === 'value' || r.matchType === 'both')).toBe(
      true
    );
  });

  it('matches field keys', () => {
    const { result } = renderHook(() => useSearch(sections, 'subtitle'));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((r) => r.matchType === 'key' || r.matchType === 'both')).toBe(true);
  });

  it('returns nothing when nothing matches', () => {
    const { result } = renderHook(() => useSearch(sections, 'zzznomatch'));
    expect(result.current).toEqual([]);
  });
});
