import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCaptchaProvider } from '../../providers/captcha/index.ts';
import { createEmailProvider } from '../../providers/email/index.ts';
import { createSubscriptionStore } from '../../providers/subscriptions/index.ts';
import { handler } from '../contact.ts';

vi.mock('../../providers/captcha/index.ts', () => ({
  createCaptchaProvider: vi.fn(),
}));
vi.mock('../../providers/email/index.ts', () => ({
  createEmailProvider: vi.fn(),
}));
vi.mock('../../providers/subscriptions/index.ts', () => ({
  createSubscriptionStore: vi.fn(),
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

describe('contact handler', () => {
  const mockVerify = vi.fn();
  const mockSend = vi.fn();
  const mockRecordContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCaptchaProvider).mockReturnValue({ verify: mockVerify });
    vi.mocked(createEmailProvider).mockReturnValue({ send: mockSend });
    vi.mocked(createSubscriptionStore).mockReturnValue({
      recordNewsletter: vi.fn(),
      recordContact: mockRecordContact,
      removeNewsletter: vi.fn(),
      removeContact: vi.fn(),
    });
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
      {} as never
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
      })
    );
    expect(mockRecordContact).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
      })
    );
  });

  it('still returns 200 when sheet write fails', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(undefined);
    mockRecordContact.mockRejectedValueOnce(new Error('Sheets down'));

    const result = await handler(
      makeEvent({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
        captchaToken: 'valid-token',
      }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 200 });
  });

  it('escapes HTML in email body and subject', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(undefined);

    await handler(
      makeEvent({
        name: '<script>alert("xss")</script>',
        email: 'attacker@example.com',
        message: 'Hello <img src=x onerror="steal()">',
        captchaToken: 'valid-token',
      }),
      {} as never,
      {} as never
    );

    const sentEmail = mockSend.mock.calls[0]?.[0] as { html: string; subject: string };
    expect(sentEmail.html).toContain('&lt;script&gt;');
    expect(sentEmail.html).not.toContain('<script>');
    expect(sentEmail.html).toContain('&lt;img src=x onerror=');
    expect(sentEmail.html).not.toContain('<img');
    expect(sentEmail.subject).toContain('&lt;script&gt;');
    expect(sentEmail.subject).not.toContain('<script>');
  });

  it('returns 400 on missing fields', async () => {
    const result = await handler(makeEvent({ name: 'J', email: 'bad' }), {} as never, {} as never);

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
      {} as never
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

  it('returns 500 when email provider throws', async () => {
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockRejectedValue(new Error('SES failure'));

    const result = await handler(
      makeEvent({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
        captchaToken: 'valid-token',
      }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 500 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({
      success: false,
      error: 'Internal server error',
    });
  });

  it('returns 500 when captcha provider throws', async () => {
    mockVerify.mockRejectedValue(new Error('Network error'));

    const result = await handler(
      makeEvent({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message.',
        captchaToken: 'valid-token',
      }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 500 });
  });
});
