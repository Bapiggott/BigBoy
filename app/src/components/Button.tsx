import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, spacing, borderRadius, layout } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  icon,
  iconPosition = 'left',
}) => {
  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary.main}
        />
      );
    }

    const textElement = (
      <Text
        style={[
          styles.text,
          styles[`${variant}Text`],
          styles[`${size}Text`],
          isDisabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    return (
      <View style={styles.contentRow}>
        {iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        {textElement}
        {iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
  },
  
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  iconLeft: {
    marginRight: spacing.sm,
  },
  
  iconRight: {
    marginLeft: spacing.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary.main,
  },
  secondary: {
    backgroundColor: colors.secondary.main,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: layout.buttonHeightSmall,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: layout.buttonHeight,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    minHeight: layout.buttonHeight + 8,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Text base
  text: {
    ...typography.button,
  },
  
  // Text variants
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary.main,
  },
  ghostText: {
    color: colors.primary.main,
  },
  
  // Text sizes
  smallText: {
    ...typography.buttonSmall,
  },
  mediumText: {
    ...typography.button,
  },
  largeText: {
    ...typography.button,
    fontSize: 18,
  },
  
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
