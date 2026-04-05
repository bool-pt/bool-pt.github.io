export interface NewsletterStore {
  subscribe(email: string): Promise<void>;
  unsubscribe(email: string): Promise<void>;
  delete(email: string): Promise<void>;
}
