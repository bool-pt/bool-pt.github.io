/**
 * Pure mapping from a JSON field key to the media folder the MediaPicker
 * should default to. Lives in `@bool/json-editor-core` so it can be unit-tested
 * without Vite's `import.meta.glob` machinery; the json-editor app's
 * `mediaManifest` re-exports + uses it.
 *
 * Two passes:
 *   1. **Section-specific** rules — content-heavy sections have a dedicated
 *      folder (case-study/, team/, news/, ...). These take precedence so the
 *      picker opens to the right folder for fields like `caseStudies.items.N.coverImage`.
 *   2. **Field-suffix** rules — generic categorization for fields that don't
 *      belong to a content-heavy section. Falls back to `covers/` for an
 *      unrecognized `image`.
 */

interface SectionRule {
  test: (key: string) => boolean;
  folder: string;
}

const SECTION_RULES: ReadonlyArray<SectionRule> = [
  { test: (k) => k.startsWith('caseStudies.items.') && k.endsWith('.coverImage'), folder: 'case-study' },
  { test: (k) => k.startsWith('teamGrid.items.') && k.endsWith('.image'), folder: 'team' },
  { test: (k) => /^[a-zA-Z]+\.testimonials(\.items)?\.[^.]+\.avatar$/.test(k) || /^testimonials\.items\.[^.]+\.avatar$/.test(k), folder: 'testimonials' },
  { test: (k) => k.startsWith('blog.newsUpdates.') && k.endsWith('.image'), folder: 'news' },
  { test: (k) => k.startsWith('blog.latestPosts.') && k.endsWith('.image'), folder: 'blog-posts' },
  { test: (k) => k.startsWith('blog.knowledgeCenter.') && k.endsWith('.image'), folder: 'knowledge-center' },
  { test: (k) => /\.events?\.items?\.[^.]+\.image$/.test(k) || /\.eventCards\.[^.]+\.image$/.test(k), folder: 'events' },
  { test: (k) => k.startsWith('portfolio.clientLogos.') && k.endsWith('.logo'), folder: 'client-logos' },
];

interface FieldRule {
  /** Last dot-segment of the key (e.g. `coverImage`, `logo`). */
  suffix: string;
  folder: string;
}

const FIELD_RULES: ReadonlyArray<FieldRule> = [
  { suffix: 'backgroundImage', folder: 'backgrounds' },
  { suffix: 'heroImage', folder: 'backgrounds' },
  { suffix: 'logo', folder: 'logos/platforms' },
  { suffix: 'avatar', folder: 'portraits' },
  { suffix: 'portrait', folder: 'portraits' },
  { suffix: 'photo', folder: 'portraits' },
  { suffix: 'thumbnail', folder: 'covers' },
  { suffix: 'coverImage', folder: 'covers' },
  { suffix: 'image', folder: 'covers' },
];

/** Default fallback when neither a section rule nor a suffix rule matches. */
export const FALLBACK_DEFAULT_FOLDER = 'covers';

/**
 * Folders that are dedicated to a single content-heavy section. The
 * MediaPicker UI groups these separately from category folders.
 */
export const SECTION_FOLDER_NAMES: ReadonlySet<string> = new Set([
  'case-study',
  'team',
  'testimonials',
  'news',
  'blog-posts',
  'knowledge-center',
  'events',
  'client-logos',
]);

export function defaultFolderForField(key: string): string {
  for (const rule of SECTION_RULES) {
    if (rule.test(key)) return rule.folder;
  }
  const lastSegment = key.slice(key.lastIndexOf('.') + 1);
  for (const rule of FIELD_RULES) {
    if (rule.suffix === lastSegment) return rule.folder;
  }
  return FALLBACK_DEFAULT_FOLDER;
}
