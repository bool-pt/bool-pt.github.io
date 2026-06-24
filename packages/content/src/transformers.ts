import { formatDate } from '@bool/shared';
import type { BlogPost } from './schemas/blog';

export function transformEvent(e: {
  data: {
    date: Date;
    tag?: string;
    tagColor?: string;
    title: string;
    description: string;
    location?: string;
  };
}) {
  return {
    date: formatDate(e.data.date),
    rawDate: e.data.date.toISOString(),
    tag: e.data.tag,
    tagColor: e.data.tagColor,
    title: e.data.title,
    description: e.data.description,
    location: e.data.location,
  };
}

export function transformBlogPost(e: { id: string; data: BlogPost }) {
  return {
    slug: e.id,
    title: e.data.title,
    author: e.data.author,
    date: formatDate(e.data.date, 'short'),
  };
}
