import { getCollection } from 'astro:content';

function byOrder<T extends { data: { order: number } }>(a: T, b: T) {
  return a.data.order - b.data.order;
}

function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

function byDateAsc<T extends { data: { date: Date } }>(a: T, b: T) {
  return a.data.date.valueOf() - b.data.date.valueOf();
}

export async function getBlogPosts(locale = 'en') {
  const posts = await getCollection('blog', ({ data }) => !data.draft && data.locale === locale);
  return posts.sort(byDateDesc);
}

export async function getTeam() {
  const members = await getCollection('team');
  return members.sort(byOrder);
}

export async function getTestimonials() {
  const items = await getCollection('testimonials');
  return items.sort(byOrder);
}

export async function getServices() {
  const items = await getCollection('services', ({ data }) => data.category === 'service');
  return items.sort(byOrder);
}

export async function getEngagementModels() {
  const items = await getCollection('services', ({ data }) => data.category === 'engagement-model');
  return items.sort(byOrder);
}

export async function getPortfolio() {
  const items = await getCollection('portfolio');
  return items.sort(byDateDesc);
}

export async function getEvents() {
  const items = await getCollection('events');
  return items.sort(byDateAsc);
}

export async function getUpcomingEvents() {
  const now = new Date();
  const items = await getEvents();
  return items.filter((e) => e.data.date >= now);
}
