import { z } from 'zod';
import { orderField } from './common';

export const testimonialSchema = z.object({
  author: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  avatar: z.string().optional(),
  quote: z.string().min(1),
  order: orderField,
});

export type Testimonial = z.infer<typeof testimonialSchema>;
