/**
 * Manifest powering the LinkPicker's cascading dropdowns:
 *   base (root) → page → section anchor.
 *
 * - The base + page list come from @bool/shared ROUTES so they stay in sync
 *   with the real site routes.
 * - The per-page section anchors are the section-key ids tagged on each page
 *   (see the `<div id="…" class="section-anchor">` wrappers in apps/web/bool).
 *   Keep this list aligned with those ids — an anchor only scrolls if the id
 *   exists on the page.
 */
import { BASE_PATH, ROUTES } from '@bool/shared';

/** An individual card within a section that can be deep-linked to. */
export interface LinkCard {
  /** Card anchor suffix. Full anchor is `<sectionId>-<cardId>`. Must match the
   *  id rendered on the site (slugify(card name)). */
  id: string;
  label: string;
}

export interface LinkSection {
  /** Anchor id on the page (also the section content-key prefix). */
  id: string;
  label: string;
  /** Cards within this section that can be linked to individually. Only
   *  populated for sections whose cards have stable identities (platforms,
   *  certifications, etc.). */
  cards?: LinkCard[];
}

export interface LinkPage {
  /** Full site-relative path, e.g. "/services". */
  path: string;
  label: string;
  sections: LinkSection[];
}

/** The single base segment, shown as a (default-selected) dropdown option. */
export const LINK_BASE = BASE_PATH;

/** Friendly-label helper kept local so the manifest stays declarative. */
const S = (id: string, label: string): LinkSection => ({ id, label });

export const LINK_PAGES: LinkPage[] = [
  {
    path: ROUTES.home,
    label: 'Home',
    sections: [
      S('hero', 'Hero'),
      S('newsletterBar', 'Newsletter Bar'),
      S('powerAi', 'Power of AI'),
      S('serviceCards', 'Service Cards'),
      S('ourPromise', 'Our Promise'),
      S('testimonials', 'Testimonials'),
      S('teamPreview', 'Team Preview'),
      S('insightsPreview', 'Insights Preview'),
      S('eventsPreview', 'Events Preview'),
      S('contactSection', 'Contact Form'),
      S('newsletterCta', 'Newsletter CTA'),
    ],
  },
  {
    path: ROUTES.about,
    label: 'About',
    sections: [
      S('aboutHero', 'About Hero'),
      S('statsOverview', 'Stats Overview'),
      S('powerAi', 'Power of AI'),
      S('featuredTech', 'Featured Tech'),
      S('teamGrid', 'Team Grid'),
      S('officeLocations', 'Office Locations'),
      S('contactSection', 'Contact Form'),
    ],
  },
  {
    path: ROUTES.services,
    label: 'Services',
    sections: [
      S('servicesHero', 'Services Hero'),
      S('aiPitch', 'AI Pitch'),
      S('solutionsRoi', 'Solutions ROI'),
      S('aiUseCases', 'AI Use Cases'),
      S('statsBanner', 'Stats Banner'),
      {
        id: 'techStack',
        label: 'Tech Stack',
        cards: [
          { id: 'outsystems', label: 'OutSystems' },
          { id: 'mendix', label: 'Mendix' },
          { id: 'microsoft-power-platform', label: 'Microsoft Power Platform' },
          { id: 'open-source-and-custom-stack', label: 'Open Source & Custom Stack' },
        ],
      },
      S('howWeWork', 'How We Work'),
      S('ctaBanner', 'CTA Banner'),
      S('contactSection', 'Contact Form'),
      S('newsletterCta', 'Newsletter CTA'),
    ],
  },
  {
    path: ROUTES.people,
    label: 'People',
    sections: [
      S('peopleHero', 'People Hero'),
      S('coreValues', 'Core Values'),
      S('beyondWork', 'Beyond Work'),
      S('photoGallery', 'Photo Gallery'),
      S('teamTestimonials', 'Team Testimonials'),
      S('careersCta', 'Careers CTA'),
      S('contactSection', 'Contact Form'),
      S('newsletterCta', 'Newsletter CTA'),
    ],
  },
  {
    path: ROUTES.portfolio,
    label: 'Portfolio',
    sections: [
      S('portfolioHero', 'Portfolio Hero'),
      S('caseStudies', 'Case Studies'),
      S('clientTestimonials', 'Client Testimonials'),
      S('portfolioStats', 'Portfolio Stats'),
      S('certifications', 'Certifications'),
      S('clientLogos', 'Client Logos'),
      S('ctaBanner', 'CTA Banner'),
      S('contactSection', 'Contact Form'),
      S('newsletterCta', 'Newsletter CTA'),
    ],
  },
  {
    path: ROUTES.blog,
    label: 'Insights',
    sections: [
      S('insightsHero', 'Insights Hero'),
      S('knowledgeCenter', 'Knowledge Center'),
      S('newsUpdates', 'News & Updates'),
      S('pressReleases', 'Press Releases'),
      S('eventsCalendar', 'Events Calendar'),
      S('insightsCta', 'Insights CTA'),
      S('contactSection', 'Contact Form'),
      S('newsletterCta', 'Newsletter CTA'),
    ],
  },
  {
    path: ROUTES.contacts,
    label: 'Contacts',
    sections: [S('contactsHero', 'Contacts Hero'), S('newsletterCta', 'Newsletter CTA')],
  },
];
