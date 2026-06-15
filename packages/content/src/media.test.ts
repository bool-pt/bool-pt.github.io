import { describe, it, expect } from 'vitest';
import { resolveImage, resolveSvgUrl, resolveMedia } from './media.ts';

describe('resolveImage', () => {
  it('resolves a known raster path to a non-empty value', () => {
    // In production (Astro build) this returns ImageMetadata; in vitest
    // (plain Vite) it returns the file URL string. Either is fine — what
    // matters for drift detection is that the path resolves at all.
    const img = resolveImage('backgrounds/hero-background.jpg');
    expect(img).toBeDefined();
    expect(img).not.toBeNull();
  });

  it('throws a descriptive error when the path is not found', () => {
    expect(() => resolveImage('does-not-exist/missing.jpg')).toThrowError(
      /\[@bool\/content\] Image not found: "does-not-exist\/missing\.jpg"/
    );
  });

  it('throws when the path is empty', () => {
    expect(() => resolveImage('')).toThrowError(/Image not found/);
  });
});

describe('resolveSvgUrl', () => {
  it('resolves a known SVG to a non-empty URL string', () => {
    // Vite may inline small SVGs as data: URLs, so we just assert the
    // resolver returns something string-shaped and non-empty.
    const url = resolveSvgUrl('logos/brand/bool-logo-text.svg');
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });

  it('throws when the SVG path is not found', () => {
    expect(() => resolveSvgUrl('decorative/missing.svg')).toThrowError(
      /\[@bool\/content\] SVG not found/
    );
  });
});

describe('resolveMedia (kind discriminator)', () => {
  it('returns kind=image for a raster path', () => {
    const result = resolveMedia('backgrounds/hero-background.jpg');
    expect(result.kind).toBe('image');
  });

  it('returns kind=svg for a .svg path', () => {
    const result = resolveMedia('logos/brand/bool-logo-text.svg');
    expect(result.kind).toBe('svg');
  });
});
