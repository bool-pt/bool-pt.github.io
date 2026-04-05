import type { Config } from 'tailwindcss';
import {
  colorSemantics,
  fontFamilies,
  fontSizes,
  fluidFontSizes,
  fontWeights,
  lineHeights,
  spacing,
  breakpoints,
  shadows,
  radii,
} from '@bool/shared/tokens';

const preset: Config = {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colorSemantics.primary,
          foreground: colorSemantics.primaryForeground,
        },
        secondary: {
          DEFAULT: colorSemantics.secondary,
          foreground: colorSemantics.secondaryForeground,
        },
        background: colorSemantics.background,
        foreground: colorSemantics.foreground,
        muted: {
          DEFAULT: colorSemantics.muted,
          foreground: colorSemantics.mutedForeground,
        },
        border: colorSemantics.border,
        ring: colorSemantics.ring,
        destructive: {
          DEFAULT: colorSemantics.destructive,
          foreground: colorSemantics.destructiveForeground,
        },
      },
      fontFamily: {
        sans: fontFamilies.sans,
        mono: fontFamilies.mono,
      },
      fontSize: { ...fontSizes, ...fluidFontSizes },
      fontWeight: fontWeights,
      lineHeight: lineHeights,
      spacing,
      screens: breakpoints,
      boxShadow: shadows,
      borderRadius: radii,
    },
  },
};

export default preset;
