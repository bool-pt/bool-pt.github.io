import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KnowledgeGrid from './KnowledgeGrid';

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const articles = [
  {
    category: 'Engineering',
    title: 'Scaling Microservices',
    author: 'Jane Doe',
    readTime: '6 min',
    views: '2.4k',
    href: '/blog/scaling-microservices',
    tags: ['engineering', 'backend'],
    frontImage: '/img/micro.jpg',
    subtitle: 'Lessons learned at scale',
  },
  {
    category: 'Design',
    title: 'Design Systems 101',
    author: 'John Smith',
    readTime: '4 min',
    href: '/blog/design-systems',
    tags: ['design', 'frontend'],
  },
];

const filters = ['All', 'ENGINEERING', 'DESIGN'];

const labels = {
  close: 'Close',
  readArticle: 'Read Article',
  readTime: 'Read time',
  views: 'Views',
  emptyMessage: 'No articles found',
  filterAriaLabel: 'Filter articles',
  challenge: 'Challenge',
  solution: 'Solution',
  techStack: 'Tech Stack',
  talkToExpert: 'Talk to Expert',
  backToArticles: 'Back to articles',
  ctaHref: '/contacts',
};

describe('KnowledgeGrid', () => {
  it('renders article titles', () => {
    render(
      <KnowledgeGrid articles={articles} filters={filters} labels={labels} />
    );

    expect(screen.getAllByText('Scaling Microservices').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Design Systems 101').length).toBeGreaterThanOrEqual(1);
  });

  it('renders filter tabs', () => {
    render(
      <KnowledgeGrid articles={articles} filters={filters} labels={labels} />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'ENGINEERING' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'DESIGN' })).toBeInTheDocument();
  });
});
