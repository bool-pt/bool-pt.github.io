import boundaries from 'eslint-plugin-boundaries';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import astroConfig from '@bool/eslint-config/astro';

export default [
  ...astroConfig,
  // ── Layer boundary enforcement ────────────────────────────────────────
  // Enforces the one-way import hierarchy within @bool/ui:
  //   sections → compositions → primitives (no reverse, no layer skipping)
  //   layout   → compositions → primitives
  //   lib      ← imported by any layer, imports nothing internal
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'lib', pattern: ['src/lib/**/*'] },
        { type: 'primitives', pattern: ['src/primitives/**/*'] },
        { type: 'compositions', pattern: ['src/compositions/**/*'] },
        { type: 'sections', pattern: ['src/sections/**/*'] },
        { type: 'layout', pattern: ['src/layout/**/*'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['lib'], allow: [] },
            { from: ['primitives'], allow: ['primitives', 'lib'] },
            { from: ['compositions'], allow: ['compositions', 'primitives', 'lib'] },
            { from: ['sections'], allow: ['compositions', 'primitives', 'lib'] },
            { from: ['layout'], allow: ['layout', 'compositions', 'primitives', 'lib'] },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    ...reactPlugin.configs.flat.recommended,
  },
  {
    files: ['**/*.tsx'],
    ...reactPlugin.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
];
