# CI, Deploy & GitHub Configuration

---

## Workflows

Five GitHub Actions workflows:

| Workflow                                                                  | Trigger                      | What it does                                                                            |
| ------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| **CI** (`.github/workflows/ci.yml`)                                       | Push to `main`, PRs          | Lint -> Typecheck -> Test -> Build -> E2E                                               |
| **Deploy** (`.github/workflows/deploy.yml`)                               | Manual (`workflow_dispatch`) | Build -> Deploy to GitHub Pages                                                         |
| **Sync Drive** (`.github/workflows/sync-drive.yml`)                       | Manual (`workflow_dispatch`) | Sync media + locales from Google Drive -> commit to `main`                              |
| **Lighthouse** (`.github/workflows/lighthouse.yml`)                       | PRs to `main`                | Lighthouse performance audit                                                            |
| **Test Drive Connection** (`.github/workflows/test-drive-connection.yml`) | Manual (`workflow_dispatch`) | Verify Google Drive service account credential (`pnpm --filter @bool/media test:drive`) |

> **Note on form submissions:** the contact, newsletter, and event-schedule forms POST to a single AWS API Gateway base URL (`PUBLIC_API_BASE_URL`) on the paths `/contact`, `/subscribe`, and `/event`. Each Lambda validates a Cloudflare Turnstile token (`turnstile_token`) server-side before sending email via SES. The frontend renders the Turnstile widget with `PUBLIC_TURNSTILE_SITE_KEY` (public site key); the matching **secret key** lives in the Lambda's own environment, not in this repo. Turnstile is bound to hostnames (`bool.pt`, `www.bool.pt`, plus `localhost` for dev) — no IP configuration is required. CORS on the API allows `bool.pt` / `www.bool.pt` only, so form submits from `localhost` are blocked unless the backend allowlists it.

### Workflow rules

- CI validates every push and PR — never deploys
- Deploy is triggered manually from Actions > Deploy > Run workflow
- Deploy only builds and deploys — no lint/test/E2E (those already passed in CI)
- Sync Drive pulls media and locale files from Google Drive, auto-rewrites locale paths on media reorganization, and commits. See `content.md` for details.

---

## GitHub Variables & Secrets

All configuration lives in GitHub — no `.env.local` files needed. Configure at Settings -> Secrets and variables -> Actions.

### Variables (`vars.*`) — non-sensitive, visible in logs

| Variable                    | Used by                | Description                                                              |
| --------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `PUBLIC_API_BASE_URL`       | CI, Deploy, Lighthouse | Form API base URL; paths `/contact`, `/subscribe`, `/event` are appended |
| `PUBLIC_TURNSTILE_SITE_KEY` | CI, Deploy, Lighthouse | Cloudflare Turnstile site key (public, identifies site)                  |
| `PUBLIC_GA_MEASUREMENT_ID`  | CI, Deploy, Lighthouse | Google Analytics 4 measurement ID                                        |
| `PUBLIC_SENTRY_DSN`         | CI, Deploy             | Sentry DSN for error monitoring                                          |

### Secrets (`secrets.*`) — encrypted, masked in logs

| Secret                       | Used by    | Description                                                           |
| ---------------------------- | ---------- | --------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Sync Drive | Full JSON content of the Google Cloud service account key             |
| `GOOGLE_DRIVE_FOLDER_ID`     | Sync Drive | Google Drive root folder ID (contains media/ and locales/ subfolders) |
