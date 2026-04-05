import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ThemeToggle from './ThemeToggle';

const mockGetTheme = vi.fn(() => 'light');
const mockSetTheme = vi.fn();

vi.mock('../../lib/theme', () => ({
  getTheme: (...args: unknown[]) => mockGetTheme(...args),
  setTheme: (...args: unknown[]) => mockSetTheme(...args),
}));

const defaultProps = {
  switchToLightLabel: 'Switch to light mode',
  switchToDarkLabel: 'Switch to dark mode',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockGetTheme.mockReturnValue('light');
});

describe('ThemeToggle', () => {
  it('renders button with switchToDarkLabel when theme is light', () => {
    mockGetTheme.mockReturnValue('light');
    render(<ThemeToggle {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });

  it('calls setTheme("dark") when clicked in light mode', async () => {
    const user = userEvent.setup();
    mockGetTheme.mockReturnValue('light');
    render(<ThemeToggle {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Switch to dark mode' });
    await user.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('renders button with switchToLightLabel when theme is dark', () => {
    mockGetTheme.mockReturnValue('dark');
    render(<ThemeToggle {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });
});
