export const sitemapConfig = {
  filter: (page: string) => !page.includes('/404'),
} as const;
