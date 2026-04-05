import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { blogSchema } from '../schemas/blog';
import { eventSchema } from '../schemas/events';
import { portfolioSchema } from '../schemas/portfolio';
import { serviceSchema } from '../schemas/services';
import { teamSchema } from '../schemas/team';
import { testimonialSchema } from '../schemas/testimonials';

const dataBase = new URL('../../data/', import.meta.url);

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: new URL('blog', dataBase) }),
    schema: blogSchema,
  }),
  team: defineCollection({
    loader: glob({ pattern: '**/*.json', base: new URL('team', dataBase) }),
    schema: teamSchema,
  }),
  testimonials: defineCollection({
    loader: glob({ pattern: '**/*.json', base: new URL('testimonials', dataBase) }),
    schema: testimonialSchema,
  }),
  services: defineCollection({
    loader: glob({ pattern: '**/*.json', base: new URL('services', dataBase) }),
    schema: serviceSchema,
  }),
  portfolio: defineCollection({
    loader: glob({ pattern: '**/*.md', base: new URL('portfolio', dataBase) }),
    schema: portfolioSchema,
  }),
  events: defineCollection({
    loader: glob({ pattern: '**/*.json', base: new URL('events', dataBase) }),
    schema: eventSchema,
  }),
};
