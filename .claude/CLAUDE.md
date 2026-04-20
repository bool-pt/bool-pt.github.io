# Bool — CLAUDE.md

Bool is a corporate website for a software consultancy. **Astro 5** static site with **React 19** islands, **Shadcn UI**, **Tailwind CSS 4**, **pnpm monorepo** with **Turborepo**, hosted on **GitHub Pages**. Zero backend — contact form hits an external AWS Lambda.

## Documentation

| Doc                              | What's in it                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `documentation/design-system.md` | Full design token reference (colors, typography, spacing, shadows, components, recipes) |
| `documentation/styling.md`       | CSS strategy per layer, CSS Modules rules, Figma workflow                               |
| `documentation/content.md`       | Content sources, drift guards, Google Drive media sync                                  |
| `documentation/i18n.md`          | i18n system architecture, `t()` / `tCollection()` / `tList()` API                       |
| `documentation/ci-deploy.md`     | All 5 workflows, GitHub variables & secrets, SST secrets                                |
| `documentation/conventions.md`   | Commits, branches, PR workflow, naming, imports                                         |
| `documentation/component-map.md` | Full page -> section -> composition -> primitive dependency tree                        |
| `documentation/section-map.md`   | Sections per page in render order                                                       |

---

## Architecture

### Layer Hierarchy (one-way imports only)

```
apps/web pages  →  sections  →  compositions  →  primitives
```

**Never skip layers** — a page must not import a primitive directly. Sections compose compositions + primitives. Compositions compose primitives.

### Package Boundaries

- **React components**: import from barrel exports (`@bool/ui`, `@bool/shared`)
- **Astro components**: import via subpath (`@bool/ui/sections/HeroSection.astro`)
- Packages never reach into each other's `src/` internals
- 11 packages: `@bool/ui`, `@bool/content`, `@bool/i18n`, `@bool/seo`, `@bool/analytics`, `@bool/compliance`, `@bool/api`, `@bool/media`, `@bool/shared`, `@bool/json-editor-core`, `@bool/test-utils`

### Apps Are Thin Shells

`apps/web/` contains **only** Astro page files that compose layouts and sections. No business logic, no components, no utilities live in apps.

### Root Is Minimal

Only files that **must** live at root: `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `.gitignore`, `.mcp.json`. All configuration lives in `tooling/`.

---

## Component Rules

- **Astro components** for all static content (default)
- **React islands** only for interactive components (carousels, forms, modals, navigation)
- Hydration: `client:load` for immediate (nav, cookie banner), `client:visible` for below-fold (carousels, forms), none for static
- **Never use** `client:idle` or `client:only` without explicit justification in a code comment

---

## Styling Quick Reference

| Layer                 | Approach                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| Shadcn primitives     | Tailwind utilities via `cn()`                                          |
| Astro sections/layout | Scoped `<style>` blocks                                                |
| React islands         | CSS Modules (`.module.css`)                                            |
| `globals.css`         | Tailwind import, `@font-face`, CSS custom properties, base resets only |

Use Tailwind theme classes for colors/spacing. **Never** hardcode hex/rgb/hsl. Use logical properties (`margin-inline-start`). Specify transition properties (`transition: opacity 200ms`, not `all`). Full rules: `documentation/styling.md`.

---

## Content Quick Reference

- **Section strings/images**: `en.json` via `t(key)` from `@bool/i18n` — image paths relative to `packages/media/images/`
- **Long-form content**: MDX/JSON in `packages/content/data/` (blog, events) — validated by Zod at build time
- **Google Drive sync**: media + locales synced via GitHub Actions -> `git pull` locally. Full setup: `documentation/content.md`
- **Drift guards**: `validateLocale()` + loader unit tests catch missing media/icons in CI

---

## Performance

- Astro `<Image />` with lazy loading and explicit `width`/`height` — **never** raw `<img>`
- `font-display: swap` with preloaded critical fonts (WOFF2, self-hosted)
- Partytown for GA4 (off main thread)
- Tailwind purges unused CSS at build time
- Zero JS by default — only islands ship JavaScript

---

## Forbidden Patterns

| Pattern                                     | Instead                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `forwardRef`                                | `ref` as a regular prop (React 19)                                                                          |
| `any` in exports                            | Proper generics or `unknown`                                                                                |
| `useFormState`                              | `useActionState` (React 19)                                                                                 |
| `Math.random()` for keys/IDs                | `useId()`                                                                                                   |
| `JSON.parse(JSON.stringify(obj))`           | `structuredClone(obj)`                                                                                      |
| Raw `<img>` in Astro                        | Astro `<Image />`. Exception: React islands use `<img>` with explicit `width`/`height`/`loading`/`decoding` |
| Hardcoded colors (`#fff`, `rgb(...)`)       | Tailwind theme classes                                                                                      |
| Physical CSS (`margin-left`)                | Logical properties (`margin-inline-start`)                                                                  |
| `transition: all`                           | Specify exact properties                                                                                    |
| Upper-layer imports                         | Sections import compositions, not the reverse                                                               |
| Missing hydration directive on React island | Add `client:load` or `client:visible`                                                                       |
| Missing ARIA/keyboard support               | Use Shadcn primitives or add manually                                                                       |
| Evil regex (catastrophic backtracking)      | Simple patterns or libraries                                                                                |
| Importing package internals                 | Import from barrel export (`@bool/ui`)                                                                      |

---

## Hard Rules

| Rule                         | Detail                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Verify before suggesting     | Read `package.json`, `tsconfig.json`, `astro.config.ts` before recommending a dependency or config change                     |
| If unsure, ASK               | Never guess about architecture decisions, styling approach, or package boundaries                                             |
| Scope boundaries             | Never touch files outside the package you're working in. Cross-package changes require explicit instruction                   |
| Prefer editing over creating | Edit existing files. Only create new files when the task genuinely requires it                                                |
| No silent fallbacks          | If something fails, throw or surface the error. Never swallow errors with empty catch blocks                                  |
| No duct-tape code            | No `// TODO: fix later`, no `@ts-ignore` without an adjacent explanation, no commented-out code                               |
| Clean codebase               | Delete deprecated code, unused imports, dead files. No `_old` suffixes or compatibility shims                                 |
| Ask before large changes     | If a task touches more than 5 files, outline the plan first and get confirmation                                              |
| Be concise                   | No trailing summaries. No restating what was just done. The diff speaks for itself                                            |
| No planning language in code | Remove "will implement", "placeholder for", "TODO: add" from operational files                                                |
| Encapsulate assets           | Assets go in `@bool/media`, config in `tooling/`. Never add stray files to project root                                       |
| Visual QA mandatory          | When implementing from a design: run `/design-qa`, iterate until zero discrepancies                                           |
| Dependency freshness gate    | **Never** add a dependency published less than 7 days ago. Check `npm info <pkg> time`. Flag for manual review if urgent      |
| All config in GitHub         | No `.env.local` files. Variables and secrets live in GitHub repo settings. Full reference: `documentation/ci-deploy.md`       |
| `main` is protected          | Never push directly. All changes go through PRs. Conventional Commits enforced. Full workflow: `documentation/conventions.md` |
