/**
 * Connects to the Figma Desktop MCP server (localhost:3845) via SSE,
 * calls get_screenshot for each node, and saves the result as PNG files.
 *
 * Run: node packages/media/scripts/save-figma-via-mcp.mjs
 * Requires: Figma Desktop app running with MCP enabled.
 */

import { writeFile, mkdirSync } from 'node:fs';
import { writeFile as writeFileAsync } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'images', 'sections');
mkdirSync(OUT_DIR, { recursive: true });

const MCP_URL = 'http://127.0.0.1:3845/mcp';

const NODES = [
  { id: '1437:13126', filename: 'hero-bg.png' },
  { id: '1437:13142', filename: 'ai-keyboard.png' },
  { id: '1437:13291', filename: 'people-team.png' },
  { id: '1437:13719', filename: 'newsletter-bg.png' },
];

async function mcpRequest(sessionId, method, params, id) {
  const body = JSON.stringify({ jsonrpc: '2.0', method, params, id });
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
    },
    body,
  });
  const text = await res.text();
  // SSE format: "event: message\ndata: {...}\n\n"
  // or plain JSON
  let jsonStr = text;
  if (text.includes('data:')) {
    const dataLine = text.split('\n').find((l) => l.startsWith('data:'));
    jsonStr = dataLine ? dataLine.slice(5).trim() : '{}';
  }
  const parsed = jsonStr ? JSON.parse(jsonStr) : {};
  return { status: res.status, headers: Object.fromEntries(res.headers), body: parsed };
}

// Initialize MCP session
console.log('Initializing MCP session…');
const initResp = await mcpRequest(
  null,
  'initialize',
  {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'image-downloader', version: '1.0' },
  },
  1
);

const sessionId = initResp.headers['mcp-session-id'];
console.log('Session:', sessionId, 'Protocol:', initResp.body?.result?.protocolVersion);

if (!sessionId) {
  console.error('Failed to get session ID:', JSON.stringify(initResp, null, 2));
  process.exit(1);
}

// Send initialized notification
await mcpRequest(sessionId, 'notifications/initialized', {}, undefined);

let reqId = 2;
for (const { id, filename } of NODES) {
  process.stdout.write(`  Capturing ${id} → ${filename}… `);
  try {
    const resp = await mcpRequest(
      sessionId,
      'tools/call',
      {
        name: 'get_screenshot',
        arguments: {
          nodeId: id,
          clientFrameworks: 'astro,react',
          clientLanguages: 'typescript',
        },
      },
      reqId++
    );

    const result = resp.body?.result;
    if (!result) {
      console.warn('No result:', JSON.stringify(resp.body));
      continue;
    }

    // Find image content
    const imageContent = Array.isArray(result.content)
      ? result.content.find((c) => c.type === 'image')
      : null;

    if (!imageContent?.data) {
      console.warn('No image data in response');
      continue;
    }

    const buf = Buffer.from(imageContent.data, 'base64');
    const ext = imageContent.mimeType?.includes('jpeg') ? '.jpg' : '.png';
    const outPath = join(OUT_DIR, filename.replace(/\.\w+$/, ext));
    await writeFileAsync(outPath, buf);
    console.log(`done (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.warn(`error: ${err.message}`);
  }
}

console.log(`\nDone. Files in packages/media/images/sections/`);
