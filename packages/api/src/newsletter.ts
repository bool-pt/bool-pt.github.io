import type { APIResponse, NewsletterData } from '@bool/shared';
import { post } from './submitters';

export function submitNewsletter(data: NewsletterData): Promise<APIResponse> {
  return post(
    '/subscribe',
    {
      name: data.name,
      email: data.email,
      turnstile_token: data.turnstileToken,
    },
    'Newsletter subscription'
  );
}
