/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CONTACT_API_URL: string;
  readonly PUBLIC_NEWSLETTER_API_URL: string;
  readonly PUBLIC_HCAPTCHA_SITE_KEY: string;
  readonly PUBLIC_GA_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
