/**
 * Generates the @theme and .dark CSS blocks from TS design tokens.
 *
 * Run: npx tsx tooling/scripts/generate-theme-css.ts
 *
 * Output: packages/ui/styles/_generated-theme.css
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  colorSemantics,
  colorPrimitives,
  fontFamilies,
  fluidFontSizes,
  radii,
  shadows,
  whiteOpacity,
  blackOpacity,
  compositeOpacity,
  colorSemanticsDark,
  blackOpacityDark,
  compositeOpacityDark,
  shadowsDark,
} from '@bool/shared/tokens';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '../../packages/ui/styles/_generated-theme.css');

function cssVar(name: string, value: string): string {
  return `  ${name}: ${value};`;
}

function fontStack(families: readonly string[]): string {
  return families
    .map((f) => {
      if (f.startsWith('ui-') || f === 'system-ui' || f === 'sans-serif' || f === 'monospace' || f === 'serif') {
        return f;
      }
      return `'${f}'`;
    })
    .join(', ');
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateTheme(): string {
  const lines: string[] = [];

  lines.push('/* Auto-generated from @bool/shared/tokens — do not edit by hand */');
  lines.push('/* Run: npx tsx tooling/scripts/generate-theme-css.ts */');
  lines.push('');
  lines.push('@theme {');

  // Semantic colors
  lines.push(cssVar('--color-primary', colorSemantics.primary));
  lines.push(cssVar('--color-primary-foreground', colorSemantics.primaryForeground));
  lines.push(cssVar('--color-background', colorSemantics.background));
  lines.push(cssVar('--color-foreground', colorSemantics.foreground));
  lines.push(cssVar('--color-muted', colorSemantics.muted));
  lines.push(cssVar('--color-muted-foreground', colorSemantics.mutedForeground));
  lines.push(cssVar('--color-border', colorSemantics.border));
  lines.push(cssVar('--color-ring', colorSemantics.ring));
  lines.push(cssVar('--color-destructive', colorSemantics.destructive));
  lines.push(cssVar('--color-destructive-foreground', colorSemantics.destructiveForeground));
  lines.push(cssVar('--color-surface-dark', colorSemantics.surfaceDark));
  lines.push(cssVar('--color-surface-charcoal', colorSemantics.surfaceCharcoal));
  lines.push(cssVar('--color-surface-warm-dark', colorPrimitives.neutral[850].replace('#1a1a1a', '#2b2926')));

  // surface-warm-dark is a special value not directly in primitives
  // Override with the correct value
  lines[lines.length - 1] = cssVar('--color-surface-warm-dark', '#2b2926');

  lines.push(cssVar('--color-surface-black', colorSemantics.surfaceBlack));
  lines.push(cssVar('--color-surface-light', colorSemantics.surfaceLight));
  lines.push(cssVar('--color-surface-mid', colorSemantics.surfaceMid));
  lines.push(cssVar('--color-surface-muted', colorSemantics.surfaceMuted));
  lines.push(cssVar('--color-primary-tint', colorSemantics.primaryTint));
  lines.push(cssVar('--color-primary-hover', colorSemantics.primaryHover));
  lines.push(cssVar('--color-primary-light', colorSemantics.primaryLight));
  lines.push(cssVar('--color-on-dark', colorSemantics.onDark));
  lines.push(cssVar('--color-on-dark-muted', colorSemantics.onDarkMuted));
  lines.push(cssVar('--color-on-dark-subtle', colorSemantics.onDarkSubtle));
  lines.push(cssVar('--color-border-on-dark', colorSemantics.borderOnDark));
  lines.push(cssVar('--color-success', colorSemantics.success));

  // White opacity scale
  for (const [key, value] of Object.entries(whiteOpacity)) {
    lines.push(cssVar(`--white-${key}`, value));
  }

  // Black opacity scale
  for (const [key, value] of Object.entries(blackOpacity)) {
    lines.push(cssVar(`--black-${key}`, value));
  }

  // Composite opacity tokens
  const compositeMap: Record<string, string> = {
    overlayDark: '--overlay-dark',
    muted45: '--muted-45',
    warmDark10: '--warm-dark-10',
    warmDark50: '--warm-dark-50',
    overlayImage: '--overlay-image',
    overlayImageLight: '--overlay-image-light',
    overlayImageHeavy: '--overlay-image-heavy',
    primary20: '--primary-20',
    primary30: '--primary-30',
    primary8: '--primary-8',
    borderWarmDark: '--border-warm-dark',
  };
  for (const [key, varName] of Object.entries(compositeMap)) {
    lines.push(cssVar(varName, compositeOpacity[key as keyof typeof compositeOpacity]));
  }

  // Neutral + accent colors
  lines.push(cssVar('--color-neutral-300', colorPrimitives.neutral[300]));
  lines.push(cssVar('--color-neutral-550', colorPrimitives.neutral[550]));
  lines.push(cssVar('--color-accent-blue', colorPrimitives.accent.blue));
  lines.push(cssVar('--color-accent-teal', colorPrimitives.accent.teal));
  lines.push(cssVar('--color-accent-purple', colorPrimitives.accent.purple));
  lines.push(cssVar('--color-accent-orange', colorPrimitives.accent.orange));
  lines.push(cssVar('--color-accent-navy', colorPrimitives.accent.navy));
  lines.push(cssVar('--color-accent-dark-green', colorPrimitives.accent.darkGreen));
  lines.push(cssVar('--color-primary-gradient-end', colorSemantics.primaryGradientEnd));

  // Font families
  lines.push(cssVar('--font-sans', fontStack(fontFamilies.sans)));
  lines.push(cssVar('--font-display', fontStack(fontFamilies.sans)));
  lines.push(cssVar('--font-accent', fontStack(fontFamilies.accent)));
  lines.push(cssVar('--font-mono', fontStack(fontFamilies.mono)));

  // Border radii
  for (const [key, value] of Object.entries(radii)) {
    lines.push(cssVar(`--radius-${key}`, value));
  }

  // Shadows (only named design tokens, not Tailwind size aliases)
  const shadowTokens = ['card', 'subtle', 'soft', 'dark-card', 'hover', 'elevated', 'heavy', 'overlay', 'testimonial', 'primary-button', 'primary-button-subtle', 'primary-button-hover'];
  for (const key of shadowTokens) {
    lines.push(cssVar(`--shadow-${key}`, shadows[key as keyof typeof shadows]));
  }

  // Fluid font sizes
  for (const [key, value] of Object.entries(fluidFontSizes)) {
    lines.push(cssVar(`--font-size-${key}`, value));
  }

  lines.push('}');
  lines.push('');

  // Dark mode overrides
  lines.push('.dark {');
  lines.push(cssVar('color-scheme', 'dark'));
  lines.push(cssVar('--color-primary', colorSemanticsDark.primary));
  lines.push(cssVar('--color-primary-foreground', colorSemanticsDark.primaryForeground));
  lines.push(cssVar('--color-background', colorSemanticsDark.background));
  lines.push(cssVar('--color-foreground', colorSemanticsDark.foreground));
  lines.push(cssVar('--color-muted', colorSemanticsDark.muted));
  lines.push(cssVar('--color-muted-foreground', colorSemanticsDark.mutedForeground));
  lines.push(cssVar('--color-border', colorSemanticsDark.border));
  lines.push(cssVar('--color-ring', colorSemanticsDark.ring));
  lines.push(cssVar('--color-destructive', colorSemanticsDark.destructive));
  lines.push(cssVar('--color-destructive-foreground', colorSemanticsDark.destructiveForeground));
  lines.push(cssVar('--color-surface-light', colorSemanticsDark.surfaceLight));
  lines.push(cssVar('--color-surface-mid', colorSemanticsDark.surfaceMid));
  lines.push(cssVar('--color-surface-muted', colorSemanticsDark.surfaceMuted));
  lines.push(cssVar('--color-primary-tint', colorSemanticsDark.primaryTint));
  lines.push(cssVar('--color-primary-hover', colorSemanticsDark.primaryHover));
  lines.push(cssVar('--color-primary-light', colorSemanticsDark.primaryLight));
  lines.push(cssVar('--color-neutral-300', colorSemanticsDark.neutral300));
  lines.push(cssVar('--color-neutral-550', colorSemanticsDark.neutral550));
  lines.push(cssVar('--color-primary-gradient-end', colorSemanticsDark.primaryGradientEnd));

  // Dark black opacity overrides
  for (const [key, value] of Object.entries(blackOpacityDark)) {
    lines.push(cssVar(`--black-${key}`, value));
  }

  // Dark composite opacity overrides
  const darkCompositeMap: Record<string, string> = {
    overlayDark: '--overlay-dark',
    overlayImage: '--overlay-image',
    overlayImageLight: '--overlay-image-light',
    overlayImageHeavy: '--overlay-image-heavy',
    primary20: '--primary-20',
    primary30: '--primary-30',
    primary8: '--primary-8',
    borderWarmDark: '--border-warm-dark',
  };
  for (const [key, varName] of Object.entries(darkCompositeMap)) {
    lines.push(cssVar(varName, compositeOpacityDark[key as keyof typeof compositeOpacityDark]));
  }

  // Dark shadow overrides
  for (const key of shadowTokens) {
    if (key in shadowsDark) {
      lines.push(cssVar(`--shadow-${key}`, shadowsDark[key as keyof typeof shadowsDark]));
    }
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

const css = generateTheme();
writeFileSync(OUTPUT, css, 'utf-8');
console.log(`Generated ${OUTPUT}`);
