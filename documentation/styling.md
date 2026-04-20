# Styling & Theming

For the full design token reference (colors, typography, spacing, shadows, border radius), see `design-system.md`.

---

## Strategy by Layer

| Layer                 | Approach                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Shadcn primitives     | Tailwind utility classes via `cn()` — this is how Shadcn works                           |
| Astro sections/layout | Scoped `<style>` blocks                                                                  |
| React islands         | CSS Modules (`.module.css`) for anything beyond utility classes                          |
| `globals.css`         | Tailwind import, `@font-face`, CSS custom properties (Shadcn + tokens), base resets only |

---

## Colors & Spacing

Use Tailwind theme classes (`bg-primary`, `text-muted-foreground`, `gap-4`). **Never** hardcode hex/rgb/hsl values. Shadcn's CSS custom properties are the token system — no extra abstraction layer on top.

---

## CSS Best Practices

- **Logical properties**: `margin-inline-start`, not `margin-left`
- **Container queries** over media queries for component-level responsiveness
- **Specify transition properties**: `transition: opacity 200ms`, not `transition: all 200ms`
- **`content-visibility: auto`** on heavy below-fold sections (card grids, event lists)

---

## CSS Modules Rules

- **One module per component** — `Component.module.css` maps 1:1 to `Component.tsx`
- **Import as `styles`** — consistent import name: `import styles from './Component.module.css'`
- **Flat selectors** — one class per rule, no deep nesting beyond one level
- **Variants as separate classes** — compose via `cn()`: `cn(styles.base, styles[variant])`
- **No `composes` across files** — prefer CSS custom properties and component composition
- **No `:global()`** unless absolutely necessary — it defeats module scoping
- **Accept `className` prop** — let parent components add layout styles without breaking encapsulation
- **Only for React islands** — Astro components use scoped `<style>`, Shadcn uses Tailwind
- **Use `cn()`/`clsx`** for conditional classes, never string interpolation

---

## Figma Workflow

Design tokens flow: **Figma** -> (Claude reads via MCP) -> `@bool/shared/tokens/*.ts` -> `tooling/tailwind/preset.ts` -> CSS custom properties at build time.

This is a **dev-time workflow only**. Share Figma URL -> Claude generates tokens/components -> developer reviews and commits.

Scripts in `packages/media/scripts/`:

- `download-figma-images.mjs` — REST API download (uses `FIGMA_API_KEY`)
- `save-figma-screenshots.mjs` — Figma Desktop app proxy with API fallback
- `save-figma-via-mcp.mjs` — MCP-based screenshot capture
