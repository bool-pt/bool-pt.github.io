# Architecture

How the system fits together end to end: a statically-built Astro site on GitHub Pages whose only dynamic surface is three forms that POST to external AWS infrastructure. For the deploy pipeline see `ci-deploy.md`; for the layer/import rules see `CLAUDE.md`.

---

## System overview

```
Browser ──page load──▶ GitHub Pages (static HTML/CSS/JS)
Browser ──form POST──▶ API Gateway ─▶ Lambda ─▶ (verify Turnstile) ─▶ SES ─▶ emails
```

The site is built with Astro in `static` output mode (`apps/web/bool/astro.config.ts`), served from GitHub Pages at site `https://bool.pt` with base path `/bool/`. Integrations: `@astrojs/react` (islands), `@astrojs/sitemap`, `@astrojs/partytown` (off-thread GA4), Tailwind via Vite. There is **no server runtime** — every page is HTML at build time. A request-flow diagram lives in the root `README.md` (Infrastructure section).

---

## Packages

Eleven workspace packages, imported only via barrel/subpath (never internals):

| Package                  | Responsibility                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `@bool/ui`               | Astro sections, React compositions (forms, carousels, modals), Shadcn primitives. Layers enforced by `eslint-plugin-boundaries` |
| `@bool/content`          | Content loaders + Zod schemas (blog, events, case studies, team grid, section labels); media/icon resolution                    |
| `@bool/i18n`             | Flat-key translation system — `t()`, `tOptional()`, `tCollection()`, `tList()`, locale metadata                                 |
| `@bool/seo`              | Structured data (`*JsonLd`), `SEOHead`, `SecurityHeaders`, sitemap config                                                       |
| `@bool/analytics`        | GA4 tracking (`trackEvent`/`trackConversion`/`trackEngagement`) + Sentry (`initSentry`/`captureError`)                          |
| `@bool/compliance`       | Cookie consent banner, consent storage, `useConsent()` hook                                                                     |
| `@bool/api`              | Typed form client (`submitContactForm`/`submitNewsletter`/`submitEventSchedule`), `ApiError`                                    |
| `@bool/media`            | Image + font assets (synced from Google Drive); no logic                                                                        |
| `@bool/shared`           | Types, Zod validation schemas, route/company constants, design tokens, `cn()`/`slugify()`/`formatDate()`                        |
| `@bool/json-editor-core` | Parse/serialize/edit flat-key JSON (powers the json-editor app)                                                                 |
| `@bool/test-utils`       | `mockFetch`, RTL `render` wrapper                                                                                               |

---

## Apps

- **`apps/web/bool`** — the corporate website. Astro pages in `src/pages/` compose layouts + sections; sections mount React islands for interactivity. Builds to static HTML deployed to GitHub Pages. This is the only app that ships to production.
- **`apps/web/json-editor`** — a React + Vite SPA for editing `packages/i18n/src/locales/en.json` (the content source of truth) without touching code, built on `@bool/json-editor-core`. See `i18n.md` for the editing workflow.

---

## Forms → API → email

The site's only round-trip. Three forms, three routes, three Lambdas.

### Client

`react-hook-form` + `@hookform/resolvers` validate against the `@bool/shared` Zod schemas, the form runs Turnstile (`execute()` on submit), then calls the matching `@bool/api` function. Each fires `trackEvent('form_submission', …)`.

| Form (`@bool/ui` composition) | API function          | Route        | Payload (+ `turnstileToken`)                             |
| ----------------------------- | --------------------- | ------------ | -------------------------------------------------------- |
| `ContactForm`                 | `submitContactForm`   | `/contact`   | `name, email, phone?, message`                           |
| `NewsletterForm`              | `submitNewsletter`    | `/subscribe` | `name, email`                                            |
| `EventScheduleModal`          | `submitEventSchedule` | `/event`     | `eventName, name, phone, email, timeSuggestion, message` |

`EventScheduleModal` opens on the custom event `bool:open-event-schedule`.

### `@bool/api`

`submitters.ts` reads `PUBLIC_API_BASE_URL` (throws if missing), trims trailing slashes, and `POST`s JSON to `baseUrl + path`. `client.ts` (`apiFetch`) adds a 15s `AbortController` timeout and 2 retries with exponential backoff on `429` and network errors/timeouts; any other status throws a typed `ApiError(status, body, operation)` immediately — `5xx` is never retried because the single-use Turnstile token in the body is consumed by the first attempt, so a replay can only fail CAPTCHA validation. Request/response types live in `@bool/shared/src/types.ts` (`ContactFormData`, `NewsletterData`, `EventScheduleData`, `APIResponse`).

### Backend (external, not in this repo)

API Gateway HTTP API in **eu-west-3** routes `/contact`, `/subscribe`, `/event` to three Lambdas. Each Lambda verifies the Turnstile token server-side (secret key in its own env), then sends two SES emails — a notification to the bool. inbox and a confirmation to the submitter. CORS allows `bool.pt` / `www.bool.pt` only. See `security.md` for the trust boundary.

---

## Build & orchestration

- **Turborepo** (`turbo.json`): `build` depends on `^build` and outputs `dist/**` + `.astro/**`; `lint`/`typecheck`/`test` run independently; `test` outputs `coverage/**`; `dev`/`deploy` are uncached. Global cache inputs include `tooling/vite`, `tooling/vitest`, `packages/media/images`, and `packages/i18n/src/locales` so content/locale changes invalidate correctly.
- **pnpm catalog** (`pnpm-workspace.yaml`): every dependency version is pinned once in `catalog:`; package manifests reference `catalog:`. This is the single source of truth for versions.

---

## Rendering model

Zero JS by default — Astro ships static HTML and only hydrates explicit islands:

- `client:load` for immediately-interactive UI (navigation, cookie banner, above-fold forms).
- `client:visible` for below-fold interactivity (carousels, newsletter bar, modals).
- `client:idle` / `client:only` are disallowed without a justifying comment.

Local component state uses `react-hook-form` (forms) or context/hooks (`useConsent`); cross-component triggers use custom DOM events.
