import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNewsletterStore } from '../../providers/newsletter/index.ts';
import { createSubscriptionStore } from '../../providers/subscriptions/index.ts';
import { handler } from '../unsubscribe.ts';

vi.mock('../../providers/newsletter/index.ts', () => ({
  createNewsletterStore: vi.fn(),
}));
vi.mock('../../providers/subscriptions/index.ts', () => ({
  createSubscriptionStore: vi.fn(),
}));

function makeEvent(body: unknown, origin = 'https://bool.pt'): APIGatewayProxyEventV2 {
  return {
    body: JSON.stringify(body),
    headers: { origin },
    requestContext: { http: { sourceIp: '127.0.0.1' } },
  } as unknown as APIGatewayProxyEventV2;
}

describe('unsubscribe handler', () => {
  const mockUnsubscribe = vi.fn();
  const mockRemoveNewsletter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createNewsletterStore).mockReturnValue({
      subscribe: vi.fn(),
      unsubscribe: mockUnsubscribe,
      delete: vi.fn(),
    });
    vi.mocked(createSubscriptionStore).mockReturnValue({
      recordNewsletter: vi.fn(),
      recordContact: vi.fn(),
      removeNewsletter: mockRemoveNewsletter,
      removeContact: vi.fn(),
    });
  });

  it('returns 200 on valid unsubscribe', async () => {
    mockUnsubscribe.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({ email: 'test@example.com' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 200 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({ success: true });
    expect(mockUnsubscribe).toHaveBeenCalledWith('test@example.com');
    expect(mockRemoveNewsletter).toHaveBeenCalledWith('test@example.com');
  });

  it('still returns 200 when sheet removal fails', async () => {
    mockUnsubscribe.mockResolvedValue(undefined);
    mockRemoveNewsletter.mockRejectedValueOnce(new Error('Sheets down'));

    const result = await handler(
      makeEvent({ email: 'test@example.com' }),
      {} as never,
      {} as never
    );

    expect(result).toMatchObject({ statusCode: 200 });
  });

  it('returns 400 on invalid email', async () => {
    const result = await handler(makeEvent({ email: 'not-valid' }), {} as never, {} as never);

    expect(result).toMatchObject({ statusCode: 400 });
    expect(mockUnsubscribe).not.toHaveBeenCalled();
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

  it('returns 500 when provider throws', async () => {
    mockUnsubscribe.mockRejectedValue(new Error('AWS error'));

    const result = await handler(
      makeEvent({ email: 'test@example.com' }),
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
