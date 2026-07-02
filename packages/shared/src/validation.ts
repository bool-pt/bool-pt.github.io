import { z } from 'zod';

export const contactFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const contactFormSimpleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const newsletterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
});

// Validates the EventScheduleModal form fields. `message` is capped at 5000 to
// match the /event API limit; `phone` is optional (the API no longer requires it).
export const eventScheduleSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email address'),
  time: z.string().min(1, 'Please select a time'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be at most 5000 characters'),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ContactFormSimpleInput = z.infer<typeof contactFormSimpleSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type EventScheduleInput = z.infer<typeof eventScheduleSchema>;
