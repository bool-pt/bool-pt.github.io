# Bool

Corporate website for Bool, a software consultancy. Built with Astro 5, React 19, Shadcn UI, Tailwind CSS 4, and deployed to GitHub Pages.

## Architecture

pnpm monorepo with Turborepo orchestration. Static site — zero backend. Contact form hits an external AWS Lambda.

```
apps/
  web/bool/          # Main Astro website (static output)
  web/json-editor/   # React SPA for content editing
packages/
  ui/                # Component library (sections, compositions, primitives)
  content/           # Content collections with Zod validation
  shared/            # Design tokens, utilities, constants
  i18n/              # Internationalization (en/pt)
  seo/               # Structured data, meta tags, security headers
  analytics/         # GA4 via Partytown (off main thread)
  compliance/        # GDPR cookie consent management
  api/               # Type-safe API client
  media/             # Image and font assets
  test-utils/        # Testing helpers
tooling/
  eslint/            # ESLint configs (base, astro, react)
  prettier/          # Prettier config
  typescript/        # Shared tsconfig presets
  tailwind-preset/   # Tailwind theme from design tokens
  vite/              # Shared Vite configs
  vitest/            # Shared Vitest configs
  commitlint/        # Conventional commit rules
```

### Layer Hierarchy

Pages import sections. Sections compose compositions + primitives. Never skip layers.

```
pages → sections → compositions → primitives
```

## Prerequisites

- Node.js >= 22
- pnpm >= 9

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start json-editor dev server
pnpm dev:json-editor
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Astro dev server |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting |

## Environment Variables

Copy `.env.example` to `.env` in `apps/web/bool/`:

| Variable | Description |
|----------|-------------|
| `PUBLIC_CONTACT_API_URL` | Contact form Lambda endpoint |
| `PUBLIC_NEWSLETTER_API_URL` | Newsletter Lambda endpoint |
| `PUBLIC_HCAPTCHA_SITE_KEY` | hCaptcha public site key |
| `PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |

## Deployment

Automated via GitHub Actions. Push to `main` triggers build and deploy to GitHub Pages.

## License

All rights reserved. See [LICENSE](LICENSE).
