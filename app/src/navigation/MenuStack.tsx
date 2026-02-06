import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuStackParamList } from './types';
import { colors } from '../theme';

import MenuScreen from '../screens/menu/MenuScreen';
import MenuItemDetailScreen from '../screens/menu/MenuItemDetailScreen';
import CartScreen from '../screens/menu/CartScreen';
import CheckoutScreen from '../screens/menu/CheckoutScreen';
import OrderConfirmationScreen from '../screens/menu/OrderConfirmationScreen';
import FavoritesScreen from '../screens/menu/FavoritesScreen';

const Stack = createNativeStackNavigator<MenuStackParamList>();

const MenuStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: '#000',
        headerBackTitleVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MenuItemDetail"
        component={MenuItemDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Prevent back gesture after order
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default MenuStack;
