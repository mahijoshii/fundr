import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#1D0F38',       // Deep Indigo
  primary: '#A020F0',  // Vibrant Violet
  secondary: '#D397F8',// Bright Lavender
  text: '#FFFFFF',     // Pure White
  success: '#70F020',  // Vibrant Green
  outline: 'rgba(255,255,255,0.12)',
  cardShadow: 'rgba(0,0,0,0.4)',
} as const;

export const radius = { md: 12, lg: 16, xl: 22 } as const;
export const spacing = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 } as const;

/** Typed text styles so fontWeight is a literal (not generic string) */
export const fonts: Record<'h1'|'h2'|'p'|'hint', TextStyle> = {
  h1: { fontSize: 32, fontWeight: '800', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  p:  { fontSize: 16,              color: colors.text },
  hint: { fontSize: 13,            color: 'rgba(255,255,255,0.7)' },
};

/** Optional typed containers if you want them */
export const containers: Record<'screen', ViewStyle> = {
  screen: { flex: 1, backgroundColor: colors.bg },
};