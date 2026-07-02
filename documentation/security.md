# Security

The site is static (GitHub Pages), so most of the attack surface is the **forms → external API** path and what the browser is allowed to load. This doc covers the CSP/headers, the Turnstile + secret model, input validation, and the dependency gates.

---

## Headers & CSP

`@bool/seo/SecurityHeaders.astro` is rendered by `BaseLayout`. Because **GitHub Pages cannot set HTTP response headers**, these are emitted as `<meta http-equiv>` tags.

> Caveat: `frame-ancestors` / `X-Frame-Options` **cannot** be enforced via meta tags — browsers require them as real HTTP headers. Clickjacking protection would need a CDN (e.g. Cloudflare) in front of Pages. This is documented inline in the component.

Emitted:

| Header                    | Value                                                          |
| ------------------------- | -------------------------------------------------------------- |
| `X-Content-Type-Options`  | `nosniff`                                                      |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                              |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Content-Security-Policy` | see below                                                      |

### CSP directives

| Directive     | Sources                                                                                                                               | Why                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `default-src` | `'self'`                                                                                                                              | deny by default                        |
| `script-src`  | `'self' 'unsafe-inline' challenges.cloudflare.com googletagmanager.com`                                                               | Astro island hydration, Turnstile, GTM |
| `style-src`   | `'self' 'unsafe-inline'`                                                                                                              | Tailwind + Astro scoped styles         |
| `frame-src`   | `'self' challenges.cloudflare.com`                                                                                                    | Turnstile challenge iframe             |
| `worker-src`  | `'self' blob:`                                                                                                                        | Partytown GA4 worker                   |
| `img-src`     | `'self' data: www.google-analytics.com`                                                                                               | inline data URIs, GA pixels            |
| `connect-src` | `'self' challenges.cloudflare.com <PUBLIC_API_BASE_URL origin> www.google-analytics.com analytics.google.com stats.g.doubleclick.net` | form API (exact origin), Turnstile, GA |
| `font-src`    | `'self'`                                                                                                                              | self-hosted WOFF2 only                 |
| `object-src`  | `'none'`                                                                                                                              | no plugins                             |
| `base-uri`    | `'self'`                                                                                                                              | block `<base>` injection               |
| `form-action` | `'self'`                                                                                                                              | block off-origin native form posts     |

`'unsafe-inline'` on `script-src`/`style-src` is required by Astro's hydration and scoped-style model; tightening it would mean a nonce/hash strategy the static build doesn't currently emit. If you add a third-party origin (a new analytics or embed), it must be added to the matching directive or the browser blocks it.

`connect-src` is pinned to the exact form-API origin derived from `PUBLIC_API_BASE_URL` (not a broad `*.amazonaws.com`), so a compromised inline script can only reach the one endpoint the site actually uses. Because the origin is build-time config, `astro.config.ts` throws in CI if `PUBLIC_API_BASE_URL` or `PUBLIC_TURNSTILE_SITE_KEY` is missing — a missing key would otherwise ship a site whose forms silently fail.

`SEOHead.astro` also renders `<meta name="robots" content="noindex, nofollow">` when a page passes `noindex` (used for legal/utility pages).

---

## Bot protection — Cloudflare Turnstile

Forms attach a Turnstile token that the Lambda verifies server-side before sending email.

- Widget: `@marsidev/react-turnstile`, wrapped by `@bool/ui` `Captcha` (`compositions/Captcha`). Site key comes from `PUBLIC_TURNSTILE_SITE_KEY`; sections pass it down as `captchaSiteKey`.
- Mode is deferred (`execution: 'execute'`, interaction-only): the challenge runs on submit, not page load. Forms call `captchaRef.current?.execute()` and send the resulting token.
- Consumers: `ContactForm` → `/contact`, `NewsletterForm` → `/subscribe`, `EventScheduleModal` → `/event`.
- Turnstile is bound to hostnames (`bool.pt`, `www.bool.pt`, plus `localhost` for dev) — no IP config.

---

## Secret model

- **No `.env` files are committed.** All config lives in GitHub repo variables/secrets (`ci-deploy.md`).
- Only `PUBLIC_*` values reach the browser and are inherently public: `PUBLIC_API_BASE_URL`, `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_GA_MEASUREMENT_ID`, `PUBLIC_SENTRY_DSN`. Declared in `apps/web/bool/src/env.d.ts`.
- The Turnstile **secret key**, AWS credentials, and SES config live in the **Lambda environment, not in this repo** — there is no `TURNSTILE_SECRET` anywhere in the tree.
- API CORS allows `bool.pt` / `www.bool.pt` only, so form posts from `localhost` are blocked unless the backend allowlists them.
- External links use `rel="noopener noreferrer"` (footer, person/expert cards, share menu).

---

## Input validation

Zod schemas in `@bool/shared` (`src/validation.ts`) validate form input client-side via `react-hook-form` + `@hookform/resolvers`. The Lambda re-validates server-side — client validation is UX, not a trust boundary.

| Schema                    | Key constraints                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `contactFormSchema`       | `firstName`/`lastName` 2–50; valid `email`; optional `phone` (`/^\+?[\d\s\-().]{7,20}$/`); `message` 10–2000  |
| `contactFormSimpleSchema` | `name` 2–100; valid `email`; `message` 10–2000                                                                |
| `newsletterSchema`        | `name` 2–100; valid `email`                                                                                   |
| `eventScheduleSchema`     | `fullName` 2–100; optional `phone` (same pattern); valid `email`; `time` required; `message` 1–5000 (API cap) |

The `@bool/api` client (`src/client.ts`) sets a 15s timeout via `AbortController`, retries twice with exponential backoff on `429` and network errors only, and throws a typed `ApiError` otherwise. `5xx` is not retried — the single-use Turnstile token was already consumed, so a replay can only 403.

---

## Dependency security

- **Freshness gate**: `pnpm freshness <pkg>[@version]` (`tooling/scripts/check-dep-freshness.mjs`) blocks any dependency published less than **7 days** ago — a supply-chain guard against compromised fresh releases. Required before adding a dependency.
- **`catalog:` pinning**: every version is pinned once in `pnpm-workspace.yaml`, so an upgrade is one reviewed change, not scattered bumps.
- **Security overrides** in `pnpm-workspace.yaml` force transitive deps to patched minimums: `flatted`, `picomatch`, `h3`, `smol-toml`, `brace-expansion`, `yaml`, `tsconfck`. Removing one re-opens whatever advisory it pins past — only drop after confirming the tree no longer pulls the vulnerable range.

---

## Consent gating

Analytics (GA4) and error monitoring (Sentry) are gated behind cookie consent (`@bool/compliance`). See that package's README and `ci-deploy.md` for the env wiring; the banner only shows when consent-requiring tech is actually enabled.
