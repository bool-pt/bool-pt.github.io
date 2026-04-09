import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { locales, defaultLocale } from '@bool/i18n';
import { sitemapConfig } from '@bool/seo';
import { SITE_URL } from '@bool/shared';
import { baseViteConfig } from '@bool/vite-config/base';

export default defineConfig({
  site: SITE_URL,
  base: '/bool/',
  output: 'static',
  integrations: [
    react(),
    sitemap(sitemapConfig),
    partytown({
      config: {
        // Forward GA4 calls from Partytown web worker to main thread
        forward: ['dataLayer.push', 'gtag'],
      },
    }),
  ],
  vite: {
    ...baseViteConfig,
    plugins: [tailwindcss()],
    resolve: { dedupe: ['react', 'react-dom'] },
  },
  i18n: {
    defaultLocale,
    locales: [...locales],
    routing: { prefixDefaultLocale: false },
  },
});
