import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import LanguageSelect from './LanguageSelect';

vi.mock('../../lib/locale', () => ({
  setStoredLocale: vi.fn(),
  buildLocalizedPath: vi.fn(() => '/pt'),
}));

vi.mock('./flags', () => ({
  Flag: ({ code }: { code: string }) => <span data-testid={`flag-${code}`} />,
}));

vi.mock('../../primitives/Icon/lucide', () => ({
  Check: () => <span data-testid="check-icon" />,
}));

const locales = [
  { code: 'en', flag: 'gb', name: 'English' },
  { code: 'pt', flag: 'pt', name: 'Português' },
];

const defaultProps = {
  currentLocale: 'en',
  defaultLocale: 'en',
  locales,
  ariaLabel: 'Select language',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LanguageSelect', () => {
  it('renders trigger button with aria-label', () => {
    render(<LanguageSelect {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Select language' })).toBeInTheDocument();
  });

  it('shows current locale flag', () => {
    render(<LanguageSelect {...defaultProps} />);

    expect(screen.getByTestId('flag-en')).toBeInTheDocument();
  });
});
