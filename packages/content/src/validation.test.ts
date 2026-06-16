import { describe, it, expect } from 'vitest';
import { validateLocale } from './validation.ts';

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
