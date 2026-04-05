import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewsGrid from './NewsGrid';

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const items = [
  {
    category: 'Company',
    date: '2026-03-15',
    title: 'Bool Expands to Berlin',
    summary: 'New office opens in Kreuzberg',
    href: '/news/berlin-office',
    tags: ['company'],
    image: '/img/berlin.jpg',
  },
  {
    category: 'Tech',
    date: '2026-02-28',
    title: 'Open Source Release',
    summary: 'We released our design system',
    href: '/news/open-source',
    tags: ['tech'],
  },
];

const filters = ['All', 'COMPANY', 'TECH'];

const labels = {
  readMore: 'Read more',
  emptyMessage: 'No news found',
  filterAriaLabel: 'Filter news',
};

describe('NewsGrid', () => {
  it('renders news item titles and summaries', () => {
    render(<NewsGrid items={items} filters={filters} labels={labels} />);

    expect(screen.getByText('Bool Expands to Berlin')).toBeInTheDocument();
    expect(screen.getByText('New office opens in Kreuzberg')).toBeInTheDocument();
    expect(screen.getByText('Open Source Release')).toBeInTheDocument();
    expect(screen.getByText('We released our design system')).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    render(<NewsGrid items={items} filters={filters} labels={labels} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'COMPANY' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TECH' })).toBeInTheDocument();
  });

  it('links items to correct hrefs', () => {
    render(<NewsGrid items={items} filters={filters} labels={labels} />);

    const berlinLink = screen.getByRole('link', { name: /Bool Expands to Berlin/i });
    expect(berlinLink).toHaveAttribute('href', '/news/berlin-office');

    const ossLink = screen.getByRole('link', { name: /Open Source Release/i });
    expect(ossLink).toHaveAttribute('href', '/news/open-source');
  });
});
