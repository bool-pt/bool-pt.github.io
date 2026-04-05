import { describe, it, expect } from 'vitest';
import { MEDIA_BASE, FONT_FACES } from './index';

describe('MEDIA_BASE', () => {
  it('equals /media', () => {
    expect(MEDIA_BASE).toBe('/media');
  });
});

describe('FONT_FACES', () => {
  it('contains @font-face declaration', () => {
    expect(FONT_FACES).toContain('@font-face');
  });

  it('references woff2 format', () => {
    expect(FONT_FACES).toContain('.woff2');
  });

  it('uses font-display: swap', () => {
    expect(FONT_FACES).toContain('font-display: swap');
  });

  it('matches snapshot', () => {
    expect(FONT_FACES).toMatchSnapshot();
  });
});
