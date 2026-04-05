import { SITE_URL, SITE_NAME, COMPANY, SOCIAL } from '@bool/shared';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    url: SITE_URL,
    sameAs: Object.values(SOCIAL),
    contactPoint: {
      '@type': 'ContactPoint',
      email: COMPANY.email,
      contactType: 'customer service',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

interface BlogPostingJsonLdOptions {
  title: string;
  description: string;
  datePublished: string;
  author: string;
  image: string;
  url: string;
}

export function blogPostingJsonLd(options: BlogPostingJsonLdOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: options.title,
    description: options.description,
    datePublished: options.datePublished,
    author: {
      '@type': 'Person',
      name: options.author,
    },
    image: options.image,
    url: options.url,
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      url: SITE_URL,
    },
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface EventJsonLdOptions {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  url: string;
}

export function eventJsonLd(options: EventJsonLdOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: options.name,
    description: options.description,
    startDate: options.startDate,
    ...(options.endDate && { endDate: options.endDate }),
    ...(options.location && {
      location: { '@type': 'Place', name: options.location },
    }),
    url: options.url,
    organizer: {
      '@type': 'Organization',
      name: COMPANY.name,
      url: SITE_URL,
    },
  };
}
