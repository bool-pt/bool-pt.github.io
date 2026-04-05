import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

afterEach(cleanup);

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea aria-label="notes" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies placeholder attribute', () => {
    render(<Textarea placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<Textarea aria-label="notes" className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});
