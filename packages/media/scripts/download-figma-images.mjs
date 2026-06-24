/**
 * Downloads images from Figma and saves them to packages/media/images/sections/.
 * Run from repo root:
 *   node --env-file=.env.local packages/media/scripts/download-figma-images.mjs
 */

import { createWriteStream, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_KEY = 'mqduTWhJFI9nqjRGtY8mBN';
const API_KEY = process.env.FIGMA_API_KEY;

if (!API_KEY) {
  console.error('Missing FIGMA_API_KEY. Run with: node --env-file=.env.local <script>');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'images', 'sections');
mkdirSync(OUT_DIR, { recursive: true });

const NODES = [
  { id: '1437:13126', filename: 'hero-bg.jpg' },
  { id: '1437:13142', filename: 'ai-keyboard.jpg' },
  { id: '1437:13291', filename: 'people-team.jpg' },
  { id: '1437:13719', filename: 'newsletter-bg.jpg' },
];

async function fetchExportUrls(nodeIds) {
  const ids = nodeIds.join(',');
  const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=jpg&scale=2`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': API_KEY } });
  if (!res.ok) throw new Error(`Figma API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.err) throw new Error(`Figma export error: ${data.err}`);
  return data.images;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const dest = createWriteStream(destPath);
  await pipeline(res.body, dest);
}

const ids = NODES.map((n) => n.id);
console.log('Requesting export URLs from Figma…');
const images = await fetchExportUrls(ids);

for (const { id, filename } of NODES) {
  const imageUrl = images[id];
  if (!imageUrl) {
    console.warn(`  No URL returned for ${id} (${filename})`);
    continue;
  }
  const dest = join(OUT_DIR, filename);
  process.stdout.write(`  Downloading ${filename}… `);
  await downloadImage(imageUrl, dest);
  console.log('done');
}

console.log(`\nSaved to packages/media/images/sections/`);
