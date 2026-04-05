import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Separator } from './separator';

afterEach(cleanup);

describe('Separator', () => {
  it('renders with default horizontal orientation', () => {
    render(<Separator decorative={false} />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('applies custom className', () => {
    render(<Separator decorative={false} className="custom-class" />);
    expect(screen.getByRole('separator').className).toContain('custom-class');
  });
});
