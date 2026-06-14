import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArticleModal, { type ArticleModalData, type ArticleModalLabels } from './ArticleModal';

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const labels: ArticleModalLabels = {
  close: 'Close',
  challenge: 'Challenge',
  solution: 'Solution',
  techStack: 'Tech Stack',
  talkToExpert: 'Talk to Expert',
  backToArticles: 'Back to articles',
  ctaHref: '/contacts',
};

const fullArticle: ArticleModalData = {
  category: 'Engineering',
  title: 'Building a Platform',
  subtitle: 'A deep dive into platform engineering',
  frontImage: '/images/platform.jpg',
  challenge: 'Legacy systems were fragmented',
  solution: 'Unified microservices architecture',
  benefits: 'Reduced costs and faster delivery',
  metrics: [
    { value: '50%', label: 'Cost Reduction' },
    { value: '3x', label: 'Faster Deploys' },
  ],
  techStack: ['React', 'Node.js', 'AWS'],
  readTime: '8 min',
  views: '1.2k',
};

describe('ArticleModal', () => {
  it('returns nothing when article is null', () => {
    const { container } = render(
      <ArticleModal article={null} open={true} onClose={vi.fn()} labels={labels} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders article title, category, and subtitle when open', () => {
    render(<ArticleModal article={fullArticle} open={true} onClose={vi.fn()} labels={labels} />);

    // Title appears twice: in h2 and in sr-only DialogPrimitive.Title
    expect(screen.getAllByText('Building a Platform').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    // Subtitle appears twice: in DialogPrimitive.Description (sr-only) and visible p
    expect(
      screen.getAllByText('A deep dive into platform engineering').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders challenge and solution sections', () => {
    render(<ArticleModal article={fullArticle} open={true} onClose={vi.fn()} labels={labels} />);

    expect(screen.getByText('Challenge')).toBeInTheDocument();
    expect(screen.getByText('Legacy systems were fragmented')).toBeInTheDocument();
    expect(screen.getByText('Solution')).toBeInTheDocument();
    expect(screen.getByText('Unified microservices architecture')).toBeInTheDocument();
  });

  it('renders metrics values and labels', () => {
    render(<ArticleModal article={fullArticle} open={true} onClose={vi.fn()} labels={labels} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Cost Reduction')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
    expect(screen.getByText('Faster Deploys')).toBeInTheDocument();
  });

  it('renders tech stack pills', () => {
    render(<ArticleModal article={fullArticle} open={true} onClose={vi.fn()} labels={labels} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ArticleModal article={fullArticle} open={true} onClose={onClose} labels={labels} />);

    const backButton = screen.getByRole('button', { name: /back to articles/i });
    await user.click(backButton);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
