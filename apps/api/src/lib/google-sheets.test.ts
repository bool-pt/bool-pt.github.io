import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetCachesForTests, createGoogleSheetsClient } from './google-sheets.ts';

function makeServiceAccount(): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return JSON.stringify({
    client_email: 'test-sa@bool-test.iam.gserviceaccount.com',
    private_key: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
  });
}

const SPREADSHEET_ID = 'test-spreadsheet';

interface MockResponseInit {
  ok?: boolean;
  status?: number;
  json?: unknown;
}

function mockResponse({ ok = true, status = 200, json }: MockResponseInit): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(json),
    text: () => Promise.resolve(JSON.stringify(json)),
  } as unknown as Response;
}

describe('google-sheets client', () => {
  const sa = makeServiceAccount();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    _resetCachesForTests();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exchanges JWT for access token, fetches sheet metadata, then appends', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ json: { access_token: 'tok', expires_in: 3600 } }))
      .mockResolvedValueOnce(
        mockResponse({
          json: { sheets: [{ properties: { sheetId: 0, title: 'Sheet1', index: 0 } }] },
        })
      )
      .mockResolvedValueOnce(mockResponse({ json: {} }));

    const client = createGoogleSheetsClient(sa);
    await client.appendRow(SPREADSHEET_ID, ['a@b.com', '2026-05-16T10:00:00Z']);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [appendUrl, appendInit] = fetchMock.mock.calls[2] as [URL, RequestInit];
    expect(String(appendUrl)).toContain(`${SPREADSHEET_ID}/values/`);
    expect(String(appendUrl)).toContain(':append');
    expect(String(appendUrl)).toContain('valueInputOption=RAW');
    expect(appendInit.method).toBe('POST');
    expect(JSON.parse(appendInit.body as string)).toEqual({
      values: [['a@b.com', '2026-05-16T10:00:00Z']],
    });
  });

  it('reuses cached access token and sheet metadata across calls', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ json: { access_token: 'tok', expires_in: 3600 } }))
      .mockResolvedValueOnce(
        mockResponse({
          json: { sheets: [{ properties: { sheetId: 0, title: 'Sheet1', index: 0 } }] },
        })
      )
      .mockResolvedValue(mockResponse({ json: {} }));

    const client = createGoogleSheetsClient(sa);
    await client.appendRow(SPREADSHEET_ID, ['a@b.com', 'd1']);
    await client.appendRow(SPREADSHEET_ID, ['b@b.com', 'd2']);

    // 1 token + 1 meta + 2 appends
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('throws when token exchange fails', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, json: {} }));
    const client = createGoogleSheetsClient(sa);
    await expect(client.appendRow(SPREADSHEET_ID, ['x', 'y'])).rejects.toThrow(/token exchange/i);
  });

  it('finds matching row case-insensitively and issues a deleteDimension batchUpdate', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ json: { access_token: 'tok', expires_in: 3600 } }))
      .mockResolvedValueOnce(
        mockResponse({
          json: { sheets: [{ properties: { sheetId: 42, title: 'Sheet1', index: 0 } }] },
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          json: {
            values: [
              ['email'],
              ['keep@example.com'],
              ['Target@Example.com'],
              ['other@example.com'],
            ],
          },
        })
      )
      .mockResolvedValueOnce(mockResponse({ json: { replies: [] } }));

    const client = createGoogleSheetsClient(sa);
    const removed = await client.deleteRowsWhere(SPREADSHEET_ID, 'A', 'target@example.com');

    expect(removed).toBe(1);
    const [batchUrl, batchInit] = fetchMock.mock.calls[3] as [URL, RequestInit];
    expect(String(batchUrl)).toContain(`${SPREADSHEET_ID}:batchUpdate`);
    const body = JSON.parse(batchInit.body as string) as {
      requests: Array<{
        deleteDimension: { range: { sheetId: number; startIndex: number; endIndex: number } };
      }>;
    };
    expect(body.requests).toHaveLength(1);
    expect(body.requests[0]?.deleteDimension.range).toMatchObject({
      sheetId: 42,
      startIndex: 2,
      endIndex: 3,
    });
  });

  it('returns 0 and skips batchUpdate when no rows match', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ json: { access_token: 'tok', expires_in: 3600 } }))
      .mockResolvedValueOnce(
        mockResponse({
          json: { sheets: [{ properties: { sheetId: 0, title: 'Sheet1', index: 0 } }] },
        })
      )
      .mockResolvedValueOnce(mockResponse({ json: { values: [['email'], ['keep@example.com']] } }));

    const client = createGoogleSheetsClient(sa);
    const removed = await client.deleteRowsWhere(SPREADSHEET_ID, 'A', 'gone@example.com');

    expect(removed).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
