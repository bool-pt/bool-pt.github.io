import type { ImageMetadata } from 'astro';
import { z } from 'zod';
import { defaultLocale, t, tList } from '@bool/i18n';
import type { Locale } from '@bool/i18n';
import { resolveImage } from './media.ts';
import { collectArray, collectNestedList } from './sections.ts';

const itemSchema = z.object({
  client: z.string().min(1, 'client required'),
  title: z.string().default(''),
  subtitle: z.string().default(''),
  coverImage: z.string().min(1, 'coverImage required'),
  sector: z.string().min(1, 'sector required'),
  tech: z.string().min(1, 'tech required'),
  metric1Value: z.string().default(''),
  metric1Label: z.string().default(''),
  metric2Value: z.string().default(''),
  metric2Label: z.string().default(''),
  metric3Value: z.string().default(''),
  metric3Label: z.string().default(''),
  challenge: z.string().default(''),
  solution: z.string().default(''),
  benefits: z.string().default(''),
  team: z.string().default(''),
  duration: z.string().default(''),
});

export interface CaseStudyMetric {
  value: string;
  label: string;
}

export interface CaseStudy {
  /** Cover layer: client name shown above the title (e.g. "BANCO NACIONAL"). */
  client: string;
  /** Cover layer: short project label (e.g. "Banking Project"). */
  title: string;
  /** Cover/back/modal layer: bold heading (e.g. "Credit Risk Digital Platform"). */
  subtitle: string;
  /** Resolved cover image; rendered as the front of the flip card and the modal hero. */
  coverImage: ImageMetadata;
  /** Filter sector (e.g. "BANKING") — must match a value in `caseStudies.sectors.*`. */
  sector: string;
  /** Filter tech (e.g. "MENDIX") — must match a value in `caseStudies.techFilters.*`. */
  tech: string;
  /** Derived back/modal header: `${sector} · ${tech}`. */
  backHeader: string;
  /** Derived modal subheading: `${client} · ${sector.toLowerCase()}`. */
  modalSubheading: string;
  /** Up to 3 value/label pairs; empty pairs are dropped. */
  metrics: CaseStudyMetric[];
  /** Modal: long-form challenge text. */
  challenge: string;
  /** Modal: long-form solution text. */
  solution: string;
  /** Modal: optional benefits text. */
  benefits: string;
  /** Modal meta line. */
  team: string;
  /** Modal meta line. */
  duration: string;
  /** Modal: tech stack pills (compacted from `tags.1..N`). */
  tags: string[];
}

function buildMetrics(parsed: z.infer<typeof itemSchema>): CaseStudyMetric[] {
  const candidates: CaseStudyMetric[] = [
    { value: parsed.metric1Value, label: parsed.metric1Label },
    { value: parsed.metric2Value, label: parsed.metric2Label },
    { value: parsed.metric3Value, label: parsed.metric3Label },
  ];
  return candidates.filter((m) => m.value.trim() !== '' && m.label.trim() !== '');
}

function validateAgainstList(field: string, value: string, allowed: string[]): void {
  if (!allowed.some((a) => a.toUpperCase() === value.toUpperCase())) {
    throw new Error(
      `[@bool/content] caseStudies item has ${field}="${value}" which is not in caseStudies.${field === 'sector' ? 'sectors' : 'techFilters'}.*. Allowed: ${allowed.join(', ')}`
    );
  }
}

export interface CaseStudiesPayload {
  /** Section labels (header chrome). */
  labels: {
    tag: string;
    heading: string;
    body: string;
    fullCaseStudyCta: string;
    backToCases: string;
    emptyState: string;
    filterAriaLabel: string;
    challengeLabel: string;
    solutionLabel: string;
    techStackLabel: string;
    talkToExpertCta: string;
    close: string;
  };
  sectors: string[];
  techFilters: string[];
  items: CaseStudy[];
}

export function getCaseStudies(locale: Locale = defaultLocale): CaseStudiesPayload {
  const sectors = tList('caseStudies.sectors', locale);
  const techFilters = tList('caseStudies.techFilters', locale);

  const rawItems = collectArray('caseStudies.items', locale);
  const items: CaseStudy[] = rawItems.map((raw, idx) => {
    const parseResult = itemSchema.safeParse(raw);
    if (!parseResult.success) {
      throw new Error(
        `[@bool/content] caseStudies.items[${idx + 1}] failed validation: ${parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
      );
    }
    const parsed = parseResult.data;

    validateAgainstList('sector', parsed.sector, sectors);
    validateAgainstList('tech', parsed.tech, techFilters);

    return {
      client: parsed.client,
      title: parsed.title,
      subtitle: parsed.subtitle,
      coverImage: resolveImage(parsed.coverImage),
      sector: parsed.sector,
      tech: parsed.tech,
      backHeader: `${parsed.sector.toUpperCase()} · ${parsed.tech.toUpperCase()}`,
      modalSubheading: `${parsed.client} · ${parsed.sector.toLowerCase()}`,
      metrics: buildMetrics(parsed),
      challenge: parsed.challenge,
      solution: parsed.solution,
      benefits: parsed.benefits,
      team: parsed.team,
      duration: parsed.duration,
      tags: collectNestedList(raw, 'tags'),
    };
  });

  return {
    labels: {
      tag: t('caseStudies.tag', locale),
      heading: t('caseStudies.heading', locale),
      body: t('caseStudies.body', locale),
      fullCaseStudyCta: t('caseStudies.fullCaseStudyCta', locale),
      backToCases: t('caseStudies.backToCases', locale),
      emptyState: t('caseStudies.emptyState', locale),
      filterAriaLabel: t('caseStudies.filter.aria', locale),
      challengeLabel: t('caseStudies.challengeLabel', locale),
      solutionLabel: t('caseStudies.solutionLabel', locale),
      techStackLabel: t('caseStudies.techStackLabel', locale),
      talkToExpertCta: t('caseStudies.talkToExpertCta', locale),
      close: t('common.close', locale),
    },
    sectors,
    techFilters,
    items,
  };
}
