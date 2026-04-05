import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import HeroCarousel from './HeroCarousel';

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

const slides = [
  {
    title: 'First Slide',
    subtitle: 'First subtitle',
    ctas: {
      primary: { label: 'Get Started', href: '/start' },
      secondary: { label: 'Learn More', href: '/learn' },
    },
  },
  {
    title: 'Second Slide',
    subtitle: 'Second subtitle',
    ctas: {
      primary: { label: 'Contact Us', href: '/contact' },
      secondary: { label: 'About', href: '/about' },
    },
  },
  {
    title: 'Third Slide',
    subtitle: 'Third subtitle',
    ctas: {
      primary: { label: 'Sign Up', href: '/signup' },
      secondary: { label: 'Pricing', href: '/pricing' },
    },
  },
];

const ariaLabels = { slideIndicators: 'Slide indicators', slide: 'Slide' };

describe('HeroCarousel', () => {
  it('renders all slides with correct titles', () => {
    vi.useFakeTimers();
    render(
      <HeroCarousel slides={slides} backgroundImage="/hero.jpg" ariaLabels={ariaLabels} />,
    );

    expect(screen.getByText('First Slide')).toBeInTheDocument();
    expect(screen.getByText('Second Slide')).toBeInTheDocument();
    expect(screen.getByText('Third Slide')).toBeInTheDocument();
  });

  it('renders dot indicators matching slide count', () => {
    vi.useFakeTimers();
    render(
      <HeroCarousel slides={slides} backgroundImage="/hero.jpg" ariaLabels={ariaLabels} />,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(slides.length);
  });

  it('clicking a dot changes active slide', () => {
    vi.useFakeTimers();
    render(
      <HeroCarousel slides={slides} backgroundImage="/hero.jpg" ariaLabels={ariaLabels} />,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    act(() => {
      tabs[1].click();
    });

    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('renders CTA links with correct hrefs', () => {
    vi.useFakeTimers();
    render(
      <HeroCarousel slides={slides} backgroundImage="/hero.jpg" ariaLabels={ariaLabels} />,
    );

    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/start');
    expect(screen.getByRole('link', { name: 'Learn More' })).toHaveAttribute('href', '/learn');
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
  });

  it('has carousel aria-roledescription', () => {
    vi.useFakeTimers();
    render(
      <HeroCarousel slides={slides} backgroundImage="/hero.jpg" ariaLabels={ariaLabels} />,
    );

    const carousel = document.querySelector('[aria-roledescription="carousel"]');
    expect(carousel).toBeInTheDocument();
  });
});
