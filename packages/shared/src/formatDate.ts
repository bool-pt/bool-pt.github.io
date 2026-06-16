export function formatDate(date: Date, style: 'long' | 'short' = 'long', locale = 'en-GB'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
}
