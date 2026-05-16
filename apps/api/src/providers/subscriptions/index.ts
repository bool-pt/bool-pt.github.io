import { getConfig } from '../../config.ts';
import { createGoogleSheetsClient } from '../../lib/google-sheets.ts';
import { NoopSubscriptionStore } from './noop.ts';
import { SheetsSubscriptionStore } from './sheets.ts';
import type { SubscriptionStore } from './types.ts';

export type { SubscriptionStore };

export function createSubscriptionStore(): SubscriptionStore {
  const config = getConfig();
  if (!config.googleServiceAccountKey || !config.newsletterSheetId || !config.contactsSheetId) {
    return new NoopSubscriptionStore();
  }
  const client = createGoogleSheetsClient(config.googleServiceAccountKey);
  return new SheetsSubscriptionStore(client, config.newsletterSheetId, config.contactsSheetId);
}
