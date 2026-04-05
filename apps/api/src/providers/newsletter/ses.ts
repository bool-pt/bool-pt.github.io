import {
  SESv2Client,
  CreateContactCommand,
  UpdateContactCommand,
  DeleteContactCommand,
  AlreadyExistsException,
} from '@aws-sdk/client-sesv2';
import type { NewsletterStore } from './types.ts';

export class SesNewsletterStore implements NewsletterStore {
  private readonly client = new SESv2Client({});

  constructor(private readonly contactListName: string) {}

  async subscribe(email: string): Promise<void> {
    try {
      await this.client.send(
        new CreateContactCommand({
          ContactListName: this.contactListName,
          EmailAddress: email,
          UnsubscribeAll: false,
        }),
      );
    } catch (err) {
      if (err instanceof AlreadyExistsException) {
        await this.client.send(
          new UpdateContactCommand({
            ContactListName: this.contactListName,
            EmailAddress: email,
            UnsubscribeAll: false,
          }),
        );
        return;
      }
      throw err;
    }
  }

  async unsubscribe(email: string): Promise<void> {
    await this.client.send(
      new UpdateContactCommand({
        ContactListName: this.contactListName,
        EmailAddress: email,
        UnsubscribeAll: true,
      }),
    );
  }

  async delete(email: string): Promise<void> {
    await this.client.send(
      new DeleteContactCommand({
        ContactListName: this.contactListName,
        EmailAddress: email,
      }),
    );
  }
}
