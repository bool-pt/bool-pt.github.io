import type { ImageMetadata } from 'astro';

/**
 * Resolves a media path referenced from en.json into an Astro ImageMetadata.
 *
 * Paths in JSON are stored relative to `packages/media/images/`, e.g.
 * `case-study/banco.jpg`, `portraits/jane.jpg`, `logos/platforms/mendix.svg`.
 *
 * The loader throws on unknown paths — there are no silent fallbacks.
 */

const imageMap = import.meta.glob<{ default: ImageMetadata }>(
  '../../media/images/**/*.{jpg,jpeg,png,webp,avif,svg}',
  { eager: true }
);

const svgMap = import.meta.glob<string>('../../media/images/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

function findEntry<T>(map: Record<string, T>, relativePath: string): T | undefined {
  const suffix = `/media/images/${relativePath}`;
  for (const [key, value] of Object.entries(map)) {
    if (key.endsWith(suffix)) return value;
  }
  return undefined;
}

export function resolveImage(relativePath: string): ImageMetadata {
  const entry = findEntry(imageMap, relativePath);
  if (!entry) {
    throw new Error(
      `[@bool/content] Image not found: "${relativePath}". Expected a file at packages/media/images/${relativePath}`
    );
  }
  return entry.default;
}

export function resolveSvgUrl(relativePath: string): string {
  const entry = findEntry(svgMap, relativePath);
  if (!entry) {
    throw new Error(
      `[@bool/content] SVG not found: "${relativePath}". Expected a file at packages/media/images/${relativePath}`
    );
  }
  return entry;
}

/**
 * Resolves any media path — image or SVG — returning whichever type matches.
 * Useful when a JSON field may contain either (e.g. logos can be SVG or PNG).
 */
export function resolveMedia(
  relativePath: string
): { kind: 'image'; value: ImageMetadata } | { kind: 'svg'; value: string } {
  if (relativePath.toLowerCase().endsWith('.svg')) {
    return { kind: 'svg', value: resolveSvgUrl(relativePath) };
  }
  return { kind: 'image', value: resolveImage(relativePath) };
}
