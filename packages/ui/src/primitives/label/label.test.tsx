import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Label } from './label';

afterEach(cleanup);

describe('Label', () => {
  it('renders label text', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeDefined();
  });

  it('applies htmlFor attribute', () => {
    render(<Label htmlFor="email-input">Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
  });
});
