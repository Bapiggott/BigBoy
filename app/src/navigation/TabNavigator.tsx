import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from './types';
import { colors, spacing } from '../theme';
import { useCart } from '../store/CartContext';

import HomeStack from './HomeStack';
import MenuStack from './MenuStack';
import RewardsStack from './RewardsStack';
import LocationsStack from './LocationsStack';
import AccountStack from './AccountStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

type TabIconName = 
  | 'home' | 'home-outline' 
  | 'restaurant' | 'restaurant-outline' 
  | 'gift' | 'gift-outline' 
  | 'location' | 'location-outline' 
  | 'person' | 'person-outline';

const getTabIcon = (routeName: string, focused: boolean): TabIconName => {
  const icons: Record<string, { focused: TabIconName; unfocused: TabIconName }> = {
    HomeTab: { focused: 'home', unfocused: 'home-outline' },
    MenuTab: { focused: 'restaurant', unfocused: 'restaurant-outline' },
    RewardsTab: { focused: 'gift', unfocused: 'gift-outline' },
    LocationsTab: { focused: 'location', unfocused: 'location-outline' },
    AccountTab: { focused: 'person', unfocused: 'person-outline' },
  };
  return icons[routeName]?.[focused ? 'focused' : 'unfocused'] ?? 'home-outline';
};

interface CartBadgeProps {
  count: number;
}

const CartBadge: React.FC<CartBadgeProps> = ({ count }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Ionicons name="cart" size={8} color={colors.text.inverse} />
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
          return (
            <View>
              <Ionicons name={iconName} size={size} color={color} />
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
      />
      <Tab.Screen
        name="RewardsTab"
        component={RewardsStack}
        options={{ tabBarLabel: 'Rewards' }}
      />
      <Tab.Screen
        name="LocationsTab"
        component={LocationsStack}
        options={{ tabBarLabel: 'Locations' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStack}
        options={{ tabBarLabel: 'Account' }}
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
});

export default TabNavigator;
