import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { EmailMessage, EmailProvider } from './types.ts';

export class SesEmailProvider implements EmailProvider {
  private readonly client = new SESv2Client({});

  async send(message: EmailMessage): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: message.from,
        Destination: { ToAddresses: [message.to] },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
        Content: {
          Simple: {
            Subject: { Data: message.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: message.html, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  }
}
