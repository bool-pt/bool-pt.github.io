import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import MobileNav from './MobileNav';

const defaultProps = {
  links: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
  ] as const,
  logoSrc: '/logo.svg',
  labels: {
    open: 'Open menu',
    title: 'Navigation',
    navAria: 'Main navigation',
    linkLabels: {
      Home: 'Go to Home',
      About: 'Go to About',
      Services: 'Go to Services',
    },
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MobileNav', () => {
  it('renders hamburger button with correct aria-label', () => {
    render(<MobileNav {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('has aria-expanded="false" initially', () => {
    render(<MobileNav {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the sheet with nav links when clicked', async () => {
    const user = userEvent.setup();
    render(<MobileNav {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Open menu' });
    await user.click(button);

    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Go to About')).toBeInTheDocument();
    expect(screen.getByText('Go to Services')).toBeInTheDocument();
  });
});
