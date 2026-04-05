export const fontFamilies = {
  sans: ['Degular', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  accent: ['Oxanium', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const fluidFontSizes = {
  caption: 'clamp(0.75rem, 0.704rem + 0.19vw, 0.875rem)', // 12px → 14px
  'body-sm': 'clamp(0.8125rem, 0.794rem + 0.09vw, 0.875rem)', // 13px → 14px
  body: 'clamp(0.875rem, 0.829rem + 0.19vw, 1rem)', // 14px → 16px
  'body-lg': 'clamp(1rem, 0.95rem + 0.2vw, 1.125rem)', // 16px → 18px
  lead: 'clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)', // 18px → 20px
  sub: 'clamp(1.25rem, 1.15rem + 0.4vw, 1.375rem)', // 20px → 22px
  h4: 'clamp(1.25rem, 1rem + 1vw, 1.5rem)', // 20px → 24px
  h3: 'clamp(1.5rem, 1rem + 2vw, 2rem)', // 24px → 32px
  h2: 'clamp(1.75rem, 1.15rem + 2.5vw, 2.25rem)', // 28px → 36px
  h1: 'clamp(2rem, 1.2rem + 3.5vw, 2.5rem)', // 32px → 40px
  display: 'clamp(2.25rem, 1.2rem + 4.5vw, 3rem)', // 36px → 48px
  hero: 'clamp(2.75rem, 1.3rem + 5.5vw, 3.625rem)', // 44px → 58px
  stat: 'clamp(3rem, 1.5rem + 6vw, 4.75rem)', // 48px → 76px
  mega: 'clamp(3.625rem, 1.5rem + 7vw, 5.625rem)', // 58px → 90px
} as const;

export const lineHeights = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;
