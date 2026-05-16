import type { GoogleSheetsClient } from '../../lib/google-sheets.ts';
import type { ContactRow, NewsletterRow, SubscriptionStore } from './types.ts';

export class SheetsSubscriptionStore implements SubscriptionStore {
  constructor(
    private readonly client: GoogleSheetsClient,
    private readonly newsletterSheetId: string,
    private readonly contactsSheetId: string
  ) {}

  async recordNewsletter(row: NewsletterRow): Promise<void> {
    await this.client.appendRow(this.newsletterSheetId, [row.email, row.date]);
  }

  async recordContact(row: ContactRow): Promise<void> {
    await this.client.appendRow(this.contactsSheetId, [row.name, row.email, row.message, row.date]);
  }

  async removeNewsletter(email: string): Promise<void> {
    await this.client.deleteRowsWhere(this.newsletterSheetId, 'A', email);
  }

  async removeContact(email: string): Promise<void> {
    await this.client.deleteRowsWhere(this.contactsSheetId, 'B', email);
  }
}
