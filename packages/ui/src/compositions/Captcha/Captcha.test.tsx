import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Captcha from './Captcha';

vi.mock('@hcaptcha/react-hcaptcha', () => ({
  default: vi.fn(({ sitekey, onVerify, theme, size }: {
    sitekey: string;
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: (err: string) => void;
    theme?: string;
    size?: string;
  }) => (
    <div
      data-testid="hcaptcha"
      data-sitekey={sitekey}
      data-theme={theme}
      data-size={size}
      onClick={() => onVerify('mock-token')}
    />
  )),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Captcha', () => {
  it('renders hCaptcha with correct sitekey', () => {
    const { getByTestId } = render(
      <Captcha siteKey="test-site-key" onVerify={vi.fn()} />,
    );

    expect(getByTestId('hcaptcha')).toHaveAttribute('data-sitekey', 'test-site-key');
  });

  it('passes theme and size to hCaptcha', () => {
    const { getByTestId } = render(
      <Captcha siteKey="test-key" onVerify={vi.fn()} theme="light" size="compact" />,
    );

    expect(getByTestId('hcaptcha')).toHaveAttribute('data-theme', 'light');
    expect(getByTestId('hcaptcha')).toHaveAttribute('data-size', 'compact');
  });

  it('calls onVerify when captcha is verified', () => {
    const onVerify = vi.fn();
    const { getByTestId } = render(
      <Captcha siteKey="test-key" onVerify={onVerify} />,
    );

    getByTestId('hcaptcha').click();
    expect(onVerify).toHaveBeenCalledWith('mock-token');
  });

  it('returns null for unsupported provider', () => {
    const { container } = render(
      <Captcha provider={'unknown' as 'hcaptcha'} siteKey="test-key" onVerify={vi.fn()} />,
    );

    expect(container.innerHTML).toBe('');
  });
});
