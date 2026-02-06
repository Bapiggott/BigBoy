import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { brandTheme, colors, spacing, typography } from '../theme';
import { useCart } from '../store';

const safeBrandColors = brandTheme?.colors ?? {
  primary: colors.primary.main,
  secondary: colors.secondary.main,
  cream: colors.background,
  dark: colors.text.primary,
  card: colors.surface,
  chipBg: colors.primary.light,
  chipText: colors.primary.main,
};

const safeBrandSpacing = brandTheme?.spacing ?? spacing;

type BrandedHeaderProps = {
  title?: string;
  centerSlot?: React.ReactNode;
  promoLabel?: string;
  rightSlot?: React.ReactNode;
  onLogoPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  showActions?: boolean;
  showHeart?: boolean;
  showCart?: boolean;
};

const logoSource: ImageSourcePropType = require('../../assets/brand/bigboy-logo-modern.png');

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  title,
  centerSlot,
  promoLabel,
  rightSlot,
  onLogoPress,
  showBack = false,
  onBackPress,
  showActions = true,
  showHeart = true,
  showCart = true,
}) => {
  const [logoError, setLogoError] = useState(false);
  const navigation = useNavigation<any>();
  const { itemCount } = useCart();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleLogoPress = () => {
    if (onLogoPress) {
      onLogoPress();
      return;
    }
    navigation.navigate('HomeTab', { screen: 'Home' });
  };

  const handleFavoritesPress = () => {
    navigation.navigate('MenuTab', { screen: 'Favorites' });
  };

  const handleCartPress = () => {
    navigation.navigate('MenuTab', { screen: 'Cart' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
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
        )}
      </View>

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
        {showActions && (
          <View style={styles.actionRow}>
            {showHeart && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleFavoritesPress}
                accessibilityRole="button"
                accessibilityLabel="Favorites"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="heart-outline" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            )}
            {showCart && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCartPress}
                accessibilityRole="button"
                accessibilityLabel="Cart"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="cart-outline" size={20} color={colors.text.primary} />
                {itemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{itemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
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
    backgroundColor: safeBrandColors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  left: {
    width: 76,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFallback: {
    ...typography.labelMedium,
    color: safeBrandColors.dark,
    fontWeight: '700',
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
    gap: safeBrandSpacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: safeBrandSpacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  logo: {
    width: 62,
    height: 44,
  },
  logoFallback: {
    ...typography.labelMedium,
    color: safeBrandColors.primary,
    fontWeight: '800',
  },
  title: {
    ...typography.titleLarge,
    color: safeBrandColors.dark,
    fontWeight: '800',
  },
  promoChip: {
    backgroundColor: safeBrandColors.chipBg,
    borderRadius: 999,
    paddingHorizontal: safeBrandSpacing.sm,
    paddingVertical: safeBrandSpacing.xs,
  },
  promoText: {
    ...typography.labelSmall,
    color: safeBrandColors.chipText,
    fontWeight: '700',
  },
});

export default BrandedHeader;
