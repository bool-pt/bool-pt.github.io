import { z } from 'zod';
import { titleField, descriptionField, dateField, imageField, tagsField } from './common';

export const portfolioSchema = z.object({
  title: titleField,
  description: descriptionField,
  client: z.string().min(1),
  image: imageField,
  tags: tagsField,
  date: dateField,
  featured: z.boolean().default(false),
  metrics: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export type PortfolioEntry = z.infer<typeof portfolioSchema>;
