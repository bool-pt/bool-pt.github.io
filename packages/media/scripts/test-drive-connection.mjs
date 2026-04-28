/**
 * Tests the Google Drive connection by authenticating and listing the root folder contents.
 * Run via: Actions → "Test Google Drive Connection" → Run workflow
 *
 * Verifies:
 * 1. Service account credentials are valid
 * 2. Drive API is enabled
 * 3. Folder is shared with the service account
 * 4. Expected subfolders (media/, locales/) exist
 */

import { createSign } from 'node:crypto';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

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

let ok = true;

// Step 1: Auth
console.log('1. Authenticating…');
const sa = loadServiceAccount();
const token = await getAccessToken(sa);
console.log(`   Service account: ${sa.client_email}`);

// Step 2: Access root folder
console.log(`\n2. Accessing folder ${folderId}…`);
try {
  const folder = await driveGet(`files/${folderId}`, token, { fields: 'id, name, mimeType' });
  console.log(`   Folder name: "${folder.name}"`);
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
  ok = false;
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

if (!hasMedia && !hasLocales) {
  console.log('\n   Neither media/ nor locales/ found. Create at least one to enable sync.');
  ok = false;
}

// Step 5: Count files in each subfolder
if (hasMedia) {
  const mediaFolder = data.files.find((f) => f.name === 'media');
  const mediaData = await driveGet('files', token, {
    q: `'${mediaFolder.id}' in parents and trashed = false`,
    fields: 'files(id)',
    pageSize: '1000',
  });
  console.log(`\n   media/ contains ${mediaData.files.length} items`);
}

if (hasLocales) {
  const localesFolder = data.files.find((f) => f.name === 'locales');
  const localesData = await driveGet('files', token, {
    q: `'${localesFolder.id}' in parents and trashed = false`,
    fields: 'files(id, name)',
    pageSize: '100',
  });
  console.log(
    `   locales/ contains: ${localesData.files.map((f) => f.name).join(', ') || '(empty)'}`
  );
}

// Summary
console.log(
  `\n${ok ? 'Connection successful.' : 'Connection works but folder structure needs setup.'}`
);
