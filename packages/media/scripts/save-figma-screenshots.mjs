/**
 * Uses the Figma Desktop MCP (localhost:3845) to export node images.
 * Run from repo root: node packages/media/scripts/save-figma-screenshots.mjs
 * Requires: Figma Desktop app running with MCP plugin active.
 */

import { createWriteStream, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'images', 'sections');
mkdirSync(OUT_DIR, { recursive: true });

const FILE_KEY = 'mqduTWhJFI9nqjRGtY8mBN';
const NODES = [
  { id: '1437:13126', filename: 'hero-bg.png' },
  { id: '1437:13142', filename: 'ai-keyboard.png' },
  { id: '1437:13291', filename: 'people-team.png' },
  { id: '1437:13719', filename: 'newsletter-bg.png' },
];

// Use Figma Desktop app's REST API proxy on port 3845
// The Figma Desktop app routes API requests through its local server using the logged-in user's OAuth token
async function exportViaDesktopApp(nodeIds) {
  // Try the Figma Desktop app's local API proxy
  const ids = nodeIds.join(',');
  const url = `http://127.0.0.1:3845/figma/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=2`;
  const res = await fetch(url);
  if (res.ok) {
    const data = await res.json();
    return data.images;
  }

  // Fallback: check if FIGMA_API_KEY is in environment
  const apiKey = process.env.FIGMA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No FIGMA_API_KEY in environment and Desktop proxy did not respond.\n' +
        'Add FIGMA_API_KEY=<your-token> to .env.local and run:\n' +
        '  node --env-file=.env.local packages/media/scripts/save-figma-screenshots.mjs'
    );
  }

  const apiUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=2`;
  const apiRes = await fetch(apiUrl, { headers: { 'X-Figma-Token': apiKey } });
  if (!apiRes.ok) throw new Error(`Figma API: ${apiRes.status}`);
  const apiData = await apiRes.json();
  if (apiData.err) throw new Error(`Figma export error: ${apiData.err}`);
  return apiData.images;
}

console.log('Requesting export URLs…');
let images;
try {
  images = await exportViaDesktopApp(NODES.map((n) => n.id));
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

for (const { id, filename } of NODES) {
  const imageUrl = images[id];
  if (!imageUrl) {
    console.warn(`  No URL for ${id}`);
    continue;
  }
  process.stdout.write(`  Downloading ${filename}… `);
  const res = await fetch(imageUrl);
  if (!res.ok) {
    console.warn(`HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, filename), buf);
  console.log(`done (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log('\nSaved to packages/media/images/sections/');
