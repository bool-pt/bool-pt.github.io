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

// Fail the deploy loudly if the public form-config vars are missing. Without
// them the site builds fine but every form POSTs to an empty URL / with an
// empty Turnstile token and silently 400/403s in production. A missing GitHub
// repo variable arrives as an empty string, so check for falsy, not undefined.
// Scoped to `astro build` in CI: the config also loads for `astro check`
// (typecheck) and `astro preview` (e2e serves the pre-built dist), and neither
// of those is given the vars. Locally the vars stay optional so `pnpm dev`/`pnpm
// build` work without them (posts from localhost are CORS-blocked anyway).
const isProductionBuild = process.env.CI && process.argv.includes('build');
if (isProductionBuild) {
  for (const name of ['PUBLIC_API_BASE_URL', 'PUBLIC_TURNSTILE_SITE_KEY'] as const) {
    if (!process.env[name]) {
      throw new Error(
        `Missing required build variable ${name}. Set it in the GitHub repo variables (see documentation/ci-deploy.md).`
      );
    }
  }
}

export default defineConfig({
  site: SITE_URL,
  base: '/bool/',
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
