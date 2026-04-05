import { vi } from 'vitest';

interface MockFetchResponse {
  ok?: boolean;
  status?: number;
  json?: unknown;
  text?: string;
}

export function mockFetch(response: MockFetchResponse) {
  const fn = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: () => Promise.resolve(response.json ?? {}),
    text: () => Promise.resolve(response.text ?? ''),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
