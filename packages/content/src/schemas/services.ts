import { z } from 'zod';
import { titleField, descriptionField, orderField, urlField } from './common';

export const serviceSchema = z.object({
  title: titleField,
  description: descriptionField,
  icon: z.string().optional(),
  href: urlField.optional(),
  subtitle: z.string().optional(),
  category: z.enum(['service', 'engagement-model']).default('service'),
  order: orderField,
});

export type Service = z.infer<typeof serviceSchema>;
