import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PortfolioTestimonialsCarousel from './PortfolioTestimonialsCarousel';

vi.mock('../../lib/useSwipe', () => ({
  useSwipe: () => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const testimonials = [
  {
    quote: 'Exceptional delivery quality.',
    company: 'Acme Corp',
    designation: 'CTO',
  },
  {
    quote: 'Transformed our digital presence.',
    company: 'Beta Ltd',
    designation: 'Head of Product',
    avatar: '/avatars/beta.jpg',
  },
  {
    quote: 'Highly recommend their services.',
    company: 'Gamma SA',
    designation: 'CEO',
  },
];

const ariaLabels = { prev: 'Previous', next: 'Next' };

describe('PortfolioTestimonialsCarousel', () => {
  it('renders all testimonials with quotes and company names', () => {
    vi.useFakeTimers();
    render(
      <PortfolioTestimonialsCarousel testimonials={testimonials} ariaLabels={ariaLabels} />,
    );

    expect(screen.getByText('Exceptional delivery quality.')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Transformed our digital presence.')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.getByText('Highly recommend their services.')).toBeInTheDocument();
    expect(screen.getByText('Gamma SA')).toBeInTheDocument();
  });

  it('shows avatar fallback when no avatar provided', () => {
    vi.useFakeTimers();
    render(
      <PortfolioTestimonialsCarousel testimonials={testimonials} ariaLabels={ariaLabels} />,
    );

    // Acme Corp has no avatar, should show "A" fallback
    expect(screen.getByText('A')).toBeInTheDocument();
    // Gamma SA has no avatar, should show "G" fallback
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('shows avatar image when provided', () => {
    vi.useFakeTimers();
    render(
      <PortfolioTestimonialsCarousel testimonials={testimonials} ariaLabels={ariaLabels} />,
    );

    const avatarImg = screen.getByAltText('Beta Ltd');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', '/avatars/beta.jpg');
  });

  it('previous/next navigation buttons present', () => {
    vi.useFakeTimers();
    render(
      <PortfolioTestimonialsCarousel testimonials={testimonials} ariaLabels={ariaLabels} />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
});
