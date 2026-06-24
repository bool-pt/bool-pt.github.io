import { z } from 'zod';
import { titleField, descriptionField, dateField, urlField } from './common';

export const eventSchema = z.object({
  title: titleField,
  description: descriptionField,
  date: dateField,
  endDate: dateField.optional(),
  location: z.string().optional(),
  url: urlField.optional(),
  type: z.enum(['meetup', 'conference', 'workshop', 'webinar']),
  tag: z.string().optional(),
  tagColor: z.string().optional(),
});

export type Event = z.infer<typeof eventSchema>;
