import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { BrandedHeader, Card } from '../../components';
import { useUser, useToast } from '../../store';
import { AccountStackParamList } from '../../navigation/types';

type AccountNavigation = NativeStackNavigationProp<AccountStackParamList, 'Account'>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, showBadge, badgeText }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={20} color={colors.primary.main} />
      </View>
      <Text style={styles.menuItemLabel}>{label}</Text>
    </View>
    <View style={styles.menuItemRight}>
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </View>
  </TouchableOpacity>
);

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<AccountNavigation>();
  const { user, logout, isAuthenticated } = useUser();
  const { showToast } = useToast();
  
  // Admin access via long press
  const longPressCount = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionPress = () => {
    longPressCount.current += 1;
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = setTimeout(() => {
      longPressCount.current = 0;
    }, 3000);
    
    if (longPressCount.current >= 7) {
      longPressCount.current = 0;
      navigation.navigate('Admin');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast('Signed out successfully', 'info');
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return colors.gold;
      case 'silver': return colors.silver;
      default: return colors.bronze;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
      {/* User Profile Card */}
      {isAuthenticated && user && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </View>

            {/* Loyalty Status */}
            <View style={styles.loyaltySection}>
              <View style={styles.loyaltyRow}>
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(user.loyaltyStatus?.tier || 'bronze') + '20' }]}>
                  <Ionicons
                    name="shield"
                    size={14}
                    color={getTierColor(user.loyaltyStatus?.tier || 'bronze')}
                  />
                  <Text style={[styles.tierText, { color: getTierColor(user.loyaltyStatus?.tier || 'bronze') }]}>
                    {(user.loyaltyStatus?.tier || 'bronze').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.pointsText}>
                  {user.loyaltyStatus?.currentPoints?.toLocaleString() || 0} points
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      )}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Card padding="none">
          <MenuItem
            icon="person-outline"
            label="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <MenuItem
            icon="card-outline"
            label="Payment Methods"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          <MenuItem
            icon="location-outline"
            label="Saved Addresses"
            onPress={() => navigation.navigate('SavedAddresses')}
          />
          <MenuItem
            icon="heart-outline"
            label="Favorites"
            onPress={() => navigation.getParent()?.navigate('MenuTab', { screen: 'Favorites' })}
          />
          <MenuItem
            icon="gift-outline"
            label="Gift Cards"
            onPress={() => navigation.navigate('GiftCards')}
          />
        </Card>
      </View>

      {/* Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders</Text>
        <Card padding="none">
          <MenuItem
            icon="receipt-outline"
            label="Order History"
            onPress={() => navigation.navigate('OrderHistory')}
          />
        </Card>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card padding="none">
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={() => navigation.navigate('Preferences')}
          />
        </Card>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Card padding="none">
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
          />
        </Card>
      </View>

      {/* Sign Out */}
      {isAuthenticated && (
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      {/* Version (tap 7 times for admin) */}
      <TouchableOpacity
        style={styles.versionContainer}
        onPress={handleVersionPress}
        activeOpacity={1}
      >
        <Text style={styles.versionText}>Big Boy App v1.0.0</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.titleLarge,
    color: colors.white,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  loyaltySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  loyaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tierText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  pointsText: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  menuIconFallback: {
    ...typography.labelMedium,
    color: colors.primary.main,
    fontWeight: '700',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.white,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  signOutText: {
    ...typography.bodyLarge,
    color: colors.error,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
});

export default AccountScreen;
