import { z } from 'zod';
import { titleField, descriptionField, dateField, imageField, tagsField } from './common';

export const blogSchema = z.object({
  title: titleField,
  description: descriptionField,
  date: dateField,
  author: z.string().min(1),
  image: imageField,
  tags: tagsField,
  locale: z.string().default('en'),
  draft: z.boolean().default(false),
});

export type BlogPost = z.infer<typeof blogSchema>;
