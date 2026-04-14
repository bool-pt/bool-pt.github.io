# Bool — CLAUDE.md

Bool is a corporate website for a software consultancy. **Astro 5** static site with **React 19** islands, **Shadcn UI**, **Tailwind CSS 4**, **pnpm monorepo** with **Turborepo**, hosted on **GitHub Pages**. Zero backend — contact form hits an external AWS Lambda.

Full architecture: `documentation/architecture.md`
Implementation plan: `documentation/implementation-plan.md`

---

## Architecture Rules

### Layer Hierarchy (one-way imports only)

```
apps/web pages  →  sections  →  compositions  →  primitives
```

Pages import sections. Sections compose compositions + primitives. Compositions compose primitives. **Never skip layers** — a page must not import a primitive directly.

### Apps Are Thin Shells

`apps/web/` contains **only** Astro page files that compose layouts and sections from packages. No business logic, no components, no utilities live in apps.

### Package Boundaries

- **React components**: import from barrel exports (`@bool/ui`, `@bool/shared`)
- **Astro components**: import via subpath (`@bool/ui/sections/HeroSection.astro`, `@bool/ui/layout/BaseLayout.astro`) — Astro components can't be tree-shaken so barrel re-exports add no value
- Packages never reach into each other's `src/` internals
- 9 packages: `@bool/ui`, `@bool/content`, `@bool/i18n`, `@bool/seo`, `@bool/analytics`, `@bool/compliance`, `@bool/api`, `@bool/media`, `@bool/shared`

### Root Is Minimal

Only files that **must** live at root: `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `.gitignore`, `.mcp.json`. All configuration lives in `tooling/`.

---

## Component Rules

### Astro vs React

- **Astro components** for all static content (default)
- **React islands** only for interactive components (carousels, forms, modals, navigation)
- If it doesn't need JavaScript, it's an Astro component

### Hydration Directives

| Directive        | Use for                                    | Examples                                |
| ---------------- | ------------------------------------------ | --------------------------------------- |
| `client:load`    | Must work immediately on page load         | Navigation, Cookie consent banner       |
| `client:visible` | Interactive but below fold or non-critical | Carousels, Forms, Newsletter            |
| None (default)   | Static content                             | Feature cards, Team section, Blog cards |

**Never use** `client:idle` or `client:only` without explicit justification in a code comment.

---

## Styling & Theming

### Strategy by Layer

| Layer                 | Approach                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Shadcn primitives     | Tailwind utility classes via `cn()` — this is how Shadcn works                                            |
| Astro sections/layout | Scoped `<style>` blocks                                                                                   |
| React islands         | CSS Modules (`.module.css`) for anything beyond utility classes                                           |
| `globals.css`         | Tailwind import, `@font-face`, CSS custom properties (Shadcn + tokens), base resets — no component styles |

### Colors & Spacing

Use Tailwind theme classes (`bg-primary`, `text-muted-foreground`, `gap-4`). **Never** hardcode hex/rgb/hsl values. Shadcn's CSS custom properties are the token system — no extra abstraction layer on top.

### CSS Best Practices

- **Logical properties**: `margin-inline-start`, not `margin-left`
- **Container queries** over media queries for component-level responsiveness
- **Specify transition properties**: `transition: opacity 200ms`, not `transition: all 200ms`
- **`content-visibility: auto`** on heavy below-fold sections (card grids, event lists)

### CSS Modules Rules

- **One module per component** — `Component.module.css` maps 1:1 to `Component.tsx`
- **Import as `styles`** — consistent import name: `import styles from './Component.module.css'`
- **Flat selectors** — one class per rule, no deep nesting beyond one level
- **Variants as separate classes** — compose via `cn()`: `cn(styles.base, styles[variant])`
- **No `composes` across files** — prefer CSS custom properties and component composition
- **No `:global()`** unless absolutely necessary — it defeats module scoping
- **Accept `className` prop** — let parent components add layout styles without breaking encapsulation
- **Only for React islands** — Astro components use scoped `<style>`, Shadcn uses Tailwind
- **Use `cn()`/`clsx`** for conditional classes, never string interpolation

### Figma Workflow

Design tokens flow: **Figma** → (Claude reads via MCP) → `@bool/shared/tokens/*.ts` → `tooling/tailwind/preset.ts` → CSS custom properties at build time.

This is a **dev-time workflow only**. Share Figma URL → Claude generates tokens/components → developer reviews and commits.

---

## Content

Content lives in two places, by shape:

1. **Flat-key i18n in `packages/i18n/src/locales/*.json`** is the source of truth for **section content** — all strings, image paths, icon names, repeating card arrays. Loaded via `t(key)`, `tCollection(prefix, fields)`, `tList(prefix)` from `@bool/i18n`. Authored via the json-editor (`apps/web/json-editor`) or by hand. Image fields hold a path relative to `packages/media/images/`; the picker's MediaPicker browses that tree.
2. **MDX/JSON content collections in `packages/content/data/`** are reserved for content with long-form bodies that don't fit a flat schema — currently just `blog/` and `events/`. Loaded via `getBlogPosts()` / `getEvents()` from `@bool/content`. Validated by Zod at build time — broken content **fails the build**, not the user.

Per-section payload loaders live in `@bool/content` (`getCaseStudies()`, `getTeamGrid()`) and reuse `collectArray` + `collectNestedList` + `resolveImage` helpers from the same package. Add a new loader by following the case-studies pattern.

Drift guards (run automatically in CI and on pre-commit when relevant files change):

- `validateLocale()` walks every key in en.json; media-typed keys must resolve to a real file under `packages/media/images/`, icon-typed keys must be a registered `GradientIcon`.
- `getCaseStudies()` / `getTeamGrid()` are unit-tested against real en.json — schema drift, missing media, or invalid sector/tech break the test immediately.
- `gradientIconPaths` in `@bool/ui` is tested against a hardcoded canonical list mirrored in `KNOWN_GRADIENT_ICONS` in `@bool/content` — adding/renaming an icon must be done in lockstep.

---

## Performance

- Astro `<Image />` with lazy loading and explicit `width`/`height` — **never** raw `<img>`
- `font-display: swap` with preloaded critical fonts (WOFF2, self-hosted)
- Partytown for GA4 (off main thread)
- Tailwind purges unused CSS at build time
- Zero JS by default — only islands ship JavaScript

---

## Forbidden Patterns

| Pattern                                     | Why                                          | Instead                                                       |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `forwardRef`                                | Removed in React 19                          | `ref` as a regular prop                                       |
| `any` in exports                            | Breaks type safety downstream                | Proper generics or `unknown`                                  |
| `useFormState`                              | Deprecated in React 19                       | `useActionState`                                              |
| `Math.random()` for keys/IDs                | Non-deterministic, SSR mismatch              | `useId()`                                                     |
| `JSON.parse(JSON.stringify(obj))`           | Loses dates, functions, undefined            | `structuredClone(obj)`                                        |
| Raw `<img>` tag                             | No optimization, no lazy loading             | Astro `<Image />` component                                   |
| Hardcoded colors (`#fff`, `rgb(...)`)       | Breaks theming                               | Tailwind theme classes (`bg-primary`)                         |
| Physical CSS (`margin-left`)                | Breaks RTL/i18n                              | Logical properties (`margin-inline-start`)                    |
| `transition: all`                           | Triggers unnecessary repaints                | Specify exact properties                                      |
| Upper-layer imports                         | Breaks layer hierarchy                       | Sections import compositions, not the reverse                 |
| Missing hydration directive on React island | Ships unnecessary JS or breaks interactivity | Add `client:load` or `client:visible`                         |
| Missing ARIA/keyboard support               | Accessibility failure                        | Use Shadcn primitives (accessible by default) or add manually |
| Evil regex (catastrophic backtracking)      | DoS via ReDoS                                | Use simple patterns or libraries                              |
| Importing package internals                 | Breaks encapsulation                         | Import from barrel export (`@bool/ui`)                        |

---

## Hard Rules

| Rule                         | Detail                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verify before suggesting     | Read `package.json`, `tsconfig.json`, `astro.config.ts` before recommending a dependency or config change                                                                                                                              |
| If unsure, ASK               | Never guess about architecture decisions, styling approach, or package boundaries                                                                                                                                                      |
| Scope boundaries             | Never touch files outside the package you're working in. Cross-package changes require explicit instruction                                                                                                                            |
| Prefer editing over creating | Edit existing files. Only create new files when the task genuinely requires it                                                                                                                                                         |
| No silent fallbacks          | If something fails, throw or surface the error. Never swallow errors with empty catch blocks                                                                                                                                           |
| No duct-tape code            | No `// TODO: fix later`, no `@ts-ignore` without an adjacent explanation, no commented-out code left behind                                                                                                                            |
| Clean codebase               | Delete deprecated code, unused imports, dead files. Don't leave `_old` suffixes or compatibility shims                                                                                                                                 |
| Ask before large changes     | If a task touches more than 5 files, outline the plan first and get confirmation                                                                                                                                                       |
| Be concise                   | No trailing summaries. No restating what was just done. The diff speaks for itself                                                                                                                                                     |
| No planning language in code | Remove "will implement", "placeholder for", "TODO: add" from operational files                                                                                                                                                         |
| Encapsulate assets           | Never add stray files to the project root. Assets go in `@bool/media`, config in `tooling/`                                                                                                                                            |
| Visual QA mandatory          | When implementing from a mockup, image, or Figma design: **always** run `/design-qa` — screenshot with Playwright, compare against the reference, and iterate until zero discrepancies. Never skip this step or declare "close enough" |

---

## CI / Deploy

Two separate GitHub Actions workflows:

| Workflow                                    | Trigger                      | What it does                          |
| ------------------------------------------- | ---------------------------- | ------------------------------------- |
| **CI** (`.github/workflows/ci.yml`)         | Push to `main`, PRs          | Lint → Typecheck → Test → Build → E2E |
| **Deploy** (`.github/workflows/deploy.yml`) | Manual (`workflow_dispatch`) | Build → Deploy to GitHub Pages        |

- CI validates every push and PR — never deploys
- Deploy is triggered manually from Actions > Deploy > Run workflow
- Deploy only builds and deploys — no lint/test/E2E (those already passed in CI)

---

## Conventions

### Commits

Conventional Commits enforced by commitlint:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `style:` — formatting, no logic change
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — tooling, CI, dependencies

### Branches & Pull Request Workflow

**`main` is protected** — no direct pushes allowed. All changes go through pull requests.

1. **Create a feature branch** from `main`: `feat/short-description`, `fix/short-description`
2. **Push the branch** and **open a PR** against `main`
3. **CI runs automatically** on the PR (lint, typecheck, test, build, E2E)
4. **A reviewer must approve** the PR before it can be merged
5. **Merge to `main`** only after approval + green CI
6. **Deploy manually** via GitHub Actions > Deploy > Run workflow

| Who                         | Can do                                       |
| --------------------------- | -------------------------------------------- |
| Any contributor / Claude    | Create branches, push, open PRs              |
| Reviewer (admin/maintainer) | Approve PRs, merge to `main`, trigger deploy |

**Never push directly to `main`.** Even small fixes go through a PR. This ensures every change is reviewed and CI-validated before reaching production.

### Imports

- Use `catalog:` protocol for all dependency versions in `pnpm-workspace.yaml`
- Import from package barrel exports, never from internal paths
- Tooling config lives in `tooling/` and is extended by workspace packages

### Naming

- Components: PascalCase (`HeroSection.astro`, `ContactForm.tsx`)
- Utilities/helpers: camelCase (`formatDate.ts`, `cn.ts`)
- CSS Modules: **camelCase** classes (`.cardGrid`, `.navBtnPrev`) — consumed via JS dot notation (`styles.cardGrid`), TypeScript-friendly, no translation layer needed. BEM is redundant — CSS Modules already scope classes.
- Content data files: kebab-case (`team-members.json`)
