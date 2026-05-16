import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCaptchaProvider } from '../../providers/captcha/index.ts';
import { createEmailProvider } from '../../providers/email/index.ts';
import { handler } from '../newsletter.ts';

vi.mock('../../providers/captcha/index.ts', () => ({
  createCaptchaProvider: vi.fn(),
}));
vi.mock('../../providers/email/index.ts', () => ({
  createEmailProvider: vi.fn(),
}));
vi.mock('../../config.ts', () => ({
  getConfig: () => ({
    hcaptchaSecret: 'test-secret',
    newsletterTokenSecret: 'test-newsletter-secret',
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
  const mockSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCaptchaProvider).mockReturnValue({ verify: mockVerify });
    vi.mocked(createEmailProvider).mockReturnValue({ send: mockSend });
  });

  it('sends confirmation email on valid submission', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({ name: 'John Doe', email: 'user@example.com', captchaToken: 'valid-token' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 200 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'from@bool.pt',
        subject: 'Confirm your Bool newsletter subscription',
      })
    );
  });

  it('includes confirmation link in email html', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(undefined);

    await handler(
      makeEvent({ name: 'John Doe', email: 'user@example.com', captchaToken: 'valid-token' }),
      {} as never,
      {} as never
    );

    const sentEmail = mockSend.mock.calls[0]?.[0] as { html: string };
    expect(sentEmail.html).toContain('https://bool.pt/newsletter/confirm?token=');
    expect(sentEmail.html).toContain('Confirm subscription');
  });

  it('returns 400 on invalid email', async () => {
    const result = await handler(
      makeEvent({ name: 'John Doe', email: 'not-an-email', captchaToken: 'token' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 400 });
  });

  it('returns 403 on failed captcha', async () => {
    mockVerify.mockResolvedValue({ success: false });

    const result = await handler(
      makeEvent({ name: 'John Doe', email: 'user@example.com', captchaToken: 'bad-token' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 403 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 500 when email provider throws', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockRejectedValue(new Error('SES failure'));

    const result = await handler(
      makeEvent({ name: 'John Doe', email: 'user@example.com', captchaToken: 'valid-token' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 500 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({
      success: false,
      error: 'Internal server error',
    });
  });
});
