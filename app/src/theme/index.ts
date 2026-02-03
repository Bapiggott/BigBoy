/**
 * Theme Index
 * Central export for all design tokens
 */
export { colors, getTierColor, getStatusColor } from './colors';
export type { ColorName } from './colors';

export { typography } from './typography';
export type { TypographyVariant } from './typography';

export { spacing, borderRadius, shadows, layout } from './spacing';
export type { SpacingKey, BorderRadiusKey, ShadowKey } from './spacing';

// Re-export as a unified theme object for convenience
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows, layout } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;
