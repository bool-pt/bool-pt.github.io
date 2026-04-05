import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import GradientIcon from './GradientIcon';

vi.mock('../Icon/icon-data', () => ({
  gradientIconPaths: {
    'test-gradient': {
      viewBox: '0 0 28 28',
      groups: [
        {
          type: 'plain',
          paths: [{ d: 'M0 0H28V28H0Z', fillRule: 'evenodd', clipRule: 'evenodd' }],
        },
      ],
    },
  },
}));

afterEach(cleanup);

describe('GradientIcon', () => {
  it('renders an SVG with aria-hidden="true"', () => {
    const { container } = render(<GradientIcon name={'test-gradient' as never} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('contains a linearGradient element in defs', () => {
    const { container } = render(<GradientIcon name={'test-gradient' as never} />);
    const gradient = container.querySelector('linearGradient');
    expect(gradient).not.toBeNull();
  });
});
