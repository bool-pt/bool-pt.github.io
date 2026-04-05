import type { ContactFormData } from '@bool/shared';
import { createSubmitter } from './submitters';

function getContactApiUrl(): string {
  const url = import.meta.env.PUBLIC_CONTACT_API_URL;
  if (!url) throw new Error('Missing PUBLIC_CONTACT_API_URL environment variable');
  return url;
}

export const submitContactForm = createSubmitter<ContactFormData>(
  getContactApiUrl,
  'Contact form submission',
);
