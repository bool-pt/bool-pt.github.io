import type { SubscriptionStore } from './types.ts';

export class NoopSubscriptionStore implements SubscriptionStore {
  async recordNewsletter(): Promise<void> {}
  async recordContact(): Promise<void> {}
  async removeNewsletter(): Promise<void> {}
  async removeContact(): Promise<void> {}
}
