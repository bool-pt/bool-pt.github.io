import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HCaptchaProvider } from '../captcha/hcaptcha.ts';

describe('HCaptchaProvider', () => {
  const provider = new HCaptchaProvider('test-secret');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success when hCaptcha verifies the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );

    const result = await provider.verify('valid-token', '127.0.0.1');
    expect(result).toEqual({ success: true });

    const call = vi.mocked(fetch).mock.calls[0];
    const [url, init] = call ?? [];
    expect(url).toBe('https://api.hcaptcha.com/siteverify');
    expect(init?.method).toBe('POST');
    expect(init?.body).toContain('secret=test-secret');
    expect(init?.body).toContain('response=valid-token');
    expect(init?.body).toContain('remoteip=127.0.0.1');
  });

  it('returns failure when hCaptcha rejects the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      }),
    );

    const result = await provider.verify('bad-token');
    expect(result).toEqual({ success: false });
  });

  it('throws when hCaptcha API returns non-OK status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(provider.verify('token')).rejects.toThrow('status 500');
  });
});
