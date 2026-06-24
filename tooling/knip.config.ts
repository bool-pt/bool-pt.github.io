import type { KnipConfig } from 'knip';

export default {
  workspaces: {
    // Root — tooling only, no source files
    '.': {
      entry: [],
      project: [],
      ignoreDependencies: [
        '@commitlint/config-conventional',
        '@axe-core/playwright',
        'prettier-plugin-astro',
        'prettier-plugin-tailwindcss',
      ],
    },

    // ── Apps ────────────────────────────────────────────────────────────
    // Knip's Astro/Vite/Playwright plugins auto-discover config and entry
    // files; we only need to add non-obvious entries.
    'apps/web/bool': {
      entry: ['src/labels.ts'],
      project: ['src/**/*.{ts,tsx,astro}'],
      // These deps are consumed by Astro's framework layer (config,
      // integrations, Vite plugins) rather than via direct `import`.
      ignoreDependencies: [
        '@bool/analytics',
        '@bool/api',
        '@bool/compliance',
        'tailwindcss',
        '@bool/tailwind-preset',
      ],
    },
    'apps/web/json-editor': {
      project: ['src/**/*.{ts,tsx}'],
      ignoreDependencies: [
        '@bool/media',
        'tailwindcss',
        '@tailwindcss/vite',
        '@testing-library/user-event',
        '@vitejs/plugin-react',
      ],
    },

    // ── E2E ─────────────────────────────────────────────────────────────
    // knip can't resolve @bool/tsconfig in the e2e tsconfig, so playwright.config.ts
    // fails to load and spec files appear unused. List them explicitly as entries.
    e2e: {
      entry: ['**/*.spec.ts'],
      ignoreDependencies: ['@bool/i18n'],
    },

    // ── Packages ─────────────────────────────────────────────────────────
    // @bool/ui: compositions and primitives are consumed via relative .astro
    // imports from sections — knip cannot trace those transitive imports, so
    // we ignore them to avoid false positives. The eslint-plugin-boundaries
    // rule enforces the correct layering instead.
    'packages/ui': {
      entry: ['src/**/*.test.{ts,tsx}'],
      ignore: [
        'src/compositions/**/*.astro',
        'src/primitives/**/*.astro',
        // Shadcn primitives re-export all sub-parts as intentional public API.
        'src/primitives/dialog/dialog.tsx',
        'src/primitives/dropdown-menu/dropdown-menu.tsx',
        'src/primitives/sheet/sheet.tsx',
      ],
      ignoreDependencies: ['astro', 'clsx', 'tailwind-merge', '@bool/tailwind-preset'],
    },

    'packages/shared': {},
    'packages/i18n': {},
    'packages/api': {},
    'packages/analytics': {
      ignoreDependencies: ['astro', '@bool/shared'],
    },
    'packages/compliance': {
      ignoreDependencies: ['@testing-library/jest-dom'],
    },
    'packages/content': {
      ignoreDependencies: ['@bool/media'],
    },
    'packages/media': {
      entry: ['scripts/*.mjs'],
    },
    'packages/seo': {
      ignoreDependencies: ['astro'],
    },
    'packages/json-editor': {},

    // ── Tooling ──────────────────────────────────────────────────────────
    'tooling/eslint': {
      project: ['*.js'],
    },
    'tooling/commitlint': {
      // @commitlint/types is used only as a JSDoc type import, not a runtime dep.
      ignoreDependencies: ['@commitlint/config-conventional', '@commitlint/types'],
    },
    'tooling/prettier': {
      ignoreDependencies: ['prettier-plugin-tailwindcss', 'prettier-plugin-astro'],
    },
    // tooling/typescript only contains tsconfig JSON files. The "react" reference
    // knip sees is a tsconfig `types` field, not an actual module import.
    'tooling/typescript': {
      ignoreDependencies: ['react'],
    },
    'tooling/vitest': {
      project: ['*.ts'],
    },
    'tooling/vite': {
      project: ['src/**/*.ts'],
    },
    'tooling/scripts': {
      entry: ['*.ts', '*.mjs'],
      project: ['*.{ts,mjs}'],
    },
  },

  // Exports re-used within the same file (barrel re-exports) are not flagged.
  ignoreExportsUsedInFile: true,
} satisfies KnipConfig;
