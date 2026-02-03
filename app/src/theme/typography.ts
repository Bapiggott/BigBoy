import { Platform, TextStyle } from 'react-native';

/**
 * Typography Scale
 * Classic diner aesthetic with strong headlines
 */

// System fonts that work well for the diner aesthetic
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyBold = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Display - for hero sections, splash
  displayLarge: {
    fontFamily: fontFamilyBold,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -1,
  } as TextStyle,
  
  displayMedium: {
    fontFamily: fontFamilyBold,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  
  // Headlines
  headlineLarge: {
    fontFamily: fontFamilyBold,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0,
  } as TextStyle,
  
  headlineMedium: {
    fontFamily: fontFamilyBold,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0,
  } as TextStyle,
  
  headlineSmall: {
    fontFamily: fontFamilyBold,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,
  
  // Titles
  titleLarge: {
    fontFamily: fontFamilyBold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0,
  } as TextStyle,
  
  titleMedium: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.1,
  } as TextStyle,
  
  titleSmall: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,
  
  // Body text
  bodyLarge: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.2,
  } as TextStyle,
  
  bodyMedium: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.2,
  } as TextStyle,
  
  bodySmall: {
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.3,
  } as TextStyle,
  
  // Labels
  labelLarge: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,
  
  labelMedium: {
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.3,
  } as TextStyle,
  
  labelSmall: {
    fontFamily: fontFamily,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.4,
  } as TextStyle,
  
  // Button text
  button: {
    fontFamily: fontFamilyBold,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  
  buttonSmall: {
    fontFamily: fontFamilyBold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  
  // Price display
  price: {
    fontFamily: fontFamilyBold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,
  
  priceLarge: {
    fontFamily: fontFamilyBold,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.5,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
