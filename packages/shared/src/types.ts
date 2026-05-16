export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  captchaToken: string;
}

export interface NewsletterData {
  name: string;
  email: string;
  captchaToken: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
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
