import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootTabParamList } from './types';
import { colors, spacing } from '../theme';
import { useCart } from '../store/CartContext';

import HomeStack from './HomeStack';
import MenuStack from './MenuStack';
import RewardsStack from './RewardsStack';
import AccountStack from './AccountStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

type TabIconName =
  | 'home-variant'
  | 'home-variant-outline'
  | 'silverware-fork-knife'
  | 'gift-outline'
  | 'account-outline';

const getTabIcon = (routeName: string, focused: boolean): TabIconName => {
  const icons: Record<string, { focused: TabIconName; unfocused: TabIconName }> = {
    HomeTab: { focused: 'home-variant', unfocused: 'home-variant-outline' },
    MenuTab: { focused: 'silverware-fork-knife', unfocused: 'silverware-fork-knife' },
    RewardsTab: { focused: 'gift-outline', unfocused: 'gift-outline' },
    AccountTab: { focused: 'account-outline', unfocused: 'account-outline' },
  };
  return icons[routeName]?.[focused ? 'focused' : 'unfocused'] ?? 'home-variant-outline';
};

interface CartBadgeProps {
  count: number;
}

const CartBadge: React.FC<CartBadgeProps> = ({ count }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
};

const TabNavigator: React.FC = () => {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          const iconSize = typeof size === 'number' ? size : 26;
          const iconExists = Boolean(MaterialCommunityIcons?.glyphMap?.[iconName]);
          if (!iconExists) {
            const fallback = route.name === 'HomeTab'
              ? 'H'
              : route.name === 'MenuTab'
              ? 'M'
              : route.name === 'RewardsTab'
              ? 'R'
              : 'P';
            return (
              <View style={styles.fallbackIconWrap}>
                <Text style={[styles.fallbackIconText, { color }]}>{fallback}</Text>
              </View>
            );
          }
          return (
            <View>
              <MaterialCommunityIcons name={iconName} size={iconSize} color={color} />
              {route.name === 'MenuTab' && <CartBadge count={itemCount} />}
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuStack}
        options={{ tabBarLabel: 'Menu' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('MenuTab', {
              screen: 'Menu',
              params: { initialCategoryId: 'all' },
              merge: true,
            });
          },
        })}
      />
      <Tab.Screen
        name="RewardsTab"
        component={RewardsStack}
        options={{ tabBarLabel: 'Rewards' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border.light,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    height: Platform.OS === 'ios' ? 88 : 64,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  fallbackIconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TabNavigator;
