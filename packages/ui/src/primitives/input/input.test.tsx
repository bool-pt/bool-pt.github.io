import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Input } from './input';

afterEach(cleanup);

describe('Input', () => {
  it('renders with the correct type', () => {
    render(<Input type="email" aria-label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('type', 'email');
  });

  it('accepts and applies a placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  it('forwards className', () => {
    render(<Input className="custom-class" aria-label="Test" />);
    expect(screen.getByRole('textbox', { name: 'Test' }).className).toContain('custom-class');
  });
});
