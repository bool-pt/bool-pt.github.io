import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitContactForm } from './contact';
import { submitEventSchedule } from './event';
import { submitNewsletter } from './newsletter';

type FetchMock = ReturnType<typeof vi.fn>;

function lastRequest(mockFetch: FetchMock) {
  const [url, init] = mockFetch.mock.calls.at(-1) as [string, RequestInit];
  return { url, body: JSON.parse(init.body as string) as Record<string, unknown> };
}

let mockFetch: FetchMock;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv('PUBLIC_API_BASE_URL', 'https://api.example.com');
  mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ message: 'ok' }),
  });
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('submitContactForm', () => {
  it('POSTs to /contact with the documented snake_case body', async () => {
    await submitContactForm({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
      turnstileToken: 'tok-123',
    });

    const { url, body } = lastRequest(mockFetch);
    expect(url).toBe('https://api.example.com/contact');
    expect(body).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
      turnstile_token: 'tok-123',
    });
  });

  it('folds the optional phone into the message (the /contact body has no phone field)', async () => {
    await submitContactForm({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+351 912 345 678',
      message: 'Hello there.',
      turnstileToken: 'tok-123',
    });

    const { body } = lastRequest(mockFetch);
    expect(body).not.toHaveProperty('phone');
    expect(body.message).toBe('Hello there.\n\nPhone: +351 912 345 678');
  });
});

describe('submitNewsletter', () => {
  it('POSTs to /subscribe with name, email and turnstile_token', async () => {
    await submitNewsletter({
      name: 'Jane Doe',
      email: 'jane@example.com',
      turnstileToken: 'tok-456',
    });

    const { url, body } = lastRequest(mockFetch);
    expect(url).toBe('https://api.example.com/subscribe');
    expect(body).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      turnstile_token: 'tok-456',
    });
  });
});

describe('submitEventSchedule', () => {
  it('POSTs to /event with event_name and time_suggestion mapped to snake_case', async () => {
    await submitEventSchedule({
      eventName: 'OutSystems NextStep 2026',
      name: 'Jane Doe',
      phone: '+351 912 345 678',
      email: 'jane@example.com',
      timeSuggestion: 'Morning',
      message: 'Looking forward to it.',
      turnstileToken: 'tok-789',
    });

    const { url, body } = lastRequest(mockFetch);
    expect(url).toBe('https://api.example.com/event');
    expect(body).toEqual({
      event_name: 'OutSystems NextStep 2026',
      name: 'Jane Doe',
      phone: '+351 912 345 678',
      email: 'jane@example.com',
      time_suggestion: 'Morning',
      message: 'Looking forward to it.',
      turnstile_token: 'tok-789',
    });
  });
});

describe('base URL handling', () => {
  it('trims a trailing slash from PUBLIC_API_BASE_URL', async () => {
    vi.stubEnv('PUBLIC_API_BASE_URL', 'https://api.example.com/');

    await submitNewsletter({ name: 'A', email: 'a@b.com', turnstileToken: 't' });

    expect(lastRequest(mockFetch).url).toBe('https://api.example.com/subscribe');
  });

  it('throws when PUBLIC_API_BASE_URL is missing', async () => {
    vi.stubEnv('PUBLIC_API_BASE_URL', '');

    await expect(
      submitNewsletter({ name: 'A', email: 'a@b.com', turnstileToken: 't' })
    ).rejects.toThrow('Missing PUBLIC_API_BASE_URL');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
