import { describe, it, expect, beforeEach } from 'vitest';
import { getTheme, setTheme } from './theme';

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('defaults to light when the dark class is absent', () => {
    expect(getTheme()).toBe('light');
  });

  it('reads dark when the dark class is present', () => {
    document.documentElement.classList.add('dark');
    expect(getTheme()).toBe('dark');
  });

  it('setTheme("dark") adds the dark class and persists the choice', () => {
    setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(getTheme()).toBe('dark');
  });

  it('setTheme("light") removes the dark class and persists the choice', () => {
    document.documentElement.classList.add('dark');
    setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(getTheme()).toBe('light');
  });
});
