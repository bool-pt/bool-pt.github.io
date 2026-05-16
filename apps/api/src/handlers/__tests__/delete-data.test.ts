import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNewsletterStore } from '../../providers/newsletter/index.ts';
import { createSubscriptionStore } from '../../providers/subscriptions/index.ts';
import { handler } from '../delete-data.ts';

vi.mock('../../providers/newsletter/index.ts', () => ({
  createNewsletterStore: vi.fn(),
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

describe('delete-data handler (GDPR erasure)', () => {
  const mockDelete = vi.fn();
  const mockRemoveNewsletter = vi.fn();
  const mockRemoveContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createNewsletterStore).mockReturnValue({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      delete: mockDelete,
    });
    vi.mocked(createSubscriptionStore).mockReturnValue({
      recordNewsletter: vi.fn(),
      recordContact: vi.fn(),
      removeNewsletter: mockRemoveNewsletter,
      removeContact: mockRemoveContact,
    });
  });

  it('returns 200 and deletes data for valid email', async () => {
    mockDelete.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({ email: 'user@example.com' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 200 });
    expect(mockDelete).toHaveBeenCalledWith('user@example.com');
    expect(mockRemoveNewsletter).toHaveBeenCalledWith('user@example.com');
    expect(mockRemoveContact).toHaveBeenCalledWith('user@example.com');
  });

  it('still returns 200 when sheet removal fails', async () => {
    mockDelete.mockResolvedValue(undefined);
    mockRemoveNewsletter.mockRejectedValueOnce(new Error('Sheets down'));

    const result = await handler(
      makeEvent({ email: 'user@example.com' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 200 });
  });

  it('returns 400 on invalid email', async () => {
    const result = await handler(makeEvent({ email: 'bad' }), {} as never, {} as never);

    expect(result).toMatchObject({ statusCode: 400 });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('returns 500 when delete throws', async () => {
    mockDelete.mockRejectedValue(new Error('AWS error'));

    const result = await handler(
      makeEvent({ email: 'user@example.com' }),
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
