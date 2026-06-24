import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@bool/analytics', () => ({
  captureError: vi.fn(),
}));

function ThrowingChild(): never {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders error fallback when a child throws', () => {
    // Suppress console.error from React and the boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    spy.mockRestore();
  });
});
