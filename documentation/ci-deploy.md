# CI, Deploy & GitHub Configuration

---

## Workflows

Five GitHub Actions workflows:

| Workflow                                            | Trigger                                | What it does                                               |
| --------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| **CI** (`.github/workflows/ci.yml`)                 | Push to `main`, PRs                    | Lint -> Typecheck -> Test -> Build -> E2E                  |
| **Deploy** (`.github/workflows/deploy.yml`)         | Manual (`workflow_dispatch`)           | Build -> Deploy to GitHub Pages                            |
| **Deploy API** (`.github/workflows/deploy-api.yml`) | Push to `main` (apps/api/\*\*), manual | Deploy Lambda API via SST                                  |
| **Sync Drive** (`.github/workflows/sync-drive.yml`) | Manual (`workflow_dispatch`)           | Sync media + locales from Google Drive -> commit to `main` |
| **Lighthouse** (`.github/workflows/lighthouse.yml`) | PRs to `main`                          | Lighthouse performance audit                               |

### Workflow rules

- CI validates every push and PR — never deploys
- Deploy is triggered manually from Actions > Deploy > Run workflow
- Deploy only builds and deploys — no lint/test/E2E (those already passed in CI)
- Sync Drive pulls media and locale files from Google Drive, auto-rewrites locale paths on media reorganization, and commits. See `content.md` for details.

---

## GitHub Variables & Secrets

All configuration lives in GitHub — no `.env.local` files needed. Configure at Settings -> Secrets and variables -> Actions.

### Variables (`vars.*`) — non-sensitive, visible in logs

| Variable                    | Used by                | Description                                    |
| --------------------------- | ---------------------- | ---------------------------------------------- |
| `PUBLIC_CONTACT_API_URL`    | CI, Deploy, Lighthouse | Contact form Lambda endpoint URL               |
| `PUBLIC_NEWSLETTER_API_URL` | CI, Deploy, Lighthouse | Newsletter Lambda endpoint URL                 |
| `PUBLIC_HCAPTCHA_SITE_KEY`  | CI, Deploy, Lighthouse | hCaptcha site key (public, identifies site)    |
| `PUBLIC_GA_MEASUREMENT_ID`  | CI, Deploy, Lighthouse | Google Analytics 4 measurement ID              |
| `PUBLIC_SENTRY_DSN`         | CI, Deploy             | Sentry DSN for error monitoring                |
| `AWS_DEPLOY_ROLE_ARN`       | Deploy API             | IAM role ARN for OIDC-based AWS authentication |
| `SES_FROM_EMAIL`            | Deploy API             | SES verified sender email address              |
| `SES_NOTIFY_EMAIL`          | Deploy API             | Email address for contact form notifications   |
| `SES_CONTACT_LIST`          | Deploy API             | SES contact list name for newsletter           |

### Secrets (`secrets.*`) — encrypted, masked in logs

| Secret                       | Used by    | Description                                                           |
| ---------------------------- | ---------- | --------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Sync Drive | Full JSON content of the Google Cloud service account key             |
| `GOOGLE_DRIVE_FOLDER_ID`     | Sync Drive | Google Drive root folder ID (contains media/ and locales/ subfolders) |

### SST Secrets (managed via `npx sst secret set`, not GitHub)

| Secret                  | Used by    | Description                              |
| ----------------------- | ---------- | ---------------------------------------- |
| `HCaptchaSecret`        | Deploy API | hCaptcha secret key (server-side verify) |
| `NewsletterTokenSecret` | Deploy API | JWT signing secret for newsletter tokens |
