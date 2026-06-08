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
    ignores: ['dist/**', '.astro/**', 'node_modules/**', '**/scripts/**/*.mjs', '**/env.d.ts'],
  }
);
