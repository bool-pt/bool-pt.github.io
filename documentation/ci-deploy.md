# CI, Deploy & GitHub Configuration

---

## Workflows

Four GitHub Actions workflows:

| Workflow                                            | Trigger                      | What it does                                               |
| --------------------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| **CI** (`.github/workflows/ci.yml`)                 | Push to `main`, PRs          | Lint -> Typecheck -> Test -> Build -> E2E                  |
| **Deploy** (`.github/workflows/deploy.yml`)         | Manual (`workflow_dispatch`) | Build -> Deploy to GitHub Pages                            |
| **Sync Drive** (`.github/workflows/sync-drive.yml`) | Manual (`workflow_dispatch`) | Sync media + locales from Google Drive -> commit to `main` |
| **Lighthouse** (`.github/workflows/lighthouse.yml`) | PRs to `main`                | Lighthouse performance audit                               |

> **Note on form submissions:** the site's contact + newsletter forms are wired to call `PUBLIC_CONTACT_API_URL` / `PUBLIC_NEWSLETTER_API_URL`. The previous AWS Lambda + SES + Sheets backend that served those endpoints has been removed pending a decision on the new email provider (Postmark or similar). Until a new backend is wired up, form submissions will fail at runtime — the site is not yet in production.

### Workflow rules

- CI validates every push and PR — never deploys
- Deploy is triggered manually from Actions > Deploy > Run workflow
- Deploy only builds and deploys — no lint/test/E2E (those already passed in CI)
- Sync Drive pulls media and locale files from Google Drive, auto-rewrites locale paths on media reorganization, and commits. See `content.md` for details.

---

## GitHub Variables & Secrets

All configuration lives in GitHub — no `.env.local` files needed. Configure at Settings -> Secrets and variables -> Actions.

### Variables (`vars.*`) — non-sensitive, visible in logs

| Variable                    | Used by                | Description                                                |
| --------------------------- | ---------------------- | ---------------------------------------------------------- |
| `PUBLIC_CONTACT_API_URL`    | CI, Deploy, Lighthouse | Contact form endpoint URL (used by the frontend at submit) |
| `PUBLIC_NEWSLETTER_API_URL` | CI, Deploy, Lighthouse | Newsletter endpoint URL (used by the frontend at submit)   |
| `PUBLIC_HCAPTCHA_SITE_KEY`  | CI, Deploy, Lighthouse | hCaptcha site key (public, identifies site)                |
| `PUBLIC_GA_MEASUREMENT_ID`  | CI, Deploy, Lighthouse | Google Analytics 4 measurement ID                          |
| `PUBLIC_SENTRY_DSN`         | CI, Deploy             | Sentry DSN for error monitoring                            |

### Secrets (`secrets.*`) — encrypted, masked in logs

| Secret                       | Used by    | Description                                                           |
| ---------------------------- | ---------- | --------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Sync Drive | Full JSON content of the Google Cloud service account key             |
| `GOOGLE_DRIVE_FOLDER_ID`     | Sync Drive | Google Drive root folder ID (contains media/ and locales/ subfolders) |
