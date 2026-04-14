import type { ImageMetadata } from 'astro';
import { z } from 'zod';
import { defaultLocale, t } from '@bool/i18n';
import type { Locale } from '@bool/i18n';
import { resolveImage } from './media.ts';
import { collectArray, collectNestedList } from './sections.ts';

const itemSchema = z.object({
  name: z.string().min(1, 'name required'),
  role: z.string().min(1, 'role required'),
  image: z.string().min(1, 'image required'),
  linkedin: z.string().default(''),
  email: z.string().default(''),
  bio: z.string().default(''),
  quote: z.string().default(''),
});

export interface TeamMemberCard {
  name: string;
  role: string;
  /** Resolved portrait image, rendered on the front face. */
  image: ImageMetadata;
  linkedin?: string;
  email?: string;
  /** Long-form bio shown when the card opens (back face). */
  bio: string;
  /** Optional pull quote shown above the bio. */
  quote: string;
  /** Optional skill / focus tags shown as pills on the back face. */
  tags: string[];
}

export interface TeamGridPayload {
  labels: {
    heading: string;
    body: string;
    emailAriaPrefix: string;
    linkedinAriaSuffix: string;
  };
  members: TeamMemberCard[];
}

export function getTeamGrid(locale: Locale = defaultLocale): TeamGridPayload {
  const rawItems = collectArray('teamGrid.items', locale);
  const members: TeamMemberCard[] = rawItems.map((raw, idx) => {
    const parseResult = itemSchema.safeParse(raw);
    if (!parseResult.success) {
      throw new Error(
        `[@bool/content] teamGrid.items[${idx + 1}] failed validation: ${parseResult.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const parsed = parseResult.data;
    return {
      name: parsed.name,
      role: parsed.role,
      image: resolveImage(parsed.image),
      ...(parsed.linkedin ? { linkedin: parsed.linkedin } : {}),
      ...(parsed.email ? { email: parsed.email } : {}),
      bio: parsed.bio,
      quote: parsed.quote,
      tags: collectNestedList(raw, 'tags'),
    };
  });

  return {
    labels: {
      heading: t('teamGrid.heading', locale),
      body: t('teamGrid.body', locale),
      emailAriaPrefix: t('teamGrid.emailAriaPrefix', locale),
      linkedinAriaSuffix: t('teamGrid.linkedinAriaSuffix', locale),
    },
    members,
  };
}
