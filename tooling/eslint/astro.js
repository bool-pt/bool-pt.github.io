import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';
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
];
