// Locale merge logic for the Google Drive sync. Extracted from
// sync-google-drive.mjs so it can be unit-tested (the sync script runs side
// effects at import time and can't be imported directly).

/**
 * Identify the numbered collection a dotted key belongs to, using its first
 * integer path segment.
 *
 *   "serviceHighlights.items.5.title" → { prefix: "serviceHighlights.items", index: "5" }
 *   "caseStudies.items.10.tags.3"     → { prefix: "caseStudies.items", index: "10" }
 *   "footer.address"                  → null   (flat key, no collection)
 *
 * @returns {{ prefix: string, index: string } | null}
 */
export function indexedGroup(key) {
  const parts = key.split('.');
  for (let i = 0; i < parts.length; i++) {
    if (/^\d+$/.test(parts[i])) {
      return { prefix: parts.slice(0, i).join('.'), index: parts[i] };
    }
  }
  return null;
}

/**
 * Merge a Drive locale JSON over the local copy.
 *
 *   - Key present in both        → Drive value wins (content edits propagate).
 *   - Key present only in Drive   → added (new translations land).
 *   - Key present only locally    → kept (code-side additions survive a Drive
 *                                   copy that hasn't caught up yet)…
 *   - …EXCEPT a "stray collection item": a local-only key that belongs to a
 *     numbered collection Drive actively manages (Drive has other items under
 *     the same prefix) but whose index Drive no longer provides. Those are
 *     PRUNED, so deleting a list item in the editor/Drive (e.g. removing the
 *     5th Service Highlights card) propagates to the repo instead of lingering
 *     forever as a phantom entry.
 *
 * Whole local-only collections Drive doesn't define at all, and flat local-only
 * keys, are still preserved — only over-index strays in Drive-owned lists go.
 *
 * Drive key order is preserved; surviving local-only keys are appended.
 */
export function mergeLocale(localContent, driveContent) {
  const local = JSON.parse(localContent);
  const drive = JSON.parse(driveContent);
  if (local === null || typeof local !== 'object' || Array.isArray(local)) {
    throw new Error('Local locale file is not a JSON object');
  }
  if (drive === null || typeof drive !== 'object' || Array.isArray(drive)) {
    throw new Error('Drive locale file is not a JSON object');
  }

  // Indices Drive provides for each numbered-collection prefix.
  const driveGroupIndices = new Map();
  for (const key of Object.keys(drive)) {
    const g = indexedGroup(key);
    if (!g) continue;
    if (!driveGroupIndices.has(g.prefix)) driveGroupIndices.set(g.prefix, new Set());
    driveGroupIndices.get(g.prefix).add(g.index);
  }

  const merged = {};
  const driveKeys = new Set();
  const updatedKeys = [];
  // Destructive changes: a key that had a non-empty value locally but comes down
  // empty/blank from Drive (the silent-clobber risk). Surfaced in the sync log +
  // PR body so a reviewer can reject before merging.
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
  const prunedKeys = [];
  for (const [key, localValue] of Object.entries(local)) {
    if (driveKeys.has(key)) continue;
    const g = indexedGroup(key);
    if (g && driveGroupIndices.has(g.prefix) && !driveGroupIndices.get(g.prefix).has(g.index)) {
      // Stray item in a collection Drive manages → prune so the deletion sticks.
      prunedKeys.push(key);
      continue;
    }
    merged[key] = localValue;
    localOnlyKeys.push(key);
  }

  return {
    merged,
    localOnlyKeys,
    prunedKeys,
    updatedKeys,
    clearedKeys,
    addedKeys: [...driveKeys].filter((k) => !(k in local)),
  };
}
