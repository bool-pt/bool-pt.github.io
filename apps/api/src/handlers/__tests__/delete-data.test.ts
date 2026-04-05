import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNewsletterStore } from '../../providers/newsletter/index.ts';
import { handler } from '../delete-data.ts';

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

describe('delete-data handler (GDPR erasure)', () => {
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createNewsletterStore).mockReturnValue({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      delete: mockDelete,
    });
  });

  it('returns 200 and deletes data for valid email', async () => {
    mockDelete.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent({ email: 'user@example.com' }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 200 });
    expect(mockDelete).toHaveBeenCalledWith('user@example.com');
  });

  it('returns 400 on invalid email', async () => {
    const result = await handler(
      makeEvent({ email: 'bad' }),
      {} as never,
      {} as never,
    );

    expect(result).toMatchObject({ statusCode: 400 });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
