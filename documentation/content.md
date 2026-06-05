# Content & Media

For the full i18n system architecture, see `i18n.md`.

---

## Content Sources

Content lives in two places, by shape:

1. **Flat-key i18n in `packages/i18n/src/locales/*.json`** is the source of truth for **section content** — all strings, image paths, icon names, repeating card arrays. Loaded via `t(key)`, `tCollection(prefix, fields)`, `tList(prefix)` from `@bool/i18n`. Authored via the json-editor (`apps/web/json-editor`) or by hand. Image fields hold a path relative to `packages/media/images/`; the picker's MediaPicker browses that tree.

2. **MDX/JSON content collections in `packages/content/data/`** are reserved for content with long-form bodies that don't fit a flat schema — currently just `blog/` and `events/`. Loaded via `getBlogPosts()` / `getEvents()` from `@bool/content`. Validated by Zod at build time — broken content **fails the build**, not the user.

Per-section payload loaders live in `@bool/content` (`getCaseStudies()`, `getTeamGrid()`) and reuse `collectArray` + `collectNestedList` + `resolveImage` helpers from the same package. Add a new loader by following the case-studies pattern.

---

## Drift Guards

Run automatically in CI and on pre-commit when relevant files change:

- `validateLocale()` walks every key in `en.json`; media-typed keys must resolve to a real file under `packages/media/images/`, icon-typed keys must be a registered `GradientIcon`.
- `getCaseStudies()` / `getTeamGrid()` are unit-tested against real `en.json` — schema drift, missing media, or invalid sector/tech break the test immediately.
- `gradientIconPaths` in `@bool/ui` is tested against a hardcoded canonical list mirrored in `KNOWN_GRADIENT_ICONS` in `@bool/content` — adding/renaming an icon must be done in lockstep.

---

## Google Drive Sync

Media and locale files are synced from a shared Google Drive folder via GitHub Actions (`sync-drive.yml`). The sync script (`packages/media/scripts/sync-google-drive.mjs`) uses a Google Cloud **Service Account** for auth — zero npm dependencies, JWT signed natively with Node.js `crypto`.

### Drive folder structure

```
<GOOGLE_DRIVE_FOLDER_ID>/
├── media/                  → packages/media/images/
│   ├── images/
│   │   ├── backgrounds/
│   │   ├── team/
│   │   └── ...
│   └── fonts/
└── locales/                → packages/i18n/src/locales/
    ├── en.json
    └── pt.json (future)
```

The `media/` and `locales/` subfolders are optional — the sync script downloads whichever it finds.

### Setup (one-time)

**Step 1 — Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com))

1. Create a project (or select an existing one)
2. Go to **APIs & Services -> Library** -> search "Google Drive API" -> **Enable**
3. Go to **IAM & Admin -> Service Accounts** -> **Create Service Account**
4. Give it a name (e.g. `bool-drive-sync`) -> **Done**
5. Click the new service account -> **Keys** tab -> **Add Key -> Create new key -> JSON** -> download the file

**Step 2 — Google Drive**

1. Create a folder (e.g. `bool-website`) with two subfolders: `media/` and `locales/`
2. Right-click the root folder -> **Share** -> paste the service account email (from Step 1, looks like `bool-drive-sync@yourproject.iam.gserviceaccount.com`) -> **Viewer** role -> **Share**
3. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/<THIS_PART>`

**Step 3 — GitHub** (Settings -> Secrets and variables -> Actions)

1. **New repository secret**: `GOOGLE_SERVICE_ACCOUNT_KEY` — open the downloaded JSON key file, copy the entire content, paste as the secret value
2. **New repository secret**: `GOOGLE_DRIVE_FOLDER_ID` — paste the folder ID from Step 2

**Step 4 — Run**

Go to **Actions -> "Sync from Google Drive" -> Run workflow**. After it completes, `git pull` locally. There is no local sync — secrets live only in GitHub.

### Media sync

Only supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg`. The `media/` subfolder structure mirrors `packages/media/images/` subdirectories.

### Locale sync

JSON files in the `locales/` subfolder are **merged** into `packages/i18n/src/locales/` — not overwritten. For an existing locale file, the merge rules are:

| Key location                      | Result                                                           |
| --------------------------------- | ---------------------------------------------------------------- |
| Present in both (same value)      | unchanged                                                        |
| Present in both (different value) | **Drive's value wins** — content edits propagate                 |
| Drive only                        | added                                                            |
| Local only                        | **kept** — code-side additions survive an out-of-date Drive copy |

This means a new translation key added by a code change (e.g. `newsletter.name.label`) will survive a sync even if the Drive copy hasn't been updated yet. Drive's key order is preserved; local-only keys are appended at the end and naturally move into place on the next sync after Drive is updated to include them.

Adding a new file (e.g. `pt.json`) creates a new locale automatically. The script logs how many keys came from Drive, were updated by Drive, and were preserved as local-only — e.g. `done [merged: +2 from Drive, ~1 updated, 3 kept local-only]`. Unchanged files are not written, so git stays clean.

**One trade-off:** deletions from Drive **do not** delete keys locally. If a content editor removes a key from Drive intentionally, the local copy keeps it as a stale entry. `validateLocale()` and the labels tests catch genuinely broken references; intentional pruning is a manual code edit (or could be added behind a `--prune` flag if needed).

### Media reorganization support

The script tracks file identity via `.drive-manifest.json` (maps Google Drive file IDs to local paths). Drive IDs are stable across renames and moves, so when images are reorganized in Drive:

1. **Moved/renamed files** are detected automatically
2. **All locale files** (`en.json`, `pt.json`, etc.) have their image path values rewritten
3. **Blog frontmatter** (`packages/content/data/blog/*.md`) image paths are rewritten
4. **Hardcoded Astro imports** (`import from '@bool/media/images/...'`) cannot be auto-rewritten — the script logs warnings so a developer can update them manually
5. All changes (images, manifest, locale files, blog files) are committed in a single commit

### Script options

- `--dry-run` — show what would be synced without downloading
- `--delete` — remove local media files not present in Drive (locales are never deleted)
