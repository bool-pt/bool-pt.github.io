import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
  it('renders a button with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('renders as a child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Click</a>
      </Button>
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'Click' })).toBeDefined();
  });

  it('forwards onClick handler', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Press</Button>);
    await user.click(screen.getByRole('button', { name: 'Press' }));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
