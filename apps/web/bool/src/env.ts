import { z } from 'zod';

const envSchema = z.object({
  PUBLIC_CONTACT_API_URL: z.url(),
  PUBLIC_NEWSLETTER_API_URL: z.url(),
  PUBLIC_HCAPTCHA_SITE_KEY: z.string().min(1),
  PUBLIC_GA_MEASUREMENT_ID: z.string().min(1),
});

export const env = envSchema.parse(import.meta.env);
