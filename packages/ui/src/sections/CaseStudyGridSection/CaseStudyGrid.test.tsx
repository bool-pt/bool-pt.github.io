import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CaseStudyGrid from './CaseStudyGrid';

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const cases = [
  {
    title: 'Platform Modernization',
    description: 'Rebuilt legacy platform',
    client: 'Acme Corp',
    tags: ['fintech', 'react'],
    image: '/img/acme.jpg',
    frontImage: '/img/acme-front.jpg',
    challenge: 'Outdated stack',
    solution: 'Modern microservices',
    metrics: [{ value: '40%', label: 'Faster' }],
    techStack: ['React', 'AWS'],
  },
  {
    title: 'Data Pipeline',
    description: 'Real-time analytics',
    client: 'DataCo',
    tags: ['healthtech', 'python'],
    image: '/img/dataco.jpg',
  },
];

const sectors = ['All', 'FINTECH', 'HEALTHTECH'];
const techFilters = ['REACT', 'PYTHON'];

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
  it('renders case study titles', () => {
    render(
      <CaseStudyGrid
        cases={cases}
        sectors={sectors}
        techFilters={techFilters}
        labels={labels}
      />
    );

    expect(screen.getAllByText('Platform Modernization').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Data Pipeline').length).toBeGreaterThanOrEqual(1);
  });

  it('renders filter groups', () => {
    render(
      <CaseStudyGrid
        cases={cases}
        sectors={sectors}
        techFilters={techFilters}
        labels={labels}
      />
    );

    const tablists = screen.getAllByRole('tablist');
    expect(tablists).toHaveLength(2);

    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'FINTECH' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'HEALTHTECH' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'REACT' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'PYTHON' })).toBeInTheDocument();
  });
});
