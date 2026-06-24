import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { blogSchema } from '../schemas/blog';
import { eventSchema } from '../schemas/events';

const dataBase = new URL('../../data/', import.meta.url);

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: new URL('blog', dataBase) }),
    schema: blogSchema,
  }),
  events: defineCollection({
    loader: glob({ pattern: '**/*.json', base: new URL('events', dataBase) }),
    schema: eventSchema,
  }),
};
