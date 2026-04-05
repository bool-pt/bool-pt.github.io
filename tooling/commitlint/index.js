/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'web',
        'json-editor',
        'ui',
        'shared',
        'api',
        'analytics',
        'compliance',
        'content',
        'i18n',
        'media',
        'seo',
        'eslint',
        'prettier',
        'tsconfig',
        'tailwind',
        'commitlint',
        'deps',
        'ci',
        'docs',
      ],
    ],
    'scope-empty': [1, 'never'],
  },
};

export default config;
