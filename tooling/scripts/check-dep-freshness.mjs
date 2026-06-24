#!/usr/bin/env node
/**
 * Enforces the 7-day freshness gate from CLAUDE.md.
 * Run before adding any new dependency to verify it is old enough to be considered stable.
 *
 * Usage:
 *   pnpm freshness <pkg>
 *   pnpm freshness <pkg>@<version>
 *
 * Exit 0 = safe to install
 * Exit 1 = too fresh or lookup error
 */

const FRESHNESS_DAYS = 7;

function parseArg(arg) {
  if (arg.startsWith('@')) {
    const secondAt = arg.indexOf('@', 1);
    if (secondAt === -1) return { name: arg, version: null };
    return { name: arg.slice(0, secondAt), version: arg.slice(secondAt + 1) };
  }
  const at = arg.indexOf('@');
  if (at === -1) return { name: arg, version: null };
  return { name: arg.slice(0, at), version: arg.slice(at + 1) };
}

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: pnpm freshness <pkg>[@version]');
  console.error('');
  console.error('Examples:');
  console.error('  pnpm freshness zod');
  console.error('  pnpm freshness zod@4.3.6');
  console.error('  pnpm freshness @radix-ui/react-slot@1.2.4');
  process.exit(1);
}

const { name, version } = parseArg(arg);
const encoded = name.replace('/', '%2F');

let data;
try {
  const res = await fetch(`https://registry.npmjs.org/${encoded}`);
  if (!res.ok) {
    console.error(`Error: registry returned HTTP ${res.status} for "${name}"`);
    process.exit(1);
  }
  data = await res.json();
} catch (err) {
  console.error(`Error: could not reach npm registry — ${err.message}`);
  process.exit(1);
}

const targetVersion = version ?? data['dist-tags']?.latest;
if (!targetVersion) {
  console.error(`Error: could not determine target version for "${name}"`);
  process.exit(1);
}

const publishedAt = data.time?.[targetVersion];
if (!publishedAt) {
  console.error(`Error: no publish date for "${name}@${targetVersion}" — version may not exist`);
  process.exit(1);
}

const publishedDate = new Date(publishedAt);
const ageMs = Date.now() - publishedDate.getTime();
const ageDays = ageMs / (1000 * 60 * 60 * 24);
const ageLabel = ageDays < 1 ? `${Math.round(ageDays * 24)}h` : `${Math.floor(ageDays)}d`;

if (ageDays < FRESHNESS_DAYS) {
  console.error(
    `BLOCKED — "${name}@${targetVersion}" was published ${ageLabel} ago (minimum: ${FRESHNESS_DAYS} days)`
  );
  console.error(`Published: ${publishedDate.toISOString()}`);
  console.error(`Flag for manual review if this install is urgent (see CLAUDE.md).`);
  process.exit(1);
}

console.log(
  `OK — "${name}@${targetVersion}" is ${ageLabel} old (published ${publishedDate.toDateString()})`
);
