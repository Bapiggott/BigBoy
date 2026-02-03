/**
 * Spacing Scale
 * Consistent spacing for margins, padding, gaps
 * Based on 4px base unit
 */
export const spacing = {
  // Base units
  xxs: 2,   // 2px
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 20,   // 20px
  '2xl': 24, // 24px
  '3xl': 32, // 32px
  '4xl': 40, // 40px
  '5xl': 48, // 48px
  '6xl': 64, // 64px
} as const;

/**
 * Border Radius Scale
 */
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

/**
 * Shadow Presets
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1C2541',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1C2541',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1C2541',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#1C2541',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * Common Layout Dimensions
 */
export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  listItemHeight: 56,
  buttonHeight: 52,
  buttonHeightSmall: 40,
  inputHeight: 52,
  tabBarHeight: 80,
  headerHeight: 56,
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  // Touch target minimums (accessibility)
  minTouchTarget: 44,
  // Content max widths
  maxContentWidth: 600,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
