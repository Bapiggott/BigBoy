import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { brandTheme, colors, spacing, typography } from '../theme';

type BrandedHeaderProps = {
  title?: string;
  centerSlot?: React.ReactNode;
  promoLabel?: string;
  rightSlot?: React.ReactNode;
  onLogoPress?: () => void;
};

const logoSource: ImageSourcePropType = require('../../assets/brand/bigboy-logo-modern.png');

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  title,
  centerSlot,
  promoLabel,
  rightSlot,
  onLogoPress,
}) => {
  const [logoError, setLogoError] = useState(false);
  const navigation = useNavigation<any>();

  const handleLogoPress = () => {
    if (onLogoPress) {
      onLogoPress();
      return;
    }
    navigation.navigate('HomeTab', { screen: 'Home' });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.left}
        onPress={handleLogoPress}
        accessibilityRole="button"
        accessibilityLabel="Go to Home"
      >
        {logoError ? (
          <Text style={styles.logoFallback}>BIG BOY</Text>
        ) : (
          <Image source={logoSource} style={styles.logo} resizeMode="contain" onError={() => setLogoError(true)} />
        )}
      </TouchableOpacity>

      <View style={styles.center}>
        {centerSlot ? centerSlot : title ? <Text style={styles.title}>{title}</Text> : null}
      </View>

      <View style={styles.right}>
        {promoLabel ? (
          <View style={styles.promoChip}>
            <Text style={styles.promoText}>{promoLabel}</Text>
          </View>
        ) : null}
        {rightSlot}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: brandTheme.colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  left: {
    width: 76,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    minWidth: 76,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: brandTheme.spacing.sm,
  },
  logo: {
    width: 62,
    height: 44,
  },
  logoFallback: {
    ...typography.labelMedium,
    color: brandTheme.colors.primary,
    fontWeight: '800',
  },
  title: {
    ...typography.titleLarge,
    color: brandTheme.colors.dark,
    fontWeight: '800',
  },
  promoChip: {
    backgroundColor: brandTheme.colors.chipBg,
    borderRadius: 999,
    paddingHorizontal: brandTheme.spacing.sm,
    paddingVertical: brandTheme.spacing.xs,
  },
  promoText: {
    ...typography.labelSmall,
    color: brandTheme.colors.chipText,
    fontWeight: '700',
  },
});

export default BrandedHeader;
