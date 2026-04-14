import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateToken } from '../../lib/token.ts';
import { createNewsletterStore } from '../../providers/newsletter/index.ts';
import { handler } from '../newsletter-confirm.ts';

vi.mock('../../providers/newsletter/index.ts', () => ({
  createNewsletterStore: vi.fn(),
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

function makeEvent(token?: string): APIGatewayProxyEventV2 {
  return {
    queryStringParameters: token ? { token } : undefined,
    headers: {},
    requestContext: { http: { sourceIp: '127.0.0.1' } },
  } as unknown as APIGatewayProxyEventV2;
}

describe('newsletter-confirm handler', () => {
  const mockSubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createNewsletterStore).mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
      delete: vi.fn(),
    });
  });

  it('subscribes and redirects to success on valid token', async () => {
    mockSubscribe.mockResolvedValue(undefined);
    const token = generateToken('user@example.com', 'test-newsletter-secret');

    const result = (await handler(
      makeEvent(token),
      {} as never,
      {} as never
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(302);
    expect(result.headers?.['Location']).toBe('https://bool.pt/newsletter/confirmed');
    expect(mockSubscribe).toHaveBeenCalledWith('user@example.com');
  });

  it('redirects to error when token is missing', async () => {
    const result = (await handler(
      makeEvent(),
      {} as never,
      {} as never
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(302);
    expect(result.headers?.['Location']).toBe('https://bool.pt/newsletter/error');
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('redirects to error when token is invalid', async () => {
    const result = (await handler(
      makeEvent('garbage-token'),
      {} as never,
      {} as never
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(302);
    expect(result.headers?.['Location']).toBe('https://bool.pt/newsletter/error');
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('redirects to error when token is expired', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const token = generateToken('user@example.com', 'test-newsletter-secret', 1000);

    vi.setSystemTime(new Date('2025-01-01T00:00:02Z'));
    const result = (await handler(
      makeEvent(token),
      {} as never,
      {} as never
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(302);
    expect(result.headers?.['Location']).toBe('https://bool.pt/newsletter/error');
    expect(mockSubscribe).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('redirects to error when subscribe throws', async () => {
    mockSubscribe.mockRejectedValue(new Error('AWS error'));
    const token = generateToken('user@example.com', 'test-newsletter-secret');

    const result = (await handler(
      makeEvent(token),
      {} as never,
      {} as never
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(302);
    expect(result.headers?.['Location']).toBe('https://bool.pt/newsletter/error');
  });
});
