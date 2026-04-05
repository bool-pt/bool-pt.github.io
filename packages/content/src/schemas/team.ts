import { z } from 'zod';
import { imageField, orderField, urlField } from './common';

export const teamSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  image: imageField,
  linkedin: urlField.optional(),
  order: orderField,
});

export type TeamMember = z.infer<typeof teamSchema>;
