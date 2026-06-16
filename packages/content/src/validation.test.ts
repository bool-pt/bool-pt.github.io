import { describe, it, expect } from 'vitest';
import { validateLocale, validateMeta } from './validation.ts';

describe('validateLocale (default locale = en)', () => {
  const report = validateLocale();

  it('every media-typed key resolves to a real file in packages/media/images/', () => {
    expect(
      report.mediaErrors,
      report.mediaErrors.map((e) => `  ${e.key} -> "${e.value}": ${e.reason}`).join('\n')
    ).toEqual([]);
  });

  it('every iconName key references a known GradientIcon', () => {
    expect(
      report.iconErrors,
      report.iconErrors.map((e) => `  ${e.key} = "${e.value}": ${e.reason}`).join('\n')
    ).toEqual([]);
  });
});

describe('validateMeta (default locale = en)', () => {
  it('every json-editor page/section in _meta is labelled and backed by content', () => {
    const errors = validateMeta();
    expect(errors, errors.map((e) => `  ${e.key}: ${e.reason}`).join('\n')).toEqual([]);
  });
});
