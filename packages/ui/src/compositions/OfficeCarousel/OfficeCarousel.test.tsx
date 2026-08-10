import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import OfficeCarousel from './OfficeCarousel';

vi.mock('../../lib/useSwipe', () => ({
  useSwipe: () => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  }),
}));

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const offices = [
  {
    city: 'Lisbon',
    building: 'Tower A',
    address: 'Rua Augusta 100',
    image: '/lisbon.jpg',
  },
  {
    city: 'Porto',
    building: 'Hub Central',
    address: 'Av. dos Aliados 50',
    image: '/porto.jpg',
  },
  {
    city: 'London',
    building: 'Tech House',
    address: '10 Downing St',
    image: '/london.jpg',
  },
];

const ariaLabels = { prev: 'Previous office', next: 'Next office', imageAlt: 'office' };

describe('OfficeCarousel', () => {
  it('renders all office cards with city names', () => {
    vi.useFakeTimers();
    render(<OfficeCarousel offices={offices} ariaLabels={ariaLabels} />);

    expect(screen.getByText('Lisbon')).toBeInTheDocument();
    expect(screen.getByText('Porto')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('previous/next buttons have correct aria-labels', () => {
    vi.useFakeTimers();
    render(<OfficeCarousel offices={offices} navPosition="top-right" ariaLabels={ariaLabels} />);

    expect(screen.getByRole('button', { name: 'Previous office' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next office' })).toBeInTheDocument();
  });

  it('renders images with alt text', () => {
    vi.useFakeTimers();
    render(<OfficeCarousel offices={offices} ariaLabels={ariaLabels} />);

    expect(screen.getByAltText('Lisbon office')).toBeInTheDocument();
    expect(screen.getByAltText('Porto office')).toBeInTheDocument();
    expect(screen.getByAltText('London office')).toBeInTheDocument();
  });

  it('shows building name and address in overlay', () => {
    vi.useFakeTimers();
    render(<OfficeCarousel offices={offices} ariaLabels={ariaLabels} />);

    expect(screen.getByText('Tower A')).toBeInTheDocument();
    expect(screen.getByText('Rua Augusta 100')).toBeInTheDocument();
    expect(screen.getByText('Hub Central')).toBeInTheDocument();
    expect(screen.getByText('Av. dos Aliados 50')).toBeInTheDocument();
  });

  it('disables the arrows at the bounds so the track never scrolls past the last card', () => {
    vi.useFakeTimers();
    render(<OfficeCarousel offices={offices} navPosition="top-right" ariaLabels={ariaLabels} />);

    const prev = screen.getByRole('button', { name: 'Previous office' });
    const next = screen.getByRole('button', { name: 'Next office' });

    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    // Advance to the last reachable index.
    act(() => {
      fireEvent.click(next);
      fireEvent.click(next);
    });

    expect(next).toBeDisabled();
    expect(prev).toBeEnabled();

    // Further clicks must not move the track further.
    const trackTransform = document.querySelector('[style*="translateX"]')?.getAttribute('style');
    act(() => {
      fireEvent.click(next);
    });
    expect(document.querySelector('[style*="translateX"]')?.getAttribute('style')).toBe(
      trackTransform
    );
  });
});
