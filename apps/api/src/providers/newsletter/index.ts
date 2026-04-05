import { getConfig } from '../../config.ts';
import { SesNewsletterStore } from './ses.ts';
import type { NewsletterStore } from './types.ts';

export type { NewsletterStore };

export function createNewsletterStore(): NewsletterStore {
  return new SesNewsletterStore(getConfig().sesContactList);
}
