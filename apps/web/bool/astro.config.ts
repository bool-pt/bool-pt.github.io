import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { locales, defaultLocale } from '@bool/i18n';
import { sitemapConfig } from '@bool/seo';
import { SITE_URL } from '@bool/shared';
import { baseViteConfig } from '@bool/vite-config/base';

// Partytown only exists to run GA4 off the main thread. Skip the integration
// entirely when GA is not configured so the worker bundle is never shipped on a
// site that loads no analytics. Read from process.env (set in CI) at config time.
const gaEnabled = Boolean(process.env.PUBLIC_GA_MEASUREMENT_ID);

export default defineConfig({
  site: SITE_URL,
  base: '/',
  output: 'static',
  integrations: [
    react(),
    sitemap(sitemapConfig),
    ...(gaEnabled
      ? [
          partytown({
            config: {
              // Forward GA4 calls from Partytown web worker to main thread
              forward: ['dataLayer.push', 'gtag'],
            },
          }),
        ]
      : []),
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
