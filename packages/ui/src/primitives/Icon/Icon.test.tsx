import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Icon from './Icon';

vi.mock('./icon-data', () => ({
  iconPaths: {
    'test-stroke': {
      mode: 'stroke',
      paths: ['M1 1L10 10'],
      viewBox: '0 0 24 24',
    },
    'test-fill': {
      mode: 'fill',
      paths: ['M5 5H20V20H5Z'],
      viewBox: '0 0 24 24',
    },
  },
}));

afterEach(cleanup);

describe('Icon', () => {
  it('renders an SVG with aria-hidden="true"', () => {
    const { container } = render(<Icon name={'test-stroke' as never} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies custom size to width/height', () => {
    const { container } = render(<Icon name={'test-stroke' as never} size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('renders stroke mode with correct SVG attributes', () => {
    const { container } = render(<Icon name={'test-stroke' as never} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('renders fill mode with fill="currentColor"', () => {
    const { container } = render(<Icon name={'test-fill' as never} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
  });
});
