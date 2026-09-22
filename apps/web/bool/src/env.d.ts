/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY: string;
  readonly PUBLIC_GA_MEASUREMENT_ID: string;
  readonly PUBLIC_SENTRY_DSN: string;
  readonly PUBLIC_LINKEDIN_PARTNER_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
