import type { NewsletterData } from '@bool/shared';
import { createSubmitter } from './submitters';

function getNewsletterApiUrl(): string {
  const url = import.meta.env.PUBLIC_NEWSLETTER_API_URL;
  if (!url) throw new Error('Missing PUBLIC_NEWSLETTER_API_URL environment variable');
  return url;
}

export const submitNewsletter = createSubmitter<NewsletterData>(
  getNewsletterApiUrl,
  'Newsletter subscription',
);
