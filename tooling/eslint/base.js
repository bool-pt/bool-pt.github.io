import js from '@eslint/js';
import importXPlugin from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            // Root-level config files (e.g. astro.config.ts, vitest.config.ts)
            '*.config.ts',
            '*.config.mjs',
            '*.config.js',
            // One level deep — .mjs/.js only; .ts is excluded because src/*.config.ts
            // files are already included by tsconfig "include": ["src"] and having
            // them in allowDefaultProject too triggers a parser conflict.
            '*/*.config.mjs',
            '*/*.config.js',
            // Two levels deep (e.g. packages/ui/eslint.config.mjs)
            '*/*/*.config.mjs',
            // Tooling package JS files not named *.config.js (e.g. tooling/eslint/base.js)
            'tooling/*/*.js',
            // Exact path (not a `*/*.config.ts` glob, which would also match src
            // configs and trigger the parser conflict noted above).
            'tooling/knip.config.ts',
            // Standalone tooling scripts (not under a src/ tsconfig include).
            'tooling/scripts/*.ts',
            // App-level config files (e.g. apps/web/bool/astro.config.ts). These
            // only match the root-level '*.config.ts' pattern when eslint runs with
            // the app as cwd (turbo lint); lint-staged runs from the repo root, so
            // they need an explicit repo-root-relative entry. Scoped to apps/*/*/ so
            // it can never match a src/*.config.ts already in a tsconfig include.
            'apps/*/*/*.config.ts',
            // The e2e package's Playwright config (no src/ tsconfig to include it).
            'e2e/*.config.ts',
          ],
        },
      },
    },
    plugins: {
      'import-x': importXPlugin,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true } },
      ],

      // Disable overly aggressive type-checked rules
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Import ordering
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@bool/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // Playwright e2e specs: non-null assertions on locators (`page.locator(...)!`)
    // are idiomatic and safe within a test's controlled context.
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      '.claude/**',
      '**/scripts/**/*.mjs',
      '**/env.d.ts',
    ],
  }
);
