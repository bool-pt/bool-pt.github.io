import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './client';
import { ApiError } from './errors';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('makes a successful GET request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      }),
    );

    const result = await apiFetch<{ data: string }>('https://api.example.com/data', {
      retries: 0,
    });
    expect(result).toEqual({ data: 'test' });
  });

  it('sends JSON body on POST', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await apiFetch('https://api.example.com/submit', {
      method: 'POST',
      body: { name: 'test' },
      retries: 0,
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe('{"name":"test"}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('throws ApiError on non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      }),
    );

    await expect(
      apiFetch('https://api.example.com/data', { retries: 0 }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.body).toEqual({ error: 'Bad request' });
      return true;
    });
  });

  it('retries on 500 errors', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'recovered' }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiFetch<{ data: string }>('https://api.example.com/data', {
      retries: 1,
      retryDelayMs: 1,
    });

    expect(result).toEqual({ data: 'recovered' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 rate limit', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve(null),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiFetch('https://api.example.com/data', {
      retries: 1,
      retryDelayMs: 1,
    });

    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 400 errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'bad' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      apiFetch('https://api.example.com/data', { retries: 2, retryDelayMs: 1 }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      return true;
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws timeout error on slow requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    await expect(
      apiFetch('https://api.example.com/slow', {
        timeoutMs: 50,
        retries: 0,
      }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.message).toContain('timed out');
      return true;
    });
  });

  it('handles JSON parse failure in error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      }),
    );

    await expect(
      apiFetch('https://api.example.com/test', { retries: 0 }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.body).toBeNull();
      return true;
    });
  });
});
