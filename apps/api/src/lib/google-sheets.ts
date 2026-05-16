import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface SheetMeta {
  sheetId: number;
  title: string;
}

let cachedAccount: ServiceAccount | null = null;
let cachedToken: CachedToken | null = null;
const sheetMetaCache = new Map<string, SheetMeta>();

function loadServiceAccount(rawJson: string): ServiceAccount {
  if (cachedAccount) return cachedAccount;
  const sa = JSON.parse(rawJson) as ServiceAccount;
  if (!sa.client_email || !sa.private_key) {
    throw new Error('Service account JSON is missing client_email or private_key');
  }
  cachedAccount = sa;
  return sa;
}

function createJWT(sa: ServiceAccount): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(sa.private_key, 'base64url');

  return `${header}.${payload}.${signature}`;
}

async function getAccessToken(rawJson: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const sa = loadServiceAccount(rawJson);
  const jwt = createJWT(sa);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    throw new Error(`Sheets token exchange failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

async function sheetsRequest(
  path: string,
  token: string,
  init: { method?: string; body?: unknown; params?: Record<string, string> } = {}
): Promise<unknown> {
  const url = new URL(`${SHEETS_API}/${path}`);
  for (const [k, v] of Object.entries(init.params ?? {})) url.searchParams.set(k, v);

  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Sheets API ${path} failed (${res.status})`);
  }
  return res.json();
}

async function getFirstSheetMeta(spreadsheetId: string, token: string): Promise<SheetMeta> {
  const cached = sheetMetaCache.get(spreadsheetId);
  if (cached) return cached;

  const data = (await sheetsRequest(spreadsheetId, token, {
    params: { fields: 'sheets(properties(sheetId,title,index))' },
  })) as { sheets: Array<{ properties: { sheetId: number; title: string; index: number } }> };

  const first = data.sheets.find((s) => s.properties.index === 0) ?? data.sheets[0];
  if (!first) throw new Error(`Spreadsheet ${spreadsheetId} has no sheets`);

  const meta: SheetMeta = { sheetId: first.properties.sheetId, title: first.properties.title };
  sheetMetaCache.set(spreadsheetId, meta);
  return meta;
}

export interface GoogleSheetsClient {
  appendRow(spreadsheetId: string, row: ReadonlyArray<string>): Promise<void>;
  deleteRowsWhere(spreadsheetId: string, columnLetter: string, matchValue: string): Promise<number>;
}

export function createGoogleSheetsClient(serviceAccountJson: string): GoogleSheetsClient {
  return {
    async appendRow(spreadsheetId, row) {
      const token = await getAccessToken(serviceAccountJson);
      const meta = await getFirstSheetMeta(spreadsheetId, token);
      const range = `${meta.title}!A:Z`;
      await sheetsRequest(`${spreadsheetId}/values/${encodeURIComponent(range)}:append`, token, {
        method: 'POST',
        params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
        body: { values: [row] },
      });
    },

    async deleteRowsWhere(spreadsheetId, columnLetter, matchValue) {
      const token = await getAccessToken(serviceAccountJson);
      const meta = await getFirstSheetMeta(spreadsheetId, token);
      const range = `${meta.title}!${columnLetter}:${columnLetter}`;
      const data = (await sheetsRequest(
        `${spreadsheetId}/values/${encodeURIComponent(range)}`,
        token
      )) as {
        values?: string[][];
      };
      const values = data.values ?? [];

      const matchIndexes: number[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i]?.[0]?.trim().toLowerCase() === matchValue.trim().toLowerCase()) {
          matchIndexes.push(i);
        }
      }
      if (matchIndexes.length === 0) return 0;

      const requests = matchIndexes
        .sort((a, b) => b - a)
        .map((rowIndex) => ({
          deleteDimension: {
            range: {
              sheetId: meta.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }));

      await sheetsRequest(`${spreadsheetId}:batchUpdate`, token, {
        method: 'POST',
        body: { requests },
      });
      return matchIndexes.length;
    },
  };
}

export function _resetCachesForTests(): void {
  cachedAccount = null;
  cachedToken = null;
  sheetMetaCache.clear();
}
