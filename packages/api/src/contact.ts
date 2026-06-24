import type { APIResponse, ContactFormData } from '@bool/shared';
import { post } from './submitters';

// The /contact endpoint has no phone field — fold it into the message so the
// team still sees it.
export function submitContactForm(data: ContactFormData): Promise<APIResponse> {
  const message = data.phone ? `${data.message}\n\nPhone: ${data.phone}` : data.message;
  return post(
    '/contact',
    {
      name: data.name,
      email: data.email,
      message,
      turnstile_token: data.turnstileToken,
    },
    'Contact form submission'
  );
}
