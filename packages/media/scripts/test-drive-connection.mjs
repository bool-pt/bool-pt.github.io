/**
 * Tests the Google Drive connection by authenticating and listing the root folder contents.
 * Run via: Actions → "Test Google Drive Connection" → Run workflow
 *
 * Verifies:
 * 1. Service account credentials are valid
 * 2. Drive API is enabled
 * 3. Folder is shared with the service account
 * 4. Expected subfolders (media/, locales/) exist
 * 5. If NEWSLETTER_SHEET_ID / CONTACTS_SHEET_ID are set, the service account can
 *    read each Sheet's metadata and header row.
 */

import { createSign } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
].join(' ');

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function loadServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY is not set.');
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.');
    process.exit(1);
  }
}

function createJWT(sa) {
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
  return `${header}.${payload}.${signer.sign(sa.private_key, 'base64url')}`;
}

async function getAccessToken(sa) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${createJWT(sa)}`,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Token exchange failed (${res.status}): ${text}`);
    process.exit(1);
  }
  return (await res.json()).access_token;
}

// ---------------------------------------------------------------------------
// Drive API
// ---------------------------------------------------------------------------

async function driveGet(path, token, params = {}) {
  const url = new URL(`${DRIVE_API}/${path}`);
  // Always support shared drives — required when the folder lives in a Workspace shared drive
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('includeItemsFromAllDrives', 'true');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${path} (${res.status}): ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
if (!folderId) {
  console.error('GOOGLE_DRIVE_FOLDER_ID is not set.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Results — each check appends one entry; rendered at the end
// ---------------------------------------------------------------------------

/** @type {Array<{ check: string; status: 'ok' | 'fail' | 'skip' | 'warn'; detail: string }>} */
const results = [];
const inActions = !!process.env.GITHUB_ACTIONS;

function record(check, status, detail) {
  results.push({ check, status, detail });
}

function groupStart(label) {
  if (inActions) console.log(`::group::${label}`);
  else console.log(`\n--- ${label} ---`);
}

function groupEnd() {
  if (inActions) console.log('::endgroup::');
}

// Step 1: Auth
console.log('1. Authenticating…');
const sa = loadServiceAccount();
const token = await getAccessToken(sa);
console.log(`   Service account: ${sa.client_email}`);
record('Authenticate (service account)', 'ok', sa.client_email);

// Step 2: Access root folder
console.log(`\n2. Accessing folder ${folderId}…`);
let rootFolderName = '';
try {
  const folder = await driveGet(`files/${folderId}`, token, { fields: 'id, name, mimeType' });
  rootFolderName = folder.name;
  console.log(`   Folder name: "${folder.name}"`);
  record('Drive root folder', 'ok', `"${folder.name}" (${folderId})`);
} catch (err) {
  console.error(`   Failed to access folder: ${err.message}\n`);
  console.error('   Diagnostic — folders this service account can see:');
  try {
    const visible = await driveGet('files', token, {
      q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: '20',
    });
    if (visible.files.length === 0) {
      console.error('   (none — share the target folder with this service account email)');
    } else {
      for (const f of visible.files) {
        console.error(`   - ${f.name} (${f.id})`);
      }
    }
  } catch (diagErr) {
    console.error(`   Could not run diagnostic: ${diagErr.message}`);
  }
  console.error(`\n   Make sure ${sa.client_email} has Viewer access to folder ${folderId}.`);
  record(
    'Drive root folder',
    'fail',
    `Cannot access ${folderId} — share it with ${sa.client_email}`
  );
  renderSummary();
  process.exit(1);
}

// Step 3: List contents
console.log('\n3. Listing root folder contents…');
const data = await driveGet('files', token, {
  q: `'${folderId}' in parents and trashed = false`,
  fields: 'files(id, name, mimeType)',
  pageSize: '100',
});

if (data.files.length === 0) {
  console.log('   Folder is empty.');
  record('Drive root contents', 'warn', 'folder is empty');
} else {
  for (const file of data.files) {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    console.log(`   ${isFolder ? '📁' : '📄'} ${file.name}`);
  }
}

// Step 4: Check expected subfolders
console.log('\n4. Checking expected subfolders…');
const folderNames = data.files
  .filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
  .map((f) => f.name);

const hasMedia = folderNames.includes('media');
const hasLocales = folderNames.includes('locales');

console.log(`   media/   ${hasMedia ? 'found' : 'NOT FOUND'}`);
console.log(`   locales/ ${hasLocales ? 'found' : 'NOT FOUND'}`);

record('media/ subfolder', hasMedia ? 'ok' : 'warn', hasMedia ? 'present' : 'missing');
record('locales/ subfolder', hasLocales ? 'ok' : 'warn', hasLocales ? 'present' : 'missing');

// Step 5: Recursively list files in each subfolder
async function listAllRecursive(folderId, token, depth = 0) {
  const items = [];
  let pageToken;
  do {
    const params = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size)',
      pageSize: '1000',
    };
    if (pageToken) params.pageToken = pageToken;
    const data = await driveGet('files', token, params);
    for (const f of data.files) {
      if (f.mimeType === 'application/vnd.google-apps.folder') {
        items.push({ name: f.name, depth, isFolder: true });
        const nested = await listAllRecursive(f.id, token, depth + 1);
        items.push(...nested);
      } else {
        items.push({ name: f.name, depth, size: Number(f.size || 0) });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

if (hasMedia) {
  const mediaFolder = data.files.find((f) => f.name === 'media');
  const mediaItems = await listAllRecursive(mediaFolder.id, token);
  const fileCount = mediaItems.filter((i) => !i.isFolder).length;
  groupStart(`media/ contains ${fileCount} files`);
  for (const item of mediaItems) {
    const indent = '  '.repeat(item.depth + 1);
    if (item.isFolder) {
      console.log(`${indent}${item.name}/`);
    } else {
      const kb = item.size > 0 ? `(${(item.size / 1024).toFixed(0)} KB)` : '';
      console.log(`${indent}${item.name} ${kb}`);
    }
  }
  groupEnd();
}

if (hasLocales) {
  const localesFolder = data.files.find((f) => f.name === 'locales');
  const localesData = await driveGet('files', token, {
    q: `'${localesFolder.id}' in parents and trashed = false`,
    fields: 'files(id, name)',
    pageSize: '100',
  });
  const names = localesData.files.map((f) => f.name).join(', ') || '(empty)';
  groupStart(`locales/ contains: ${names}`);
  console.log(names);
  groupEnd();
}

// Step 6: Probe subscription Sheets if their IDs are set
const newsletterSheetId = process.env.NEWSLETTER_SHEET_ID;
const contactsSheetId = process.env.CONTACTS_SHEET_ID;

async function sheetsGet(path, token) {
  const res = await fetch(`${SHEETS_API}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API ${path} (${res.status}): ${text}`);
  }
  return res.json();
}

async function probeSheet(label, sheetId, expectedHeaders) {
  const checkName = `Sheet: ${label}`;
  console.log(`\n   ${label} (${sheetId})…`);
  try {
    const meta = await sheetsGet(
      `${sheetId}?fields=properties(title),sheets(properties(title,index))`,
      token
    );
    const firstTab = meta.sheets.find((s) => s.properties.index === 0)?.properties.title;
    console.log(`     Spreadsheet title: "${meta.properties.title}"`);
    console.log(`     First tab:         "${firstTab}"`);

    const headerRange = `${firstTab}!A1:Z1`;
    const headers = await sheetsGet(`${sheetId}/values/${encodeURIComponent(headerRange)}`, token);
    const cells = (headers.values && headers.values[0]) || [];
    console.log(`     Header row:        [${cells.join(', ') || '(empty)'}]`);

    const missing = expectedHeaders.filter((h) => !cells.includes(h));
    if (missing.length) {
      console.log(`     Missing expected columns: ${missing.join(', ')}`);
      record(
        checkName,
        'fail',
        `"${meta.properties.title}" — missing columns: ${missing.join(', ')}`
      );
    } else {
      console.log(`     All expected columns present.`);
      record(checkName, 'ok', `"${meta.properties.title}" → [${cells.join(', ')}]`);
    }
  } catch (err) {
    console.error(`     FAILED: ${err.message}`);
    console.error(`     Make sure ${sa.client_email} is shared on this sheet as Editor.`);
    const hint = /403/.test(err.message)
      ? `Not shared with ${sa.client_email}`
      : /404/.test(err.message)
        ? 'Sheet ID not found'
        : err.message.split('\n')[0];
    record(checkName, 'fail', hint);
  }
}

if (newsletterSheetId || contactsSheetId) {
  console.log('\n5. Probing subscription Sheets…');
  if (newsletterSheetId) {
    await probeSheet('newsletter', newsletterSheetId, ['email', 'date']);
  } else {
    console.log('   newsletter: NEWSLETTER_SHEET_ID not set — skipping');
    record('Sheet: newsletter', 'skip', 'NEWSLETTER_SHEET_ID not set');
  }
  if (contactsSheetId) {
    await probeSheet('contacts', contactsSheetId, ['name', 'email', 'message', 'date']);
  } else {
    console.log('   contacts: CONTACTS_SHEET_ID not set — skipping');
    record('Sheet: contacts', 'skip', 'CONTACTS_SHEET_ID not set');
  }
} else {
  console.log(
    '\n5. Subscription Sheets: NEWSLETTER_SHEET_ID / CONTACTS_SHEET_ID not set — skipping probe.'
  );
  record('Sheet: newsletter', 'skip', 'NEWSLETTER_SHEET_ID not set');
  record('Sheet: contacts', 'skip', 'CONTACTS_SHEET_ID not set');
}

// ---------------------------------------------------------------------------
// Summary (stdout banner + GitHub Actions job summary)
// ---------------------------------------------------------------------------

function renderSummary() {
  const ICON = { ok: '✓', fail: '✗', warn: '!', skip: '·' };
  const ACTIONS_ICON = { ok: '✅', fail: '❌', warn: '⚠️', skip: '⚪' };
  const failed = results.filter((r) => r.status === 'fail');
  const overallOk = failed.length === 0;

  // Console banner — always last so it's easy to find at the tail of the log
  console.log('\n' + '─'.repeat(60));
  console.log(overallOk ? 'RESULT: PASS' : `RESULT: FAIL (${failed.length})`);
  console.log('─'.repeat(60));
  for (const r of results) {
    console.log(`  ${ICON[r.status]} ${r.check.padEnd(28)} ${r.detail}`);
  }
  console.log('─'.repeat(60));

  // GitHub Actions step summary — Markdown table on the run page
  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryFile) {
    const lines = [
      `## Google Drive connection test`,
      ``,
      overallOk
        ? `**Result: ✅ PASS**`
        : `**Result: ❌ FAIL (${failed.length} issue${failed.length === 1 ? '' : 's'})**`,
      ``,
      `Service account: \`${sa.client_email}\``,
      `Drive root: ${rootFolderName ? `\`${rootFolderName}\`` : '(unknown)'} (\`${folderId}\`)`,
      ``,
      `| | Check | Detail |`,
      `|---|---|---|`,
      ...results.map((r) => `| ${ACTIONS_ICON[r.status]} | ${r.check} | ${r.detail} |`),
      ``,
    ];
    appendFileSync(stepSummaryFile, lines.join('\n') + '\n');
  }
}

renderSummary();

if (results.some((r) => r.status === 'fail')) {
  process.exit(1);
}
