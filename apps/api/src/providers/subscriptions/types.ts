export interface NewsletterRow {
  email: string;
  date: string;
}

export interface ContactRow {
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface SubscriptionStore {
  recordNewsletter(row: NewsletterRow): Promise<void>;
  recordContact(row: ContactRow): Promise<void>;
  removeNewsletter(email: string): Promise<void>;
  removeContact(email: string): Promise<void>;
}
