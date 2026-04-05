import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCaptchaProvider } from '../../providers/captcha/index.ts';
import { createNewsletterStore } from '../../providers/newsletter/index.ts';
import { handler } from '../newsletter.ts';

vi.mock('../../providers/captcha/index.ts', () => ({
  createCaptchaProvider: vi.fn(),
}));
vi.mock('../../providers/newsletter/index.ts', () => ({
  createNewsletterStore: vi.fn(),
}));
vi.mock('../../config.ts', () => ({
  getConfig: () => ({
    hcaptchaSecret: 'test-secret',
    sesFromEmail: 'from@bool.pt',
    sesNotifyEmail: 'notify@bool.pt',
    sesContactList: 'test-list',
    corsAllowedOrigin: 'https://bool.pt',
  }),
}));

function makeEvent(body: unknown, origin = 'https://bool.pt'): APIGatewayProxyEventV2 {
  return {
    body: JSON.stringify(body),
    headers: { origin },
    requestContext: { http: { sourceIp: '127.0.0.1' } },
  } as unknown as APIGatewayProxyEventV2;
}

describe('newsletter handler', () => {
  const mockVerify = vi.fn();
  const mockSubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCaptchaProvider).mockReturnValue({ verify: mockVerify });
    vi.mocked(createNewsletterStore).mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
      delete: vi.fn(),
    });
  });

  it('returns 200 on valid subscription', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSubscribe.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({ email: 'user@example.com', captchaToken: 'valid-token' }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 200 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({ success: true });
    expect(mockSubscribe).toHaveBeenCalledWith('user@example.com');
  });

  it('returns 400 on invalid email', async () => {
    const result = await handler(
      makeEvent({ email: 'not-an-email', captchaToken: 'token' }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 400 });
  });

  it('returns 403 on failed captcha', async () => {
    mockVerify.mockResolvedValue({ success: false });

    const result = await handler(
      makeEvent({ email: 'user@example.com', captchaToken: 'bad-token' }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 403 });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
