---
name: design-qa
description: Mandatory visual QA loop — when implementing from a mockup, image, or Figma design, use Playwright to screenshot the result and compare against the original. Iterate until pixel-accurate.
user-invocable: true
---

# Design QA — Visual Comparison Loop

This skill enforces a **mandatory** visual verification loop whenever you implement UI from a design reference (mockup image, Figma screenshot, or any visual spec). You MUST NOT consider the task complete until the implementation visually matches the reference.

## When This Skill Activates

This workflow is **required** whenever:

- The user provides a mockup image, screenshot, or design file
- The user shares a Figma URL or Figma frame
- The user says "match this design", "implement this mockup", or similar
- The user references a visual spec to implement

## Workflow

### Step 1 — Capture the Reference

Save or note the reference design:

- If the user provided an image file: read it with the Read tool and keep it as the ground truth
- If the user shared a Figma URL: capture it via Figma MCP or screenshot
- Store the reference path for repeated comparison

### Step 2 — Implement the UI

Write the code as normal, following all project conventions from CLAUDE.md.

### Step 3 — Screenshot the Result with Playwright

After implementation, capture the current state:

```bash
# Ensure the dev server is running (Astro project)
playwright-cli open http://localhost:4321
playwright-cli resize 1440 900
playwright-cli screenshot --filename=.playwright-cli/design-qa-current.png
```

For specific sections or viewports:

```bash
# Full page capture
playwright-cli screenshot --filename=.playwright-cli/design-qa-full.png
# Specific element by ref
playwright-cli screenshot e5 --filename=.playwright-cli/design-qa-section.png
```

For responsive checks:

```bash
playwright-cli resize 375 812
playwright-cli screenshot --filename=.playwright-cli/design-qa-mobile.png
playwright-cli resize 768 1024
playwright-cli screenshot --filename=.playwright-cli/design-qa-tablet.png
playwright-cli resize 1440 900
playwright-cli screenshot --filename=.playwright-cli/design-qa-desktop.png
```

### Step 4 — Compare Against the Reference

Read both the reference image and the screenshot using the Read tool (which supports images). Perform a detailed visual comparison checking:

1. **Layout & spacing** — element positions, gaps, padding, margins
2. **Typography** — font sizes, weights, line heights, letter spacing
3. **Colors** — backgrounds, text colors, borders, shadows
4. **Component structure** — correct hierarchy, missing/extra elements
5. **Alignment** — centering, grid alignment, vertical rhythm
6. **Visual details** — border radius, shadows, gradients, opacity
7. **Responsive behavior** — if the reference shows multiple breakpoints

### Step 5 — Document Discrepancies

List every difference found, no matter how small:

- "Header padding is 24px, reference shows ~32px"
- "Button border-radius is rounded-md, reference shows fully rounded (rounded-full)"
- "Missing bottom border on card component"
- "Text color is text-muted-foreground, reference shows a darker shade"

### Step 6 — Fix and Re-iterate (MANDATORY)

**This is non-negotiable.** If ANY discrepancies are found:

1. Fix every listed discrepancy in the code
2. Go back to **Step 3** — take a new screenshot
3. Compare again against the **original reference** (not the previous screenshot)
4. Repeat until ZERO discrepancies remain

**DO NOT:**

- Skip the re-screenshot step after making fixes
- Declare "close enough" — the goal is exact match
- Stop after one iteration if differences remain
- Assume a fix worked without visual verification

### Step 7 — Final Confirmation

Only when the screenshot matches the reference with zero discrepancies:

1. Take a final screenshot as proof
2. Report to the user: "Visual QA passed — implementation matches the reference"
3. Close the browser: `playwright-cli close`

## Iteration Rules

| Rule                       | Detail                                                   |
| -------------------------- | -------------------------------------------------------- |
| Minimum iterations         | At least 2 (initial implementation + first verification) |
| Maximum iterations         | No hard limit — keep going until it matches              |
| What triggers re-iteration | ANY visual difference, no matter how minor               |
| When to stop               | Zero discrepancies between screenshot and reference      |
| Never skip verification    | Even for "small" changes, always re-screenshot           |

## Quick Reference Commands

```bash
# Start browser and navigate
playwright-cli open http://localhost:4321/page-path

# Set viewport
playwright-cli resize 1440 900

# Take comparison screenshot
playwright-cli screenshot --filename=.playwright-cli/design-qa-current.png

# Snapshot DOM for structural inspection
playwright-cli snapshot

# Close when done
playwright-cli close
```

## Integration with Dev Server

For this Astro project, ensure the dev server is running before starting QA:

```bash
# From project root
pnpm dev
```

The dev server runs on `http://localhost:4321` by default. If using a different port, adjust the URL accordingly.
