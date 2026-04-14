/**
 * Build-time manifest of every image / SVG under packages/media/images/,
 * grouped by their containing folder relative to that root.
 *
 * Used by the MediaPicker so non-devs can browse what already exists in the
 * monorepo and pick a file. Read-only — uploads happen by sending the file to
 * a developer.
 *
 * The folder-defaulting logic (`defaultFolderForField`, `SECTION_FOLDER_NAMES`)
 * lives in `@bool/json-editor-core/default-folder` so it's unit-testable
 * without Vite. We re-export it here for the picker to consume.
 */
export {
  defaultFolderForField,
  SECTION_FOLDER_NAMES,
  FALLBACK_DEFAULT_FOLDER,
} from '@bool/json-editor-core';

const RAW_IMAGES = import.meta.glob<string>(
  '../../../../packages/media/images/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
);

const RAW_SVGS = import.meta.glob<string>(
  '../../../../packages/media/images/**/*.svg',
  { eager: true, query: '?url', import: 'default' },
);

export interface MediaEntry {
  /** Path relative to packages/media/images/, e.g. "case-study/banco.jpg". */
  relativePath: string;
  /** Bare filename for display, e.g. "banco.jpg". */
  filename: string;
  /** Folder portion of the relativePath, e.g. "case-study", "logos/platforms". */
  folder: string;
  /** Public URL for rendering a thumbnail. */
  url: string;
  /** True for SVGs (rendered inline) vs raster images (rendered as <img>). */
  isSvg: boolean;
}

const FOLDER_ROOT_MARKER = '/packages/media/images/';

function toEntry(modulePath: string, url: string, isSvg: boolean): MediaEntry | null {
  const idx = modulePath.indexOf(FOLDER_ROOT_MARKER);
  if (idx === -1) return null;
  const relativePath = modulePath.slice(idx + FOLDER_ROOT_MARKER.length);
  const lastSlash = relativePath.lastIndexOf('/');
  const folder = lastSlash === -1 ? '' : relativePath.slice(0, lastSlash);
  const filename = lastSlash === -1 ? relativePath : relativePath.slice(lastSlash + 1);
  return { relativePath, filename, folder, url, isSvg };
}

const allEntries: MediaEntry[] = [];

for (const [path, url] of Object.entries(RAW_IMAGES)) {
  const entry = toEntry(path, url, false);
  if (entry) allEntries.push(entry);
}
for (const [path, url] of Object.entries(RAW_SVGS)) {
  const entry = toEntry(path, url, true);
  if (entry) allEntries.push(entry);
}

allEntries.sort((a, b) => {
  if (a.folder !== b.folder) return a.folder.localeCompare(b.folder);
  return a.filename.localeCompare(b.filename);
});

const byFolder = new Map<string, MediaEntry[]>();
for (const entry of allEntries) {
  const list = byFolder.get(entry.folder) ?? [];
  list.push(entry);
  byFolder.set(entry.folder, list);
}

/** Every folder under packages/media/images/, sorted alphabetically. */
export const folders: string[] = [...byFolder.keys()].sort();

/** All entries flat. */
export const entries: MediaEntry[] = allEntries;

/** Lookup entries in a single folder. */
export function entriesInFolder(folder: string): MediaEntry[] {
  return byFolder.get(folder) ?? [];
}

/**
 * Find the existing entry for a stored path (or undefined if missing).
 */
export function findByPath(relativePath: string): MediaEntry | undefined {
  return allEntries.find((e) => e.relativePath === relativePath);
}
