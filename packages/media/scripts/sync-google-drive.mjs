/**
 * Syncs media and locale files from a Google Drive folder into the monorepo.
 * Uses a Google Cloud Service Account for authentication (zero npm dependencies).
 *
 * Designed to run exclusively via GitHub Actions — secrets never touch local disk.
 * See .github/workflows/sync-drive.yml for the workflow.
 *
 * ## Expected Drive folder structure
 *
 *   <GOOGLE_DRIVE_FOLDER_ID>/
 *   ├── media/          → packages/media/images/
 *   │   ├── backgrounds/
 *   │   ├── team/
 *   │   └── ...
 *   └── locales/        → packages/i18n/src/locales/
 *       ├── en.json
 *       └── pt.json (future)
 *
 * Both subfolders are optional — the script syncs whichever it finds.
 *
 * ## Key features
 *
 * - **Manifest-based tracking** for media: `.drive-manifest.json` maps each Google Drive
 *   file ID to its local path. Drive IDs are stable across renames/moves, so the script
 *   detects reorganizations and auto-updates references in locale files and blog frontmatter.
 * - **Locale sync**: JSON files in the `locales/` Drive folder are merged into
 *   `packages/i18n/src/locales/` — Drive wins on shared keys, local-only keys are kept,
 *   Drive-only keys are added. Adding a new file (e.g. `pt.json`) creates a new locale.
 *   Deletions from Drive are NOT propagated (see syncLocales for full rules).
 * - **Hardcoded import warnings**: Astro components with hardcoded `@bool/media` imports
 *   can't be auto-rewritten — the script warns so a developer can update them manually.
 *
 * ## Setup (one-time)
 *
 * 1. Go to https://console.cloud.google.com → create or select a project
 * 2. Enable the "Google Drive API"
 * 3. Go to IAM & Admin → Service Accounts → Create Service Account
 * 4. Create a JSON key for the service account and download it
 * 5. Share your Drive folder with the service account email
 *    (e.g. bool-media@yourproject.iam.gserviceaccount.com) — Viewer role is enough
 * 6. Get the Drive folder ID from the URL:
 *    https://drive.google.com/drive/folders/<FOLDER_ID>
 * 7. Add two GitHub repository secrets (Settings → Secrets → Actions):
 *    - GOOGLE_SERVICE_ACCOUNT_KEY — paste the full JSON key file content
 *    - GOOGLE_DRIVE_FOLDER_ID — the folder ID string
 * 8. Trigger via Actions → Sync from Google Drive → Run workflow
 *
 * ## Environment variables (injected by GitHub Actions)
 *
 *   GOOGLE_SERVICE_ACCOUNT_KEY  — raw JSON content of the service account key
 *   GOOGLE_DRIVE_FOLDER_ID     — Drive folder ID to sync from
 *
 * ## Options
 *
 *   --dry-run    Show what would be synced without downloading
 *   --delete     Remove local files not present in Drive (media only)
 */

import { createSign } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
  renameSync,
  statSync,
} from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEDIA_PKG = join(__dirname, '..');
const IMAGES_DIR = join(MEDIA_PKG, 'images');
const MANIFEST_PATH = join(MEDIA_PKG, '.drive-manifest.json');

const REPO_ROOT = join(MEDIA_PKG, '..', '..');
const LOCALES_DIR = join(REPO_ROOT, 'packages', 'i18n', 'src', 'locales');
const BLOG_DIR = join(REPO_ROOT, 'packages', 'content', 'data', 'blog');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']);
const LOCALE_EXTENSIONS = new Set(['.json']);

// Characters illegal in Windows (NTFS) path segments (control chars 0x00-0x1F
// and trailing dots/spaces are checked separately in windowsUnsafeReasons).
// Drive files named this way download fine on the Linux CI runner but cannot be
// checked out on Windows — git aborts with "invalid path" and the contributor is
// left with a broken working tree (this is exactly what "Case Study: X.jpg" did).
// We can't rename them here (they mirror Drive, the source of truth), so the sync
// surfaces a clear warning instead.
const WINDOWS_ILLEGAL_CHARS = /[<>:"|?*]/;
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE = process.argv.includes('--delete');

// ---------------------------------------------------------------------------
// Auth — Service Account JWT → Access Token
// ---------------------------------------------------------------------------

function loadServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.error(
      'Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable.\n' +
        'This should be set as a GitHub Actions secret containing the raw JSON\n' +
        'of your Google Cloud service account key.'
    );
    process.exit(1);
  }

  try {
    return JSON.parse(raw);
  } catch {
    console.error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.\n' +
        'Paste the full content of the service account key file as the secret value.'
    );
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
  const signature = signer.sign(sa.private_key, 'base64url');

  return `${header}.${payload}.${signature}`;
}

async function getAccessToken(sa) {
  const jwt = createJWT(sa);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Google Drive API helpers
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
    throw new Error(`Drive API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** Find a subfolder by name inside a parent folder. Returns the folder ID or null. */
async function findSubfolder(parentId, name, token) {
  const data = await driveGet('files', token, {
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: '1',
  });
  return data.files[0]?.id ?? null;
}

/**
 * Recursively lists all files in a Drive folder, preserving folder structure.
 * @param {Set<string>} allowedExtensions — only files with these extensions are included
 * Returns flat array of { id, name, mimeType, modifiedTime, size, localPath }.
 */
async function listFilesRecursive(folderId, token, allowedExtensions, relativePath = '') {
  const results = [];
  let pageToken;

  do {
    const params = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
      pageSize: '1000',
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await driveGet('files', token, params);

    for (const file of data.files) {
      const localPath = relativePath ? `${relativePath}/${file.name}` : file.name;

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const nested = await listFilesRecursive(file.id, token, allowedExtensions, localPath);
        results.push(...nested);
      } else {
        const ext = extname(file.name).toLowerCase();
        if (allowedExtensions.has(ext)) {
          results.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            size: Number(file.size),
            localPath,
          });
        }
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return results;
}

async function downloadFile(fileId, token) {
  const url = `${DRIVE_API}/files/${fileId}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${fileId}`);
  return Buffer.from(await res.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Manifest — maps Drive file ID → local path (media only)
// ---------------------------------------------------------------------------

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest) {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([, a], [, b]) => a.localeCompare(b))
  );
  writeFileSync(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Reference rewriting — locale files, blog frontmatter, hardcoded imports
// ---------------------------------------------------------------------------

function rewriteLocaleFiles(moves) {
  if (!existsSync(LOCALES_DIR)) return;

  const localeFiles = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  for (const localeFile of localeFiles) {
    const filePath = join(LOCALES_DIR, localeFile);
    let content = readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const { oldPath, newPath } of moves) {
      const oldEscaped = JSON.stringify(oldPath).slice(1, -1);
      const newEscaped = JSON.stringify(newPath).slice(1, -1);
      if (content.includes(oldEscaped)) {
        content = content.replaceAll(oldEscaped, newEscaped);
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(filePath, content);
      console.log(`  Updated: packages/i18n/src/locales/${localeFile}`);
    }
  }
}

function rewriteBlogFrontmatter(moves) {
  if (!existsSync(BLOG_DIR)) return;

  const mdFiles = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const mdFile of mdFiles) {
    const filePath = join(BLOG_DIR, mdFile);
    let content = readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const { oldPath, newPath } of moves) {
      const variants = [oldPath, `/images/${oldPath}`];
      const newVariants = [newPath, `/images/${newPath}`];

      for (let i = 0; i < variants.length; i++) {
        if (content.includes(variants[i])) {
          content = content.replaceAll(variants[i], newVariants[i]);
          changed = true;
        }
      }
    }

    if (changed) {
      writeFileSync(filePath, content);
      console.log(`  Updated: packages/content/data/blog/${mdFile}`);
    }
  }
}

function warnHardcodedImports(moves) {
  const warnings = [];
  const sectionsDir = join(REPO_ROOT, 'packages', 'ui', 'src', 'sections');

  if (!existsSync(sectionsDir)) return warnings;

  for (const { oldPath } of moves) {
    const importFragment = `@bool/media/images/${oldPath}`;
    const files = findFilesContaining(sectionsDir, importFragment);
    for (const file of files) {
      const relFile = file.slice(REPO_ROOT.length + 1).replace(/\\/g, '/');
      warnings.push({ file: relFile, oldPath });
    }
  }

  return warnings;
}

function findFilesContaining(dir, needle) {
  const matches = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      matches.push(...findFilesContaining(full, needle));
    } else if (/\.(astro|tsx?|jsx?)$/.test(entry.name)) {
      const content = readFileSync(full, 'utf-8');
      if (content.includes(needle)) matches.push(full);
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Local file helpers
// ---------------------------------------------------------------------------

function collectLocalFiles(dir, relativeTo = dir) {
  const files = new Set();
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const f of collectLocalFiles(full, relativeTo)) files.add(f);
    } else if (entry.name !== '.gitkeep') {
      const rel = full.slice(relativeTo.length + 1).replace(/\\/g, '/');
      files.add(rel);
    }
  }
  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns the reasons a local path is invalid on Windows, or [] if it is safe.
 * Such files download fine on the Linux CI runner but break `git checkout` on
 * Windows, so the sync surfaces them as a warning to be renamed in Drive.
 */
function windowsUnsafeReasons(localPath) {
  const reasons = new Set();
  for (const segment of localPath.split('/')) {
    const illegal = segment.match(WINDOWS_ILLEGAL_CHARS);
    if (illegal) reasons.add(`illegal character "${illegal[0]}"`);
    // eslint-disable-next-line no-control-regex -- NTFS forbids 0x00-0x1F
    if ([...segment].some((c) => c.charCodeAt(0) < 32)) reasons.add('control character');
    if (/[ .]$/.test(segment)) reasons.add('trailing space or dot');
    if (WINDOWS_RESERVED_NAMES.test(segment)) reasons.add('reserved device name');
  }
  return [...reasons];
}

// ---------------------------------------------------------------------------
// Sync: media
// ---------------------------------------------------------------------------

async function syncMedia(mediaFolderId, token) {
  console.log('=== Media Sync ===\n');
  console.log('Listing files in Drive media/ folder…');

  const driveFiles = await listFilesRecursive(mediaFolderId, token, IMAGE_EXTENSIONS);
  console.log(`Found ${driveFiles.length} image files\n`);

  if (driveFiles.length === 0) {
    console.log('No supported image files found.\n');
    return { moved: 0, downloaded: 0, skipped: 0, deleted: 0, unsafeNames: [] };
  }

  // Flag Drive filenames that are invalid on Windows. They download fine on the
  // Linux CI runner but break `git checkout` for contributors on Windows, leaving
  // a broken tree. We can't rename them (Drive is the source of truth) — surface
  // a clear warning so the source files get renamed.
  const unsafeNames = [];
  for (const file of driveFiles) {
    const reasons = windowsUnsafeReasons(file.localPath);
    if (reasons.length) unsafeNames.push({ path: file.localPath, reasons });
  }
  if (unsafeNames.length > 0) {
    console.warn(`⚠️  ${unsafeNames.length} file(s) have Windows-incompatible names:`);
    for (const { path, reasons } of unsafeNames) {
      console.warn(`      ${path} — ${reasons.join('; ')}`);
    }
    console.warn('    These sync on Linux CI but break local checkouts on Windows.');
    console.warn('    Rename the source files in Google Drive (avoid : < > " | ? * and');
    console.warn('    trailing dots/spaces), then re-sync.\n');
  }

  // Load previous manifest to detect moves/renames
  const oldManifest = loadManifest();
  const newManifest = {};
  const driveIdToNew = new Map(driveFiles.map((f) => [f.id, f.localPath]));

  // Detect moves: same Drive ID, different local path
  const moves = [];
  for (const [driveId, oldPath] of Object.entries(oldManifest)) {
    const newPath = driveIdToNew.get(driveId);
    if (newPath && newPath !== oldPath) {
      moves.push({ driveId, oldPath, newPath });
    }
  }

  // Process moves first
  if (moves.length > 0) {
    console.log(`Detected ${moves.length} moved/renamed file(s):\n`);
    for (const { oldPath, newPath } of moves) {
      console.log(`  ${oldPath} → ${newPath}`);
    }

    if (!DRY_RUN) {
      console.log('\nMoving files…');
      for (const { oldPath, newPath } of moves) {
        const oldFull = join(IMAGES_DIR, oldPath);
        const newFull = join(IMAGES_DIR, newPath);
        if (existsSync(oldFull)) {
          mkdirSync(dirname(newFull), { recursive: true });
          renameSync(oldFull, newFull);
          console.log(`  Moved: ${oldPath} → ${newPath}`);
        }
      }

      console.log('\nUpdating references…');
      rewriteLocaleFiles(moves);
      rewriteBlogFrontmatter(moves);

      const importWarnings = warnHardcodedImports(moves);
      if (importWarnings.length > 0) {
        console.log('\nHardcoded imports need manual update:');
        for (const { file, oldPath } of importWarnings) {
          console.log(`  ${file} — references @bool/media/images/${oldPath}`);
        }
      }
    } else {
      console.log('\n  [dry-run] Would move files and update locale files + blog frontmatter');
    }
    console.log('');
  }

  // Download new or updated files
  let downloaded = 0;
  let skipped = 0;

  for (const file of driveFiles) {
    newManifest[file.id] = file.localPath;

    const destPath = join(IMAGES_DIR, file.localPath);
    const destDir = dirname(destPath);
    const driveModified = new Date(file.modifiedTime).getTime();

    let needsDownload = true;
    if (existsSync(destPath)) {
      const localStat = statSync(destPath);
      if (localStat.size === file.size && localStat.mtimeMs >= driveModified) {
        skipped++;
        needsDownload = false;
      }
    }

    if (!needsDownload) continue;

    if (DRY_RUN) {
      console.log(`  [dry-run] Would download: ${file.localPath} (${formatBytes(file.size)})`);
      downloaded++;
      continue;
    }

    mkdirSync(destDir, { recursive: true });
    process.stdout.write(`  Downloading ${file.localPath} (${formatBytes(file.size)})… `);
    const buf = await downloadFile(file.id, token);
    writeFileSync(destPath, buf);
    console.log('done');
    downloaded++;
  }

  // Optionally delete local files not present in Drive
  let deleted = 0;
  if (DELETE) {
    const driveSet = new Set(driveFiles.map((f) => f.localPath));
    const localFiles = collectLocalFiles(IMAGES_DIR);

    for (const localPath of localFiles) {
      if (!driveSet.has(localPath)) {
        const fullPath = join(IMAGES_DIR, localPath);
        if (DRY_RUN) {
          console.log(`  [dry-run] Would delete: ${localPath}`);
        } else {
          unlinkSync(fullPath);
          console.log(`  Deleted: ${localPath}`);
        }
        deleted++;
      }
    }
  }

  if (!DRY_RUN) {
    saveManifest(newManifest);
  }

  return { moved: moves.length, downloaded, skipped, deleted, unsafeNames };
}

// ---------------------------------------------------------------------------
// Sync: locales
// ---------------------------------------------------------------------------

/**
 * Merges a Drive locale JSON over the local copy:
 *   - Keys present in both → Drive value wins (content edits propagate)
 *   - Keys present only in Drive → added (new translations land)
 *   - Keys present only locally → kept (code-side additions survive an out-of-date Drive)
 *
 * Drive's key order is preserved; local-only keys are appended at the end
 * (they'll naturally move into Drive's order on the next sync after Drive
 * is updated to include them).
 *
 * Deletions from Drive are NOT propagated — a key removed from Drive will
 * persist locally. validateLocale() + the labels tests catch genuinely dead
 * references; intentional pruning can be done in a follow-up PR if needed.
 */
function mergeLocale(localContent, driveContent) {
  const local = JSON.parse(localContent);
  const drive = JSON.parse(driveContent);
  if (local === null || typeof local !== 'object' || Array.isArray(local)) {
    throw new Error('Local locale file is not a JSON object');
  }
  if (drive === null || typeof drive !== 'object' || Array.isArray(drive)) {
    throw new Error('Drive locale file is not a JSON object');
  }

  const merged = {};
  const driveKeys = new Set();
  const updatedKeys = [];
  // Destructive changes: a key that had a non-empty value locally but comes
  // down empty/blank from Drive (the silent-clobber risk). Surfaced in the
  // sync log + PR body so a reviewer can reject before merging.
  const clearedKeys = [];

  for (const [key, driveValue] of Object.entries(drive)) {
    merged[key] = driveValue;
    driveKeys.add(key);
    if (Object.prototype.hasOwnProperty.call(local, key) && local[key] !== driveValue) {
      updatedKeys.push(key);
      const localFilled =
        typeof local[key] === 'string' ? local[key].trim() !== '' : local[key] != null;
      const driveBlank =
        typeof driveValue === 'string' ? driveValue.trim() === '' : driveValue == null;
      if (localFilled && driveBlank) {
        clearedKeys.push({ key, was: local[key] });
      }
    }
  }

  const localOnlyKeys = [];
  for (const [key, localValue] of Object.entries(local)) {
    if (!driveKeys.has(key)) {
      merged[key] = localValue;
      localOnlyKeys.push(key);
    }
  }

  return {
    merged,
    localOnlyKeys,
    updatedKeys,
    clearedKeys,
    addedKeys: [...driveKeys].filter((k) => !(k in local)),
  };
}

function serializeLocale(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

async function syncLocales(localesFolderId, token) {
  console.log('=== Locales Sync ===\n');
  console.log('Listing files in Drive locales/ folder…');

  // Locales are flat — no recursion needed, just .json files in the root
  const driveFiles = await listFilesRecursive(localesFolderId, token, LOCALE_EXTENSIONS);
  console.log(`Found ${driveFiles.length} locale file(s)\n`);

  if (driveFiles.length === 0) {
    console.log('No JSON files found in locales/ folder.\n');
    return { downloaded: 0, skipped: 0, unchanged: 0, warnings: [] };
  }

  mkdirSync(LOCALES_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let unchanged = 0;
  // { file, key, was } for every value Drive blanked out
  const warnings = [];

  for (const file of driveFiles) {
    // Only sync top-level .json files (ignore subdirectories)
    if (file.localPath.includes('/')) continue;

    const destPath = join(LOCALES_DIR, file.name);
    const isNew = !existsSync(destPath);

    if (DRY_RUN) {
      console.log(
        `  [dry-run] Would check: ${file.name} (${formatBytes(file.size)}) [${isNew ? 'new locale' : 'compare'}]`
      );
      downloaded++;
      continue;
    }

    process.stdout.write(`  Checking ${file.name}… `);
    const buf = await downloadFile(file.id, token);
    const driveContent = buf.toString('utf-8');

    if (isNew) {
      writeFileSync(destPath, driveContent);
      console.log('done [new locale]');
      downloaded++;
      continue;
    }

    const localContent = readFileSync(destPath, 'utf-8');
    let merged, localOnlyKeys, updatedKeys, addedKeys, clearedKeys;
    try {
      ({ merged, localOnlyKeys, updatedKeys, addedKeys, clearedKeys } = mergeLocale(
        localContent,
        driveContent
      ));
    } catch (err) {
      console.log(`SKIPPED (${err.message})`);
      skipped++;
      continue;
    }

    const mergedContent = serializeLocale(merged);
    if (mergedContent === localContent) {
      console.log('unchanged');
      unchanged++;
      continue;
    }

    writeFileSync(destPath, mergedContent);
    const parts = [];
    if (addedKeys.length) parts.push(`+${addedKeys.length} from Drive`);
    if (updatedKeys.length) parts.push(`~${updatedKeys.length} updated`);
    if (localOnlyKeys.length) parts.push(`${localOnlyKeys.length} kept local-only`);
    console.log(`done [merged: ${parts.join(', ') || 'whitespace/format only'}]`);
    if (localOnlyKeys.length) {
      const sample = localOnlyKeys.slice(0, 5).join(', ');
      const ellipsis = localOnlyKeys.length > 5 ? `, … (+${localOnlyKeys.length - 5} more)` : '';
      console.log(`    local-only keys preserved: ${sample}${ellipsis}`);
    }
    if (clearedKeys.length) {
      console.warn(
        `    ⚠️  ${clearedKeys.length} value(s) CLEARED by Drive (was set locally → now blank):`
      );
      for (const { key, was } of clearedKeys) {
        console.warn(`        ${key}: "${was}" → ""`);
        warnings.push({ file: file.name, key, was });
      }
    }
    downloaded++;
  }

  return { downloaded, skipped, unchanged, warnings };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
if (!folderId) {
  console.error('Missing GOOGLE_DRIVE_FOLDER_ID. Set it in your environment.');
  process.exit(1);
}

console.log('Authenticating with Google…');
const sa = loadServiceAccount();
const token = await getAccessToken(sa);
console.log(`Authenticated as ${sa.client_email}\n`);

// Discover subfolders. media/ may optionally contain an images/ subfolder
// to mirror packages/media/images/ — if so, sync from inside that.
console.log('Looking for media/ and locales/ subfolders…');
let mediaFolderId = await findSubfolder(folderId, 'media', token);
const localesFolderId = await findSubfolder(folderId, 'locales', token);

if (mediaFolderId) {
  const nestedImages = await findSubfolder(mediaFolderId, 'images', token);
  if (nestedImages) {
    console.log('  (using media/images/ as the root — mirroring packages/media/images/)');
    mediaFolderId = nestedImages;
  }
}

if (!mediaFolderId && !localesFolderId) {
  console.error(
    'Neither media/ nor locales/ subfolder found in Drive.\n' +
      'Expected folder structure:\n' +
      '  <root>/\n' +
      '  ├── media/     (images)\n' +
      '  └── locales/   (JSON locale files)\n'
  );

  // Diagnostic: list what's actually in the root folder
  console.error('Diagnostic — items the service account can see in the root folder:');
  try {
    const rootContents = await driveGet('files', token, {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: '50',
    });
    if (rootContents.files.length === 0) {
      console.error(
        '   (folder appears empty — subfolders may not be shared with the service account)'
      );
    } else {
      for (const f of rootContents.files) {
        const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
        console.error(`   ${isFolder ? 'folder' : 'file  '}  "${f.name}"`);
      }
      console.error('\n   Folder names must be exactly "media" and "locales" (lowercase).');
    }
  } catch (err) {
    console.error(`   Could not list folder contents: ${err.message}`);
  }
  process.exit(1);
}

console.log(`  media/:   ${mediaFolderId ? 'found' : 'not found (skipping)'}`);
console.log(`  locales/: ${localesFolderId ? 'found' : 'not found (skipping)'}\n`);

// Sync media first (moves may rewrite locale file references)
let mediaSummary = { moved: 0, downloaded: 0, skipped: 0, deleted: 0, unsafeNames: [] };
if (mediaFolderId) {
  mediaSummary = await syncMedia(mediaFolderId, token);
}

// Then sync locales (overwrites with Drive versions — done after media moves
// so that any path rewrites from media moves don't conflict)
let localesSummary = { downloaded: 0, skipped: 0, unchanged: 0, warnings: [] };
if (localesFolderId) {
  localesSummary = await syncLocales(localesFolderId, token);
}

// Surface problems where a reviewer will see them: the Actions run summary and
// the create-pull-request body (via the multiline "warnings" step output).
const warningBlocks = [];

// Media: filenames that are invalid on Windows (the recurring "Case Study: X.jpg"
// breakage). They sync on Linux CI but leave Windows contributors with an
// un-checkout-able tree, so they must be renamed at the source in Drive.
const unsafeNames = mediaSummary.unsafeNames ?? [];
if (unsafeNames.length > 0) {
  warningBlocks.push(
    [
      '> [!WARNING]',
      `> **${unsafeNames.length} file(s) have names that are invalid on Windows.** They sync on the Linux CI runner but cannot be checked out on Windows — git aborts with "invalid path", leaving contributors with a broken working tree. Rename the source files in Google Drive (avoid the characters \`< > : " | ? *\` and trailing dots/spaces), then re-sync.`,
      '>',
      ...unsafeNames.map((u) => `> - \`${u.path}\` — ${u.reasons.join('; ')}`),
    ].join('\n')
  );
}

// Locales: a key that was set locally came down blank from Drive (silent clobber).
const clearWarnings = localesSummary.warnings ?? [];
if (clearWarnings.length > 0) {
  warningBlocks.push(
    [
      '> [!WARNING]',
      `> **${clearWarnings.length} value(s) were cleared by this sync** — a key that was set locally came down blank from Drive. Review before merging; if unintended, fix the value in Drive and re-sync (or do not merge).`,
      '>',
      ...clearWarnings.map((w) => `> - \`${w.key}\` (${w.file}): \`"${w.was}"\` → \`""\``),
    ].join('\n')
  );
}

const block = warningBlocks.join('\n\n');
if (block) {
  // 1) Actions run page
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${block}\n`);
  }
  // 2) PR body — exposed as a multiline step output named "warnings"
  if (process.env.GITHUB_OUTPUT) {
    const delim = 'SYNC_WARNINGS_EOF';
    appendFileSync(process.env.GITHUB_OUTPUT, `warnings<<${delim}\n${block}\n${delim}\n`);
  }
} else if (process.env.GITHUB_OUTPUT) {
  // Emit an empty output so the workflow reference never errors.
  appendFileSync(process.env.GITHUB_OUTPUT, 'warnings<<SYNC_WARNINGS_EOF\nSYNC_WARNINGS_EOF\n');
}

// Summary
console.log('\n=== Summary ===\n');
if (mediaFolderId) {
  console.log(
    `Media:   ${mediaSummary.moved} moved, ${mediaSummary.downloaded} downloaded, ${mediaSummary.skipped} up-to-date` +
      `${DELETE ? `, ${mediaSummary.deleted} deleted` : ''}`
  );
}
if (localesFolderId) {
  console.log(
    `Locales: ${localesSummary.downloaded} updated, ${localesSummary.unchanged} unchanged`
  );
}
if (DRY_RUN) {
  console.log('\n(dry run — no changes written)');
}
