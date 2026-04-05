export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
