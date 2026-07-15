import { t } from '@bool/i18n';
import { SITE_URL, SITE_NAME, COMPANY } from '@bool/shared';

/**
 * Serialize a JSON-LD object for embedding in `<script type="application/ld+json"
 * set:html={...}>`. `JSON.stringify` does not escape `<`, `>`, or `&`, so a string
 * value containing `</script>` (or `<!--` / `<script`) would close the element and
 * let arbitrary markup through. Escaping those characters to their `\uXXXX` forms
 * keeps the payload valid JSON while making script-context breakout impossible.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/** Social profile URLs are content-managed in `en.json` (`footer.social.*.href`). */
const SOCIAL_URL_KEYS = [
  'footer.social.linkedin.href',
  'footer.social.github.href',
  'footer.social.twitter.href',
  'footer.social.instagram.href',
  'footer.social.facebook.href',
  'footer.social.youtube.href',
];

function socialUrls(): string[] {
  return SOCIAL_URL_KEYS.map((key) => t(key)).filter((url) => url.startsWith('http'));
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    url: SITE_URL,
    sameAs: socialUrls(),
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
