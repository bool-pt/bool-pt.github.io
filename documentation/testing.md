# Testing

Three layers: **unit** (Vitest, colocated), **end-to-end** (Playwright, in `e2e/`), and **drift guards** (content/locale validation that fails the build). All run in CI; the relevant subset also runs on pre-commit.

---

## Commands

| Command                        | What it runs                                  |
| ------------------------------ | --------------------------------------------- |
| `pnpm test`                    | All unit tests across packages (`turbo test`) |
| `pnpm -F @bool/ui test`        | One package's unit tests (`vitest run`)       |
| `pnpm -F @bool/ui exec vitest` | Watch mode for one package                    |
| `pnpm test:e2e`                | Playwright suite (`pnpm -F @bool/e2e e2e`)    |

Unit runs are cached by Turborepo; coverage output (`coverage/**`) is a tracked task output.

---

## Unit tests (Vitest)

- **Discovery**: `vitest.workspace.ts` points at `packages/*`; each package has its own Vitest config. Tests are **colocated** as `*.test.ts` / `*.test.tsx` next to the source (`include: ['src/**/*.test.{ts,tsx}']`).
- **Shared presets** live in `tooling/vitest` and are imported per package:
  - `./base` — Node environment, the common config.
  - `./dom` — extends base, adds `jsdom` + `setup-dom.ts` (which imports `@testing-library/jest-dom/vitest`).
  - `./react` — extends dom, for React island/component tests.
- `globals: false` — import `describe` / `it` / `expect` explicitly. `restoreMocks: true`, `passWithNoTests: true`.
- **Coverage**: provider `v8`, **80% threshold** on statements/branches/functions/lines. CI emits JUnit to `./test-results/junit.xml`.

Tests exist across most packages (UI compositions/primitives/sections, content loaders, api client, i18n, shared utils, seo, analytics, compliance, json-editor-core).

### Test utilities — `@bool/test-utils`

Import via subpath:

```ts
import { render, userEvent, screen } from '@bool/test-utils/react'; // RTL render wrapped with providers + user-event
import { mockFetch } from '@bool/test-utils/http'; // vi.fn() returning a typed Response stub (.ok/.status/.json()/.text())
```

`@testing-library/react` and friends are optional peer deps, pulled in only by packages that render components.

---

## End-to-end tests (Playwright)

Package `@bool/e2e` (`e2e/`). Config in `e2e/playwright.config.ts`:

- `baseURL: http://localhost:4321/bool/` (note the `/bool/` base path).
- `webServer` runs `pnpm --filter @bool/web preview` from the repo root — Playwright builds against the **preview** (production) build, not the dev server. `reuseExistingServer` is on locally, off in CI.
- `fullyParallel: true`; in CI `retries: 2`, `workers: 4`; HTML reporter, trace on first retry.

Run locally with `pnpm test:e2e` (it boots the preview server for you). Reports land in `e2e/playwright-report/`.

### Specs

| Spec                         | Covers                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`              | Every main route loads (200 + title); 404 renders; nav links visible; cookie banner                        |
| `critical-paths.spec.ts`     | Desktop + mobile nav, cookie consent flow, contact-form validation, footer legal links                     |
| `accessibility.spec.ts`      | axe-core (WCAG 2a/2aa/2.1) scan on 7 key pages + case-study modal; alt text; heading order; keyboard focus |
| `hero-and-carousels.spec.ts` | Hero background + slide indicators; testimonials carousel advances                                         |
| `images-no-broken.spec.ts`   | Scrolls each page, flags any 4xx/5xx on image/font/SVG/`/_image?` responses                                |
| `case-studies.spec.ts`       | Portfolio FlipCards, sector filter, case-study modal open/close                                            |
| `team-grid.spec.ts`          | About-page team grid, detail panel toggle, email/LinkedIn links                                            |

Shared helpers in `e2e/helpers.ts`: `waitForImages`, `dismissCookieBanner`, `getHydratedRoot` (waits for a `client:visible` island to hydrate).

### Accessibility specifics

`accessibility.spec.ts` uses `@axe-core/playwright`, filters to **critical/serious** violations, and tags `wcag2a wcag2aa wcag21a wcag21aa`. A few rules are intentionally disabled (e.g. `color-contrast` — a brand decision). The design-system accessibility checklist (`design-system.md` §13) is the manual counterpart.

---

## Drift guards

Loader/validation tests in `@bool/content` keep `en.json` honest against the rest of the repo:

- `validation.test.ts` — every media-typed key resolves to a real file under `packages/media/images/`; every `iconName` is a registered `GradientIcon`.
- `case-studies.test.ts` / `team-grid.test.ts` — the `getCaseStudies()` / `getTeamGrid()` loaders return well-formed data from real `en.json` (resolved images, valid sector/tech, non-empty labels).

These run in CI and, via the root `lint-staged` hook, on pre-commit whenever locale JSON or media files change:

```json
"packages/i18n/src/locales/*.json": [
  "pnpm -F @bool/content vitest run src/validation.test.ts src/case-studies.test.ts src/team-grid.test.ts --"
],
"packages/media/images/**/*": [
  "pnpm -F @bool/content vitest run src/validation.test.ts --"
]
```

See `content.md` for the content model these guards protect.
