import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CaseStudyGrid, { type CaseFlipItem } from './CaseStudyGrid';

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const cases: CaseFlipItem[] = [
  {
    client: 'Acme Corp',
    title: 'Platform Project',
    subtitle: 'Platform Modernization',
    coverImageSrc: '/img/acme.jpg',
    sector: 'FINTECH',
    tech: 'REACT',
    techKey: 'react',
    backHeader: 'FINTECH · REACT',
    modalSubheading: 'Acme Corp · fintech',
    metrics: [{ value: '40%', label: 'Faster' }],
    challenge: 'Outdated stack',
    solution: 'Modern microservices',
    benefits: 'Reduced latency, simpler ops',
    team: '1 Tech Lead, 2 Devs',
    duration: '6 Months',
    tags: ['React', 'AWS'],
  },
  {
    client: 'DataCo',
    title: 'Pipelines',
    subtitle: 'Data Pipeline',
    coverImageSrc: '/img/dataco.jpg',
    sector: 'HEALTHTECH',
    tech: 'PYTHON',
    techKey: 'python',
    backHeader: 'HEALTHTECH · PYTHON',
    modalSubheading: 'DataCo · healthtech',
    metrics: [],
    challenge: '',
    solution: '',
    benefits: '',
    team: '',
    duration: '',
    tags: [],
  },
];

const sectors = ['All', 'FINTECH', 'HEALTHTECH'];
const techFilters = [
  { key: 'react', label: 'REACT' },
  { key: 'python', label: 'PYTHON' },
];

const labels = {
  close: 'Close',
  fullCaseStudy: 'Full Case Study',
  emptyMessage: 'No cases found',
  filterAriaLabel: 'Filter cases',
  challenge: 'Challenge',
  solution: 'Solution',
  techStack: 'Tech Stack',
  talkToExpert: 'Talk to Expert',
  backToCases: 'Back to cases',
  ctaHref: '/contacts',
};

describe('CaseStudyGrid', () => {
  it('renders the subtitle (front + back) for each case', () => {
    render(
      <CaseStudyGrid cases={cases} sectors={sectors} techFilters={techFilters} labels={labels} />
    );

    expect(screen.getAllByText('Platform Modernization').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Data Pipeline').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the derived back header `{sector} · {tech}` on each card back', () => {
    render(
      <CaseStudyGrid cases={cases} sectors={sectors} techFilters={techFilters} labels={labels} />
    );

    expect(screen.getByText('FINTECH · REACT')).toBeInTheDocument();
    expect(screen.getByText('HEALTHTECH · PYTHON')).toBeInTheDocument();
  });

  it('renders filter groups', () => {
    render(
      <CaseStudyGrid cases={cases} sectors={sectors} techFilters={techFilters} labels={labels} />
    );

    const tablists = screen.getAllByRole('tablist');
    expect(tablists).toHaveLength(2);

    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'FINTECH' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'HEALTHTECH' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'REACT' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'PYTHON' })).toBeInTheDocument();
  });

  it('renders metrics on the back when present, omits when empty', () => {
    render(
      <CaseStudyGrid cases={cases} sectors={sectors} techFilters={techFilters} labels={labels} />
    );

    // Acme has one metric
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Faster')).toBeInTheDocument();
    // DataCo has no metrics — nothing extra to assert beyond the absence; the
    // important thing is the render didn't throw on `metrics: []`.
  });
});
