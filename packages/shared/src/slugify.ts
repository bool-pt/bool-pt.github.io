/**
 * Convert a human label into a stable URL-anchor slug.
 *
 * Used to derive per-card anchor ids (e.g. a platform name "Microsoft Power
 * Platform" -> "microsoft-power-platform") so links can target an individual
 * card within a section. Must stay deterministic and identical wherever it's
 * used (site markup + JSON editor) so the generated ids match.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // strip diacritics
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}
