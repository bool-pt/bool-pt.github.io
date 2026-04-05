import {
  contactFormSchema,
  contactFormSimpleSchema,
  newsletterSchema,
  type ContactFormInput,
  type ContactFormSimpleInput,
  type NewsletterInput,
} from './validation';

export type { ContactFormInput, ContactFormSimpleInput, NewsletterInput };

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<{ path: string; message: string }> };

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };

function toResult<T>(parsed: SafeParseResult<T>): ValidationResult<T> {
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    errors: parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export function validateContactForm(data: unknown): ValidationResult<ContactFormInput> {
  return toResult(contactFormSchema.safeParse(data));
}

export function validateContactFormSimple(data: unknown): ValidationResult<ContactFormSimpleInput> {
  return toResult(contactFormSimpleSchema.safeParse(data));
}

export function validateNewsletter(data: unknown): ValidationResult<NewsletterInput> {
  return toResult(newsletterSchema.safeParse(data));
}
