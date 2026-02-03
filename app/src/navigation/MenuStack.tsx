import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuStackParamList } from './types';
import { colors } from '../theme';

import MenuScreen from '../screens/menu/MenuScreen';
import MenuItemDetailScreen from '../screens/menu/MenuItemDetailScreen';
import CartScreen from '../screens/menu/CartScreen';
import CheckoutScreen from '../screens/menu/CheckoutScreen';
import OrderConfirmationScreen from '../screens/menu/OrderConfirmationScreen';

const Stack = createNativeStackNavigator<MenuStackParamList>();

const MenuStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: 'Menu' }}
      />
      <Stack.Screen
        name="MenuItemDetail"
        component={MenuItemDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Your Cart' }}
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
    </Stack.Navigator>
  );
};

export default MenuStack;
