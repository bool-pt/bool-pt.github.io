import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Skeleton,
  SkeletonText,
  SkeletonHeading,
  SkeletonField,
  SkeletonSection,
} from './Skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="custom" />);
    expect(container.firstElementChild?.className).toContain('custom');
  });

  it('applies dark variant class', () => {
    const { container } = render(<Skeleton variant="dark" />);
    expect(container.firstElementChild?.className).toContain('dark');
  });
});

describe('Skeleton presets', () => {
  it('SkeletonText renders', () => {
    const { container } = render(<SkeletonText />);
    expect(container.firstElementChild).toBeTruthy();
  });

  it('SkeletonHeading renders', () => {
    const { container } = render(<SkeletonHeading />);
    expect(container.firstElementChild).toBeTruthy();
  });

  it('SkeletonField renders key label + input skeletons', () => {
    const { container } = render(<SkeletonField />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(1);
  });
});

describe('SkeletonSection', () => {
  it('renders with configurable field and group counts', () => {
    const { container } = render(<SkeletonSection fieldCount={3} groupCount={1} />);
    expect(container.firstElementChild).toBeTruthy();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(3);
  });
});
