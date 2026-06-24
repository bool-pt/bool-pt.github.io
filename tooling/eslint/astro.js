import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import baseConfig from './base.js';

export default [
  ...baseConfig,
  ...astroPlugin.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ImageMetadata: 'readonly',
      },
    },
  },
  // .astro frontmatter is TypeScript: astro-eslint-parser (bundled by
  // eslint-plugin-astro) delegates the `---` block to a sub-parser. Set
  // @typescript-eslint/parser as that sub-parser so `interface`, `as const`,
  // and other TS-only syntax parse correctly.
  // Type-checked rules require parserOptions.project to be forwarded — astro
  // parser doesn't do that today, so they crash without override. Disable
  // them just for .astro files; .ts/.tsx files alongside still get the full
  // type-checked ruleset.
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.astro'],
        // astro-eslint-parser doesn't support projectService (inherited from
        // base.js) and warns on every .astro file. Type-checked rules are
        // disabled below, so the type-aware project service isn't needed here.
        projectService: false,
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  // ── Page-layer boundary ──────────────────────────────────────────────
  // Astro page files must only import from @bool/ui sections and layout,
  // never from compositions or primitives directly (those belong to @bool/ui
  // internals — use the section that wraps them instead).
  {
    files: ['src/pages/**/*.{astro,ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@bool/ui/compositions/**', '@bool/ui/primitives/**'],
              message:
                'Pages may only import from @bool/ui sections or layout — not compositions or primitives.',
            },
          ],
        },
      ],
    },
  },
];
