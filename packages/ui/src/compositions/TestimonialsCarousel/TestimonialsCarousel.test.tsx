import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TestimonialsCarousel from './TestimonialsCarousel';

vi.mock('../../lib/useSwipe', () => ({
  useSwipe: () => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  }),
}));

afterEach(cleanup);

const testimonials = [
  {
    quote: 'Outstanding work on our platform.',
    company: 'Acme Corp',
    designation: 'CTO',
  },
  {
    quote: 'Delivered on time and on budget.',
    company: 'Globex Inc',
    designation: 'VP Engineering',
  },
  {
    quote: 'A truly collaborative team.',
    company: 'Initech',
    designation: 'Product Manager',
  },
];

describe('TestimonialsCarousel', () => {
  it('renders all testimonials with quotes and companies', () => {
    render(
      <TestimonialsCarousel
        testimonials={testimonials}
        prevLabel="Previous testimonial"
        nextLabel="Next testimonial"
      />
    );

    expect(screen.getByText('Outstanding work on our platform.')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Delivered on time and on budget.')).toBeInTheDocument();
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    expect(screen.getByText('A truly collaborative team.')).toBeInTheDocument();
    expect(screen.getByText('Initech')).toBeInTheDocument();
  });

  it('previous/next buttons have correct aria-labels', () => {
    render(
      <TestimonialsCarousel
        testimonials={testimonials}
        prevLabel="Previous testimonial"
        nextLabel="Next testimonial"
      />
    );

    expect(screen.getByRole('button', { name: 'Previous testimonial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next testimonial' })).toBeInTheDocument();
  });

  it('clicking next advances the carousel', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TestimonialsCarousel
        testimonials={testimonials}
        prevLabel="Previous testimonial"
        nextLabel="Next testimonial"
      />
    );

    const track = container.querySelector('[class*="track"]') as HTMLElement;
    const initialOffset = track.style.getPropertyValue('--slide-offset');

    await user.click(screen.getByRole('button', { name: 'Next testimonial' }));

    const newOffset = track.style.getPropertyValue('--slide-offset');
    expect(newOffset).not.toBe(initialOffset);
    expect(newOffset).toBe('100%');
  });
});
