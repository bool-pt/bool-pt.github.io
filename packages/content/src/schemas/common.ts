import { z } from 'zod';

export const titleField = z.string().min(1);
export const descriptionField = z.string().min(1);
export const dateField = z.coerce.date();
export const imageField = z.string().min(1);
export const tagsField = z.array(z.string().min(1)).default([]);
export const urlField = z.string().min(1);
