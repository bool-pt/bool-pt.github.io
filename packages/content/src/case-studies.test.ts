import { describe, it, expect } from 'vitest';
import { getCaseStudies } from './case-studies.ts';

describe('getCaseStudies (real en.json)', () => {
  const payload = getCaseStudies();

  it('returns at least one case study', () => {
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it('every case study has the required cover layer', () => {
    for (const item of payload.items) {
      expect(item.client.length).toBeGreaterThan(0);
      expect(typeof item.title).toBe('string');
      expect(typeof item.subtitle).toBe('string');
      // resolveImage throws if the file isn't found, so reaching here means
      // every coverImage path resolves to a real file.
      expect(item.coverImage).toBeDefined();
    }
  });

  it('every sector / tech matches one of the filter values (validated by loader)', () => {
    const sectors = payload.sectors.map((s) => s.toUpperCase());
    const techs = payload.techFilters.map((t) => t.toUpperCase());
    for (const item of payload.items) {
      expect(sectors).toContain(item.sector.toUpperCase());
      expect(techs).toContain(item.tech.toUpperCase());
    }
  });

  it('derives the back header as `{sector} · {tech}`', () => {
    for (const item of payload.items) {
      expect(item.backHeader).toBe(`${item.sector.toUpperCase()} · ${item.tech.toUpperCase()}`);
    }
  });

  it('derives the modal subheading as `{client} · {sector-lowercased}`', () => {
    for (const item of payload.items) {
      expect(item.modalSubheading).toBe(`${item.client} · ${item.sector.toLowerCase()}`);
    }
  });

  it('compacts metric pairs (no empty value/label slots in the output)', () => {
    for (const item of payload.items) {
      for (const metric of item.metrics) {
        expect(metric.value.trim()).not.toBe('');
        expect(metric.label.trim()).not.toBe('');
      }
    }
  });

  it('compacts tags to a non-empty string array when present', () => {
    for (const item of payload.items) {
      for (const tag of item.tags) {
        expect(tag.trim()).not.toBe('');
      }
    }
  });

  it('exposes the section-chrome labels expected by the React island', () => {
    expect(payload.labels.fullCaseStudyCta.length).toBeGreaterThan(0);
    expect(payload.labels.backToCases.length).toBeGreaterThan(0);
    expect(payload.labels.challengeLabel.length).toBeGreaterThan(0);
    expect(payload.labels.solutionLabel.length).toBeGreaterThan(0);
    expect(payload.labels.techStackLabel.length).toBeGreaterThan(0);
    expect(payload.labels.talkToExpertCta.length).toBeGreaterThan(0);
  });
});
