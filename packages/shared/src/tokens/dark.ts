import { colorPrimitives } from './colors.ts';

export const colorSemanticsDark = {
  primary: colorPrimitives.red[400],
  primaryForeground: colorPrimitives.neutral[0],
  background: colorPrimitives.neutral[950],
  foreground: colorPrimitives.neutral[50],
  muted: colorPrimitives.neutral[800],
  mutedForeground: colorPrimitives.neutral[400],
  border: colorPrimitives.neutral[700],
  ring: colorPrimitives.red[400],
  destructive: '#f87171',
  destructiveForeground: colorPrimitives.neutral[0],
  surfaceLight: colorPrimitives.neutral[900],
  surfaceMid: colorPrimitives.neutral[850],
  surfaceMuted: colorPrimitives.neutral[800],
  primaryTint: colorPrimitives.red[900],
  primaryHover: colorPrimitives.red[500],
  primaryLight: colorPrimitives.red[200],
  neutral300: colorPrimitives.neutral[600],
  neutral550: colorPrimitives.neutral[300],
  primaryGradientEnd: colorPrimitives.red[400],
} as const;

export const blackOpacityDark = {
  5: 'rgba(255, 255, 255, 0.05)',
  10: 'rgba(255, 255, 255, 0.1)',
  15: 'rgba(255, 255, 255, 0.15)',
  16: 'rgba(255, 255, 255, 0.16)',
  20: 'rgba(255, 255, 255, 0.2)',
  60: 'rgba(255, 255, 255, 0.6)',
  65: 'rgba(255, 255, 255, 0.65)',
  70: 'rgba(255, 255, 255, 0.7)',
  75: 'rgba(255, 255, 255, 0.75)',
} as const;

export const compositeOpacityDark = {
  overlayDark: 'rgba(0, 0, 0, 0.85)',
  overlayImage: 'rgba(10, 10, 10, 0.85)',
  overlayImageLight: 'rgba(10, 10, 10, 0.7)',
  overlayImageHeavy: 'rgba(10, 10, 10, 0.9)',
  primary20: 'rgba(236, 85, 71, 0.2)',
  primary30: 'rgba(236, 85, 71, 0.3)',
  primary8: 'rgba(236, 85, 71, 0.08)',
  borderWarmDark: 'rgba(255, 255, 255, 0.08)',
} as const;

export const shadowsDark = {
  card: '2px 4px 10px rgba(0, 0, 0, 0.4)',
  subtle: '0 4px 4px rgba(0, 0, 0, 0.3)',
  soft: '4px 4px 4px rgba(0, 0, 0, 0.2)',
  'dark-card': '2px 4px 10px rgba(0, 0, 0, 0.5)',
  hover: '0 4px 24px rgba(0, 0, 0, 0.3)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.3)',
  heavy: '0 12px 32px rgba(0, 0, 0, 0.4)',
  overlay: '0 12px 32px rgba(0, 0, 0, 0.5)',
  testimonial: '4px 8px 24px rgba(0, 0, 0, 0.3)',
  'primary-button': '2px 4px 5px rgba(236, 85, 71, 0.3)',
  'primary-button-subtle': '2px 4px 5px rgba(236, 85, 71, 0.15)',
  'primary-button-hover': '0 6px 10px rgba(236, 85, 71, 0.3)',
} as const;
