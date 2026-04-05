import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCaptchaProvider } from '../../providers/captcha/index.ts';
import { createEmailProvider } from '../../providers/email/index.ts';
import { handler } from '../contact.ts';

vi.mock('../../providers/captcha/index.ts', () => ({
  createCaptchaProvider: vi.fn(),
}));
vi.mock('../../providers/email/index.ts', () => ({
  createEmailProvider: vi.fn(),
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

describe('contact handler', () => {
  const mockVerify = vi.fn();
  const mockSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCaptchaProvider).mockReturnValue({ verify: mockVerify });
    vi.mocked(createEmailProvider).mockReturnValue({ send: mockSend });
  });

  it('returns 200 on valid submission', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
        captchaToken: 'valid-token',
      }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 200 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({ success: true });
    expect(mockVerify).toHaveBeenCalledWith('valid-token', '127.0.0.1');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'notify@bool.pt',
        from: 'from@bool.pt',
        replyTo: 'john@example.com',
        subject: 'Contact form: John Doe',
      }),
    );
  });

  it('returns 400 on missing fields', async () => {
    const result = await handler(
      makeEvent({ name: 'J', email: 'bad' }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 400 });
    expect(JSON.parse((result as { body: string }).body).success).toBe(false);
  });

  it('returns 403 on failed captcha', async () => {
    mockVerify.mockResolvedValue({ success: false });

    const result = await handler(
      makeEvent({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
        captchaToken: 'invalid-token',
      }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 403 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 400 on missing body', async () => {
    const event = {
      body: undefined,
      headers: { origin: 'https://bool.pt' },
      requestContext: { http: { sourceIp: '127.0.0.1' } },
    } as unknown as APIGatewayProxyEventV2;

    const result = await handler(event, {} as never, {} as never);
    expect(result).toMatchObject({ statusCode: 400 });
  });
});
