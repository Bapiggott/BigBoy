/**
 * Brand theme overrides for Big Boy look & feel.
 * Keep this lightweight and safe to adopt incrementally.
 */

export const brandTheme = {
  colors: {
    primary: '#C41230', // Big Boy red
    secondary: '#F4C542', // warm gold
    cream: '#FFF7EE',
    dark: '#2A1B1B',
    card: '#FFFDF9',
    chipBg: '#FFF1D6',
    chipText: '#8A3A00',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fonts: {
    heading: 'System',
    body: 'System',
  },
} as const;
