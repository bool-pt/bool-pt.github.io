# Bool Design System

Opinionated reference for building new UI. For architecture rules, layer hierarchy, and forbidden patterns see `CLAUDE.md`.

---

## 1. Design Principles

- **Astro-first** — everything is a static Astro component unless it needs JavaScript
- **Token-driven** — all visual values come from CSS custom properties defined in `packages/shared/src/tokens/`; never hardcode colors, sizes, or shadows
- **Fluid by default** — typography and spacing scale smoothly between breakpoints using `clamp()`; avoid fixed breakpoint jumps for type
- **Minimal JS surface** — React islands only for carousels, forms, modals, and filterable grids; hydrate with `client:visible` unless immediate interaction is required (`client:load`)
- **Logical properties** — always `inline-size`, `margin-block-start`, `padding-inline` etc. for RTL/i18n readiness
- **Composition over configuration** — build complex UI by nesting simple primitives, not by adding props to a god-component

---

## 2. Color System

### 2.1 Brand Palette

| Token                          | Hex       | Role                                    |
| ------------------------------ | --------- | --------------------------------------- |
| `--color-primary`              | `#e7453a` | Brand red — buttons, links, accents     |
| `--color-primary-hover`        | `#c42020` | Primary interactive hover state         |
| `--color-primary-light`        | `#f28075` | Lighter primary for subtle accents      |
| `--color-primary-tint`         | `#fdecea` | Primary background tint (cards, badges) |
| `--color-primary-gradient-end` | `#812720` | Gradient end for icon fills             |

### 2.2 Neutrals

| Token                      | Hex       | Use                      |
| -------------------------- | --------- | ------------------------ |
| `--color-background`       | `#ffffff` | Page background          |
| `--color-foreground`       | `#0a0a0a` | Primary text             |
| `--color-muted`            | `#f5f5f5` | Muted backgrounds        |
| `--color-muted-foreground` | `#737373` | Secondary text, captions |
| `--color-border`           | `#e5e5e5` | Default borders          |

### 2.3 Surfaces

Use these for section backgrounds and cards on dark areas:

| Token                      | Hex       | When to use                                |
| -------------------------- | --------- | ------------------------------------------ |
| `--color-surface-dark`     | `#0a0a0a` | Dark section backgrounds (heroes, footers) |
| `--color-surface-charcoal` | `#1a1a1a` | Slightly lighter dark surfaces             |
| `--color-surface-black`    | `#000000` | Pure black backgrounds                     |
| `--color-surface-light`    | `#f8f8f8` | Subtle off-white sections                  |
| `--color-surface-mid`      | `#f3f3f3` | Mid-tone light backgrounds                 |
| `--color-surface-muted`    | `#e5e5e5` | Muted divider backgrounds                  |

### 2.4 On-Dark Colors

For text and borders placed on dark surfaces:

| Token                    | Value                    | Use                        |
| ------------------------ | ------------------------ | -------------------------- |
| `--color-on-dark`        | `#ffffff`                | Primary text on dark       |
| `--color-on-dark-muted`  | `rgba(255,255,255,0.7)`  | Secondary text on dark     |
| `--color-on-dark-subtle` | `rgba(255,255,255,0.45)` | Tertiary/hint text on dark |
| `--color-border-on-dark` | `rgba(255,255,255,0.08)` | Borders on dark surfaces   |

### 2.5 Opacity Scales

Pre-defined opacity layers for compositing:

- **White**: `--white-1` through `--white-90` (1%, 2%, 3%, 4%, 6%, 8%, 10%, 12%, 14%, 15%, 20%, 25%, 30%, 35%, 40%, 50%, 55%, 60%, 65%, 80%, 90%)
- **Black**: `--black-2` through `--black-85` (2%, 5%, 10%, 15%, 16%, 20%, 30%, 60%, 65%, 70%, 75%, 85%)

Use these instead of writing `rgba()` manually. Example: `background: var(--white-60)` for a 60% white overlay.

### 2.6 Accent Colors

Reserved for data visualization, tags, and differentiation — not for primary UI:

| Token                       | Hex       |
| --------------------------- | --------- |
| `--color-accent-blue`       | `#146ff4` |
| `--color-accent-teal`       | `#019380` |
| `--color-accent-purple`     | `#6e61d2` |
| `--color-accent-orange`     | `#f22800` |
| `--color-accent-navy`       | `#003781` |
| `--color-accent-dark-green` | `#006134` |

### 2.7 Decision Rules

- **Section background**: alternate between `--color-background` (white), `--color-surface-light`, and `--color-surface-dark` to create visual rhythm
- **Text on light**: use `--color-foreground` for headings, `--color-muted-foreground` for body/descriptions
- **Text on dark**: use `--color-on-dark` for headings, `--color-on-dark-muted` for body
- **Borders**: `--color-border` on light, `--color-border-on-dark` on dark — never use neutral hex values directly
- **Primary color**: reserved for CTAs, active states, and accent elements. Don't use it for large background fills (use `--color-primary-tint` instead)

---

## 3. Typography

### 3.1 Font Families

| Family             | CSS Variable                   | Weights Available            | Use                                           |
| ------------------ | ------------------------------ | ---------------------------- | --------------------------------------------- |
| **Degular**        | `--font-display` / `font-sans` | 300, 400, 500, 600, 700, 900 | All headings and body text (primary typeface) |
| **Oxanium**        | `font-accent`                  | 400, 500, 600, 700           | Accent/display text, tech-themed labels       |
| **JetBrains Mono** | `font-mono`                    | —                            | Code snippets, technical content              |

### 3.2 Fluid Type Scale

All sizes use `clamp(min, preferred, max)` for smooth scaling. Use these CSS variables — never set `font-size` to a fixed rem value in sections.

**Body & Small:**

| Token                 | Range       | Use                                |
| --------------------- | ----------- | ---------------------------------- |
| `--font-size-caption` | 12px → 14px | Labels, timestamps, metadata       |
| `--font-size-body-sm` | 13px → 14px | Small body text, ghost button text |
| `--font-size-body`    | 14px → 16px | Default body copy                  |
| `--font-size-body-lg` | 16px → 18px | Emphasized body, card descriptions |

**Headings:**

| Token              | Range       | Use                                |
| ------------------ | ----------- | ---------------------------------- |
| `--font-size-lead` | 18px → 20px | Lead paragraphs, SectionIntro body |
| `--font-size-sub`  | 20px → 22px | Subtitles                          |
| `--font-size-h4`   | 20px → 24px | Card titles, subsection headings   |
| `--font-size-h3`   | 24px → 32px | Section sub-headings               |
| `--font-size-h2`   | 28px → 36px | Section headings                   |
| `--font-size-h1`   | 32px → 40px | Page-level headings                |

**Display:**

| Token                 | Range       | Use                             |
| --------------------- | ----------- | ------------------------------- |
| `--font-size-display` | 36px → 48px | SectionIntro headings (default) |
| `--font-size-hero`    | 44px → 58px | Hero section headings           |
| `--font-size-stat`    | 48px → 76px | Large stat numbers              |
| `--font-size-mega`    | 58px → 90px | Oversized display text          |

### 3.3 Weight Rules

| Weight    | Value | When                                    |
| --------- | ----- | --------------------------------------- |
| Regular   | 400   | Body text, descriptions                 |
| Medium    | 500   | SectionIntro body, emphasized text      |
| Semibold  | 600   | Buttons, labels, card titles            |
| Bold      | 700   | Section headings, SectionIntro headings |
| Extrabold | 800   | Hero text (rare)                        |

### 3.4 Line Heights

| Token     | Value | Pairing                      |
| --------- | ----- | ---------------------------- |
| `tight`   | 1.25  | Display/heading text         |
| `snug`    | 1.375 | Sub-headings                 |
| `normal`  | 1.5   | Body text (default)          |
| `relaxed` | 1.625 | Long-form body, descriptions |
| `loose`   | 2     | Spacious text, large blocks  |

### 3.5 Heading Anatomy

SectionIntro headings use:

- `font-family: var(--font-display)` (Degular)
- `font-size: var(--font-size-display)` (default) — overridable via `headingSize` prop
- `font-weight: 700`
- `line-height: 1.1`
- `letter-spacing: -0.02em`

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Standard Tailwind-compatible scale (1 unit = 4px):

| Class | Value | Common use                  |
| ----- | ----- | --------------------------- |
| `1`   | 4px   | Micro gaps                  |
| `2`   | 8px   | Icon gaps, tight padding    |
| `3`   | 12px  | Small card padding          |
| `4`   | 16px  | Default gap, inline padding |
| `6`   | 24px  | Card padding, grid gap      |
| `8`   | 32px  | Section internal gaps       |
| `10`  | 40px  | Large component spacing     |
| `12`  | 48px  | Section content spacing     |
| `16`  | 64px  | Major section breaks        |
| `20`  | 80px  | Section padding-block       |
| `24`  | 96px  | Large section padding       |

### 4.2 Section Padding

Every section wraps content in `<Section>` which applies:

```css
padding-block: 5rem; /* 80px top and bottom */
content-visibility: auto; /* performance optimization */
```

Override via the `paddingBlock` prop: `<Section paddingBlock="3rem 0">`.

### 4.3 Container

`<SectionContainer>` constrains content width:

```css
max-inline-size: 1440px;
margin-inline: auto;
padding-inline: 1.5rem; /* 24px on mobile */

@media (min-width: 640px) {
  padding-inline: 7rem; /* 112px on tablet+ */
}
```

### 4.4 Grid System

**ResponsiveGrid** — use for card grids:

| Columns | Collapse   | Behavior                          |
| ------- | ---------- | --------------------------------- |
| 2       | sm (640px) | 1 col → 2 cols                    |
| 3       | sm (640px) | 1 col → 2 cols → 3 cols at 1024px |
| 3       | md (768px) | 1 col → 3 cols                    |
| 4       | sm (640px) | 1 col → 2 cols → 4 cols at 1024px |

Default gap: `1.5rem`. Override with the `gap` prop.

**SplitLayout** — use for two-column content:

| Prop              | Default   | Options                                       |
| ----------------- | --------- | --------------------------------------------- |
| `ratio`           | `1fr 1fr` | Any grid-template value: `7fr 5fr`, `2fr 1fr` |
| `collapseAt`      | `md`      | `sm` / `md` / `lg`                            |
| `gap`             | `0`       | Any CSS length                                |
| `alignItems`      | `stretch` | `start` / `center` / `stretch`                |
| `reverseOnMobile` | `false`   | Swap column order below collapse point        |

### 4.5 Spacing Decisions

- **Between sections**: handled by `<Section>` padding (5rem) — don't add extra margin between sections
- **SectionIntro to content**: `margin-block-end: 3rem` (default in SectionIntro)
- **Grid gaps**: `1.25rem` to `2rem` for card grids
- **Split layout gaps**: `2rem` to `3rem` typical
- **Card internal padding**: `1rem` to `1.5rem`

---

## 5. Component Patterns

### 5.1 Section Anatomy

Every section follows the same skeleton:

```astro
<Section background="var(--color-surface-light)" aria-labelledby="section-id">
  <SectionContainer>
    <SectionIntro headingId="section-id" colorScheme="light" align="center">
      <Fragment slot="tag"><SectionTag>Label</SectionTag></Fragment>
      <Fragment slot="heading">Section Title</Fragment>
      <Fragment slot="description">Supporting description text.</Fragment>
    </SectionIntro>

    <!-- Content: grid, split, cards, etc. -->
  </SectionContainer>
</Section>
```

**Rules:**

- Always pass `aria-labelledby` to `<Section>` matching the `headingId` on `<SectionIntro>`
- Use `colorScheme="dark"` when the section has a dark background
- `SectionTag` goes in the `tag` slot when the section needs a category label above the heading
- Default SectionIntro alignment is `center`; use `start` for left-aligned split layouts

### 5.2 Button Variants

`<ButtonLink>` — Astro component, 4 variants:

| Variant   | Background               | Border       | Text                    | Use                               |
| --------- | ------------------------ | ------------ | ----------------------- | --------------------------------- |
| `primary` | `--color-primary`        | primary      | white                   | Primary CTA — one per section max |
| `outline` | transparent              | primary      | primary                 | Secondary actions                 |
| `ghost`   | `--color-border-on-dark` | `--white-12` | `--color-on-dark-muted` | Tertiary actions on dark surfaces |
| `on-dark` | transparent              | white        | white                   | Actions on dark backgrounds       |

All buttons: `height: 48px`, `border-radius: 28px` (pill), `font-weight: 600`, `padding-inline: 2rem`.

Hover behavior:

- **primary**: darkens to `--color-primary-hover`, shadow lifts
- **outline**: fills with primary, text flips to white
- **ghost**: background lightens, text brightens
- **on-dark**: fills white, text flips to dark

Pair buttons with `<ActionRow>` for horizontal button groups.

### 5.3 Card Patterns

**ContentCard** — base card with HoverCard wrapper for lift effect on hover
**ImageOverlayCard** — image background with gradient overlay and text on top
**CaseStudyCard** — image + tags + metrics strip + title
**ArticleCard** — image + label + title + author metadata + arrow link
**NumberedCard** — number overlay + title + description (for numbered lists/processes)
**FlipCard** — 3D flip on hover, front image / back content
**DashedCard** — dashed border, for less prominent items (press releases)
**SkewedCard** — CSS skew transform for visual interest (stats)
**TrapezoidStatCard** — stat number + label in trapezoid shape

### 5.4 CTA Patterns

Three CTA approaches by prominence:

1. **CTASection composition** — centered text + buttons, used as standalone section (`LetsBuildCTASection`, `CareersCtaSection`, `InsightsCTASection`)
2. **TextBlockWithActions** — heading + body + button row, used inside split layouts
3. **SectionIntro with action slot** — heading + description + inline button, for lighter CTAs within content sections

### 5.5 SectionIntro Customization

SectionIntro accepts CSS variable overrides via props:

| Prop                  | CSS Variable            | Default                          |
| --------------------- | ----------------------- | -------------------------------- |
| `headingSize`         | `--si-heading-size`     | `var(--font-size-display)`       |
| `headingWeight`       | `--si-heading-weight`   | `700`                            |
| `bodySize`            | `--si-body-size`        | `var(--font-size-lead)`          |
| `bodyWeight`          | `--si-body-weight`      | `500`                            |
| `bodyLineHeight`      | `--si-body-line-height` | `1.65`                           |
| `bodyColor`           | `--si-body-color`       | foreground / on-dark (by scheme) |
| `marginBlockEnd`      | `--si-margin-block-end` | `3rem`                           |
| `descriptionMaxWidth` | inline style            | `50rem`                          |

Shortcut: `size="lg"` sets heading to `display` size and body to `lead` size.

---

## 6. Surfaces & Elevation

### 6.1 Shadow Scale

| Token                  | Value                           | Use                                   |
| ---------------------- | ------------------------------- | ------------------------------------- |
| `--shadow-soft`        | `4px 4px 4px rgba(0,0,0,0.06)`  | Subtle depth on light cards           |
| `--shadow-subtle`      | `0 4px 4px rgba(0,0,0,0.10)`    | Default card shadow                   |
| `--shadow-card`        | `2px 4px 10px rgba(0,0,0,0.15)` | Standard card elevation               |
| `--shadow-hover`       | `0 4px 24px rgba(0,0,0,0.08)`   | Card hover state                      |
| `--shadow-elevated`    | `0 8px 24px rgba(0,0,0,0.08)`   | Lifted elements (dropdowns, popovers) |
| `--shadow-heavy`       | `0 12px 32px rgba(0,0,0,0.15)`  | Modals, overlays                      |
| `--shadow-overlay`     | `0 12px 32px rgba(0,0,0,0.2)`   | Full overlay panels                   |
| `--shadow-testimonial` | `4px 8px 24px rgba(0,0,0,0.12)` | Testimonial cards                     |

### 6.2 Primary Button Shadows

| Token                            | Use                                     |
| -------------------------------- | --------------------------------------- |
| `--shadow-primary-button-subtle` | Default button rest state (10% opacity) |
| `--shadow-primary-button`        | Emphasized button (25% opacity)         |
| `--shadow-primary-button-hover`  | Button hover — lifts shadow             |

### 6.3 Glass Effect

For frosted overlays (used in InlineInputButton, newsletter forms):

```css
background: var(--white-60);
border: 2px solid var(--white-65);
backdrop-filter: blur(8px);
```

### 6.4 Image Overlays

Gradient overlays on image cards:

```css
/* Bottom-up gradient for text readability */
background: linear-gradient(to top, var(--black-70) 0%, var(--black-10) 50%);

/* Full overlay for modals */
background: var(--overlay-dark); /* rgba(0,0,0,0.8) */
```

---

## 7. Motion & Transitions

### 7.1 Rules

- **Duration**: `150ms` for micro-interactions (hover, focus). `300ms–500ms` for layout changes (carousel slides, flip cards)
- **Always specify properties**: `transition: background-color 150ms, border-color 150ms, box-shadow 150ms` — never `transition: all`
- **Easing**: default ease for simple hovers. `cubic-bezier(0.4, 0, 0.2, 1)` for flip/transform animations
- **`will-change`**: only on elements that animate transforms (carousels, flip cards). Never on static elements
- **`-webkit-backface-visibility: hidden`**: required alongside `backface-visibility: hidden` for 3D transforms

### 7.2 Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Zoom in */
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 7.3 Hover Patterns

- **Cards**: `box-shadow` transition from `--shadow-card` to `--shadow-hover`, optional `transform: scale(1.02)`
- **Buttons**: background/border color swap + shadow lift (see Button Variants)
- **Links/ArrowLink**: color transition + arrow translate

---

## 8. Responsive Strategy

### 8.1 Breakpoints

| Token | Width  | Role                                                       |
| ----- | ------ | ---------------------------------------------------------- |
| `sm`  | 640px  | Mobile → tablet. Grid collapses, container padding expands |
| `md`  | 768px  | Navigation shows, split layouts expand                     |
| `lg`  | 1024px | Full grid columns, large layouts                           |
| `xl`  | 1280px | Wide content                                               |
| `2xl` | 1536px | Max breakpoint                                             |

**Max content width**: 1440px (set on `<body>` and `<SectionContainer>`)

### 8.2 Collapse Patterns

- **Navigation**: hamburger below 768px, full nav at 768px+
- **Split layouts**: single column below collapse point, two columns above
- **3-column grids**: 1 col → 2 cols (640px) → 3 cols (1024px)
- **4-column grids**: 1 col → 2 cols (640px) → 4 cols (1024px)
- **Hero**: `min-block-size: 100dvh` mobile, `60rem` desktop (768px+)

### 8.3 Container Padding

| Breakpoint | Inline Padding |
| ---------- | -------------- |
| < 640px    | 1.5rem (24px)  |
| >= 640px   | 7rem (112px)   |

Header/Footer use `4rem` inline padding at 640px+.

---

## 9. Dark Mode

### 9.1 Mechanism

Toggled via `.dark` class on `<html>`. Managed by `ThemeToggle` component + localStorage persistence.

### 9.2 Key Overrides

| Token                      | Light     | Dark                          |
| -------------------------- | --------- | ----------------------------- |
| `--color-primary`          | `#e7453a` | `#ec5547` (slightly brighter) |
| `--color-background`       | `#ffffff` | `#0a0a0a`                     |
| `--color-foreground`       | `#0a0a0a` | `#fafafa`                     |
| `--color-muted`            | `#f5f5f5` | `#262626`                     |
| `--color-muted-foreground` | `#737373` | `#a3a3a3`                     |
| `--color-border`           | `#e5e5e5` | `#404040`                     |

### 9.3 Shadow Adjustments

All shadows increase opacity in dark mode (e.g., `--shadow-card` goes from `0.15` to `0.4` alpha) to maintain visible depth on dark backgrounds.

### 9.4 Authoring Rule

Always use CSS custom properties for colors — never raw hex. This ensures dark mode works automatically. Components with `colorScheme="dark"` prop handle text/heading color switching through scoped styles.

---

## 10. Recipes

### 10.1 New Section

1. Create `packages/ui/src/sections/MySection/MySection.astro`
2. Structure:

```astro
---
import Section from '../../primitives/Section/Section.astro';
import SectionContainer from '../../primitives/SectionContainer/SectionContainer.astro';
import SectionIntro from '../../compositions/SectionIntro/SectionIntro.astro';
import SectionTag from '../../compositions/SectionTag/SectionTag.astro';
---

<Section background="var(--color-background)" aria-labelledby="my-section-heading">
  <SectionContainer>
    <SectionIntro headingId="my-section-heading" colorScheme="light" align="center">
      <Fragment slot="tag"><SectionTag>Category</SectionTag></Fragment>
      <Fragment slot="heading">Section Title</Fragment>
      <Fragment slot="description">Description text here.</Fragment>
    </SectionIntro>

    <!-- Your content -->
  </SectionContainer>
</Section>
```

3. Export from `packages/ui/src/sections/index.ts`
4. Import in the page file (`apps/web/src/pages/`)
5. Add to `documentation/component-map.md`

### 10.2 New Card Grid Section

```astro
<Section aria-labelledby="grid-heading">
  <SectionContainer>
    <SectionIntro headingId="grid-heading" colorScheme="light" align="center">
      <Fragment slot="heading">Grid Title</Fragment>
    </SectionIntro>

    <ResponsiveGrid columns={3} collapseAt="sm" gap="1.5rem">
      {items.map((item) => <MyCard {...item} />)}
    </ResponsiveGrid>
  </SectionContainer>
</Section>
```

### 10.3 New Split Content Section

```astro
<Section background="var(--color-surface-light)" aria-labelledby="split-heading">
  <SectionContainer>
    <SplitLayout ratio="7fr 5fr" collapseAt="lg" gap="2rem" alignItems="center">
      <div slot="start">
        <TextBlockWithActions headingId="split-heading" colorScheme="light">
          <Fragment slot="heading">Heading</Fragment>
          <Fragment slot="body">Body text.</Fragment>
          <Fragment slot="actions">
            <ButtonLink href="/contact" variant="primary">Get Started</ButtonLink>
            <ButtonLink href="/about" variant="outline">Learn More</ButtonLink>
          </Fragment>
        </TextBlockWithActions>
      </div>
      <div slot="end">
        <RoundedImage src={image} alt="Description" width={600} height={400} />
      </div>
    </SplitLayout>
  </SectionContainer>
</Section>
```

### 10.4 New CTA Section

```astro
<Section background="var(--color-surface-dark)" aria-labelledby="cta-heading">
  <CTASection>
    <TextBlock colorScheme="dark" headingId="cta-heading">
      <Fragment slot="heading">Ready to Build?</Fragment>
      <Fragment slot="body">Contact us to discuss your project.</Fragment>
    </TextBlock>
    <ButtonLink href="/contact" variant="primary">Get in Touch</ButtonLink>
  </CTASection>
</Section>
```

### 10.5 New React Island

1. Create `packages/ui/src/compositions/MyWidget/MyWidget.tsx` + `MyWidget.module.css`
2. Follow CSS Module rules in `styling.md`
3. Export from `packages/ui/src/compositions/index.ts`
4. Use in Astro section with hydration directive:

```astro
<MyWidget client:visible data={items} />
```

### 10.6 Choosing a Hydration Directive

| Need                                        | Directive                   |
| ------------------------------------------- | --------------------------- |
| Must work on page load (nav, cookie banner) | `client:load`               |
| Interactive but can wait until scrolled to  | `client:visible`            |
| No interactivity needed                     | No directive (static Astro) |

---

## 11. Border Radius

| Token           | Value  | Use                        |
| --------------- | ------ | -------------------------- |
| `--radius-xs`   | 4px    | Small badges, tags         |
| `--radius-sm`   | 2px    | Subtle rounding            |
| `--radius-md`   | 6px    | Default card corners       |
| `--radius-lg`   | 8px    | Larger cards               |
| `--radius-xl`   | 12px   | Prominent cards            |
| `--radius-2xl`  | 16px   | Large panels               |
| `--radius-3xl`  | 24px   | Rounded panels             |
| `--radius-4xl`  | 28px   | Buttons (pill shape)       |
| `--radius-5xl`  | 72px   | Extra-large rounded panels |
| `--radius-full` | 9999px | Circles, pills             |

**Button radius**: `28px` (pill shape) — consistent across all variants.

---

## 12. Icon System

`<Icon>` primitive wraps Lucide icons with consistent sizing:

- Default size: 24px
- Stroke width: customizable via `strokeWidth` prop
- Color: inherits from parent `color` CSS property
- `<GradientIcon>`: SVG icons with `linearGradient` fill from `--color-primary` to `--color-primary-gradient-end`

---

## 13. Accessibility Checklist

- Every `<Section>` has `aria-labelledby` pointing to its heading `id`
- Heading hierarchy: one `h1` per page, `h2` for sections, `h3` for cards
- All images use Astro `<Image>` with `alt` text, explicit `width`/`height`
- Interactive elements have visible focus styles
- Color contrast: light text on dark only via `--color-on-dark` tokens (ensures sufficient contrast)
- Obfuscated contact links (`ObfuscatedLink`) for email/phone spam protection
- `.sr-only` class available for screen-reader-only content

---

## Quick Reference: Token Source Files

| Tokens                | File                                        |
| --------------------- | ------------------------------------------- |
| Colors                | `packages/shared/src/tokens/colors.ts`      |
| Dark Mode Overrides   | `packages/shared/src/tokens/dark.ts`        |
| Typography            | `packages/shared/src/tokens/typography.ts`  |
| Spacing               | `packages/shared/src/tokens/spacing.ts`     |
| Opacity               | `packages/shared/src/tokens/opacity.ts`     |
| Border Radius         | `packages/shared/src/tokens/radii.ts`       |
| Shadows               | `packages/shared/src/tokens/shadows.ts`     |
| Breakpoints           | `packages/shared/src/tokens/breakpoints.ts` |
| CSS Custom Properties | `packages/ui/styles/globals.css`            |
| Tailwind Config       | `tooling/tailwind/preset.ts`                |
| Component Map         | `documentation/component-map.md`            |
