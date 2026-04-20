# Conventions

---

## Commits

Conventional Commits enforced by commitlint:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `style:` — formatting, no logic change
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — tooling, CI, dependencies

---

## Branches & Pull Request Workflow

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

---

## Imports

- Use `catalog:` protocol for all dependency versions in `pnpm-workspace.yaml`
- Import from package barrel exports, never from internal paths
- Tooling config lives in `tooling/` and is extended by workspace packages

---

## Naming

- Components: PascalCase (`HeroSection.astro`, `ContactForm.tsx`)
- Utilities/helpers: camelCase (`formatDate.ts`, `cn.ts`)
- CSS Modules: **camelCase** classes (`.cardGrid`, `.navBtnPrev`) — consumed via JS dot notation (`styles.cardGrid`), TypeScript-friendly, no translation layer needed. BEM is redundant — CSS Modules already scope classes.
- Content data files: kebab-case (`team-members.json`)
