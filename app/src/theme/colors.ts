/**
 * Big Boy Brand Colors
 * Classic American diner palette: red, white, navy + warm neutrals
 */
export const colors = {
  // Primary brand colors (nested for semantic usage)
  primary: {
    main: '#C8102E',      // Big Boy Red - main brand color
    dark: '#9E0B22',      // Darker red for pressed states
    light: '#FDEAED',     // Lighter red for backgrounds
  },
  
  // Secondary colors
  secondary: {
    main: '#1C2541',      // Navy blue - accent and text
    light: '#3A4A6B',     // Lighter navy
  },
  
  // Text colors
  text: {
    primary: '#1A1A1A',   // Primary text
    secondary: '#4A4540', // Secondary text
    tertiary: '#9A9590',  // Placeholder, hints
    inverse: '#FFFFFF',   // Text on dark backgrounds
  },
  
  // Background colors
  background: '#FFF8F0',  // Main app background (cream)
  surface: '#FFFFFF',     // Cards, modals (white)
  
  // Border colors
  border: {
    main: '#E8E4DC',      // Default border
    light: '#F5F0E8',     // Lighter borders
  },
  
  // Neutrals - warm tones for diner feel
  cream: '#FFF8F0',
  warmGray: '#F5F0E8',
  lightGray: '#E8E4DC',
  mediumGray: '#9A9590',
  darkGray: '#4A4540',
  
  // Pure colors
  white: '#FFFFFF',
  black: '#1A1A1A',
  
  // Semantic colors (flat for easy access)
  success: '#2D8A4E',
  warning: '#D4A017',
  error: '#C8102E',
  info: '#1C2541',
  
  // Semantic colors (nested)
  semantic: {
    success: '#2D8A4E',
    warning: '#D4A017',
    error: '#C8102E',
    info: '#1C2541',
  },
  
  // Rewards/Loyalty specific (flat)
  gold: '#D4A017',
  bronze: '#A67C52',
  silver: '#8C8C8C',
  goldTier: '#D4A017',
  
  // Loyalty colors (nested)
  loyalty: {
    gold: '#D4A017',
    silver: '#8C8C8C',
    bronze: '#A67C52',
  },
  
  // Flat aliases for backward compatibility
  textSecondary: '#4A4540',
  
  // Transparent overlays
  overlay: 'rgba(28, 37, 65, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
  
  // Status colors for orders
  status: {
    pending: '#D4A017',
    confirmed: '#1C2541',
    preparing: '#C8102E',
    ready: '#2D8A4E',
    completed: '#2D8A4E',
    cancelled: '#9A9590',
  },
} as const;

export type ColorName = keyof typeof colors;

// Helper to get tier color
export const getTierColor = (tier: 'bronze' | 'silver' | 'gold'): string => {
  return colors.loyalty[tier];
};

// Helper to get status color
export const getStatusColor = (status: string): string => {
  return colors.status[status as keyof typeof colors.status] || colors.mediumGray;
};
