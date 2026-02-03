import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'medium',
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  
  // Variants
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  filled: {
    backgroundColor: colors.warmGray,
  },
  
  // Padding
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: spacing.sm,
  },
  padding_medium: {
    padding: spacing.lg,
  },
  padding_large: {
    padding: spacing['2xl'],
  },
});

export default Card;
