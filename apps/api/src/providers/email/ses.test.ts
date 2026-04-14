import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SesEmailProvider } from './ses.ts';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: class {
    send = mockSend;
  },
  SendEmailCommand: class {
    constructor(params: unknown) {
      Object.assign(this, params);
    }
  },
}));

describe('SesEmailProvider', () => {
  const provider = new SesEmailProvider();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends email with correct parameters', async () => {
    mockSend.mockResolvedValue({});

    await provider.send({
      to: 'recipient@example.com',
      from: 'sender@bool.pt',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      replyTo: 'reply@example.com',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        FromEmailAddress: 'sender@bool.pt',
        Destination: { ToAddresses: ['recipient@example.com'] },
        ReplyToAddresses: ['reply@example.com'],
        Content: {
          Simple: {
            Subject: { Data: 'Test Subject', Charset: 'UTF-8' },
            Body: { Html: { Data: '<p>Hello</p>', Charset: 'UTF-8' } },
          },
        },
      })
    );
  });

  it('omits replyTo when not provided', async () => {
    mockSend.mockResolvedValue({});

    await provider.send({
      to: 'recipient@example.com',
      from: 'sender@bool.pt',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        ReplyToAddresses: undefined,
      })
    );
  });

  it('propagates AWS errors', async () => {
    mockSend.mockRejectedValue(new Error('SES rate limit'));

    await expect(
      provider.send({
        to: 'recipient@example.com',
        from: 'sender@bool.pt',
        subject: 'Test',
        html: '<p>Hi</p>',
      })
    ).rejects.toThrow('SES rate limit');
  });
});
