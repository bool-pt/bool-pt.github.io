# Bool — CLAUDE.md

Bool is a corporate website for a software consultancy. Astro static site (v6) with React 19 islands, Shadcn UI, Tailwind CSS 4, in a pnpm + Turborepo monorepo, hosted on GitHub Pages. Zero backend — forms POST to external AWS Lambdas (contact / subscribe / event). Exact dependency versions are pinned in the pnpm catalog (`pnpm-workspace.yaml`).

## Documentation

| Doc                              | What's in it                                                              |
| -------------------------------- | ------------------------------------------------------------------------- |
| `documentation/architecture.md`  | System overview, packages, forms→API→email flow, build orchestration      |
| `documentation/design-system.md` | Design token reference (colors, typography, spacing, shadows, components) |
| `documentation/styling.md`       | CSS strategy per layer, CSS Modules rules, Figma workflow                 |
| `documentation/content.md`       | Content sources, drift guards, Google Drive media sync                    |
| `documentation/i18n.md`          | i18n architecture, `t()` / `tCollection()` / `tList()` API                |
| `documentation/testing.md`       | Unit (Vitest), e2e (Playwright), drift guards, test commands              |
| `documentation/security.md`      | CSP/headers, Turnstile, secret model, input validation, dep gates         |
| `documentation/ci-deploy.md`     | The 5 workflows, GitHub variables & secrets                               |
| `documentation/conventions.md`   | Commits, branches, PR workflow, naming, imports                           |
| `documentation/component-map.md` | Page → section → composition → primitive dependency tree                  |
| `documentation/section-map.md`   | Sections per page in render order                                         |

---

## Architecture

### Layer hierarchy (one-way imports only)

```
apps/web pages  →  sections  →  compositions  →  primitives
```

Never skip layers — a page must not import a primitive directly. `eslint-plugin-boundaries` enforces this in `@bool/ui`; a lint error there is a real violation.

### Package boundaries

- React components import from barrel exports (`@bool/ui`, `@bool/shared`); Astro components import via subpath (`@bool/ui/sections/HeroSection.astro`).
- Packages never reach into each other's `src/` internals.
- 11 packages: `@bool/ui`, `@bool/content`, `@bool/i18n`, `@bool/seo`, `@bool/analytics`, `@bool/compliance`, `@bool/api`, `@bool/media`, `@bool/shared`, `@bool/json-editor-core`, `@bool/test-utils`.

### Where code lives

- `apps/web/` holds **only** Astro page files composing layouts and sections — no business logic, components, or utilities.
- Root holds only tool-required files (`pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `package.json`, `eslint.config.mjs`, `prettier.config.mjs`, `tsconfig.json`, `vitest.workspace.ts`, `.mcp.json`) plus standard repo files. All other config lives in `tooling/`. Never add stray files to root.

---

## Component rules

- Astro components for static content (default); React islands only for interactive UI (carousels, forms, modals, nav).
- Hydration: `client:load` for immediate (nav, cookie banner), `client:visible` for below-fold (carousels, forms), none for static.
- Never use `client:idle` or `client:only` without a justifying code comment.

## Styling

| Layer                 | Approach                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| Shadcn primitives     | Tailwind utilities via `cn()`                                          |
| Astro sections/layout | Scoped `<style>` blocks                                                |
| React islands         | CSS Modules (`.module.css`)                                            |
| `globals.css`         | Tailwind import, `@font-face`, CSS custom properties, base resets only |

Use Tailwind theme classes for colors/spacing — never hardcode hex/rgb/hsl. Use logical properties (`margin-inline-start`). Specify exact transition properties (`transition: opacity 200ms`, not `all`).

## Content

- Section strings/images: `en.json` via `t(key)` from `@bool/i18n` — image paths relative to `packages/media/images/`.
- Long-form content: MDX/JSON in `packages/content/data/` (blog, events), validated by Zod at build time.
- Media + locales sync from Google Drive via GitHub Actions; `validateLocale()` + loader unit tests catch missing media/icons in CI.

## Performance

- Astro `<Image />` with lazy loading and explicit `width`/`height` — never raw `<img>`.
- Self-hosted WOFF2 fonts with `font-display: swap` and preloaded criticals; Partytown runs GA4 off the main thread.
- Zero JS by default — only islands ship JavaScript.

---

## Forbidden patterns

| Pattern                               | Instead                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `forwardRef`                          | `ref` as a regular prop (React 19)                                                         |
| `any` in exports                      | Proper generics or `unknown`                                                               |
| `useFormState`                        | `useActionState` (React 19)                                                                |
| `Math.random()` for keys/IDs          | `useId()`                                                                                  |
| `JSON.parse(JSON.stringify(obj))`     | `structuredClone(obj)`                                                                     |
| Raw `<img>` in Astro                  | Astro `<Image />` (React islands may use `<img>` with explicit `width`/`height`/`loading`) |
| Hardcoded colors (`#fff`, `rgb(...)`) | Tailwind theme classes                                                                     |
| Physical CSS (`margin-left`)          | Logical properties (`margin-inline-start`)                                                 |
| `transition: all`                     | Specify exact properties                                                                   |
| Importing package internals           | Import from barrel export (`@bool/ui`)                                                     |
| Missing hydration directive           | Add `client:load` or `client:visible`                                                      |
| Missing ARIA/keyboard support         | Use Shadcn primitives or add manually                                                      |

---

## Hard rules

| Rule                         | Detail                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Verify before suggesting     | Read `package.json`, `tsconfig.json`, `astro.config.ts` before recommending a dependency or config change  |
| If unsure, ASK               | Never guess about architecture, styling, or package boundaries                                             |
| Scope boundaries             | Don't touch files outside the package you're working in; cross-package changes need explicit instruction   |
| Prefer editing over creating | Edit existing files; create new ones only when genuinely required                                          |
| No silent fallbacks          | Throw or surface errors — never swallow them with empty catch blocks                                       |
| No duct-tape code            | No `// TODO: fix later`, no `@ts-ignore` without an adjacent explanation, no commented-out code            |
| Clean codebase               | Delete dead code, unused imports, dead files; no `_old` suffixes or compatibility shims                    |
| Ask before large changes     | If a task touches more than 5 files, outline the plan first                                                |
| Be concise                   | No trailing summaries or restating what was done — the diff speaks for itself                              |
| Visual QA mandatory          | When implementing from a design, run `/design-qa` until zero discrepancies                                 |
| Dependency freshness gate    | Never add a dependency published < 7 days ago. Run `pnpm freshness <pkg>[@version]` before installing      |
| Use `catalog:` for versions  | All deps in `package.json` files use `catalog:`; pin the version once in `pnpm-workspace.yaml`             |
| Dead code gate               | Run `pnpm knip` before shipping (config: `tooling/knip.config.ts`)                                         |
| All config in GitHub         | No `.env.local` files — variables and secrets live in GitHub repo settings (`documentation/ci-deploy.md`)  |
| `main` is protected          | Never push directly; all changes go through PRs with Conventional Commits (`documentation/conventions.md`) |
