export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  turnstileToken: string;
}

export interface NewsletterData {
  name: string;
  email: string;
  turnstileToken: string;
}

export interface EventScheduleData {
  eventName: string;
  name: string;
  phone: string;
  email: string;
  timeSuggestion: string;
  message: string;
  turnstileToken: string;
}

export interface APIResponse {
  message?: string;
  error?: string;
}

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  /** Policy version this consent was recorded against. A bump re-prompts the user. */
  version: number;
}

export interface EventItem {
  date: string;
  rawDate?: string;
  tag?: string;
  tagColor?: string;
  title: string;
  description: string;
  location?: string;
}
