import { formatDate } from '@bool/shared';
import type { BlogPost } from './schemas/blog';
import type { PortfolioEntry } from './schemas/portfolio';
import type { Service } from './schemas/services';
import type { TeamMember } from './schemas/team';
import type { Testimonial } from './schemas/testimonials';

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

export function transformService(e: { data: Service }) {
  return { title: e.data.title, description: e.data.description, href: e.data.href };
}

export function transformModel(e: { data: Service }) {
  return {
    icon: e.data.icon ?? 'shield',
    title: e.data.title,
    subtitle: e.data.subtitle,
    href: e.data.href,
  };
}

export function transformTestimonial(e: { data: Testimonial }) {
  return { quote: e.data.quote, company: e.data.company, designation: e.data.role };
}

export function transformBlogPost(e: { id: string; data: BlogPost }) {
  return {
    slug: e.id,
    title: e.data.title,
    author: e.data.author,
    date: formatDate(e.data.date, 'short'),
  };
}

export function transformTeamMember(e: { data: TeamMember }) {
  return { name: e.data.name, role: e.data.role, image: e.data.image, linkedin: e.data.linkedin };
}

export function transformPortfolioCase(e: { data: PortfolioEntry }) {
  return {
    title: e.data.title,
    description: e.data.description,
    client: e.data.client,
    tags: e.data.tags,
    image: e.data.image,
    metrics: e.data.metrics,
    challenge: e.data.challenge,
    solution: e.data.solution,
    techStack: e.data.techStack,
  };
}
