import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Captcha from './Captcha';

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({
    siteKey,
    onSuccess,
    options,
  }: {
    siteKey: string;
    onSuccess: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    options?: { theme?: string; size?: string };
  }) => (
    <div
      data-testid="turnstile"
      data-sitekey={siteKey}
      data-theme={options?.theme}
      data-size={options?.size}
      onClick={() => onSuccess('mock-token')}
    />
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Captcha', () => {
  it('renders Turnstile with correct site key', () => {
    const { getByTestId } = render(<Captcha siteKey="test-site-key" onVerify={vi.fn()} />);

    expect(getByTestId('turnstile')).toHaveAttribute('data-sitekey', 'test-site-key');
  });

  it('passes theme and size to Turnstile', () => {
    const { getByTestId } = render(
      <Captcha siteKey="test-key" onVerify={vi.fn()} theme="light" size="compact" />
    );

    expect(getByTestId('turnstile')).toHaveAttribute('data-theme', 'light');
    expect(getByTestId('turnstile')).toHaveAttribute('data-size', 'compact');
  });

  it('calls onVerify when the captcha is solved', () => {
    const onVerify = vi.fn();
    const { getByTestId } = render(<Captcha siteKey="test-key" onVerify={onVerify} />);

    getByTestId('turnstile').click();
    expect(onVerify).toHaveBeenCalledWith('mock-token');
  });
});
