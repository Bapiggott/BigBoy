import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountStackParamList } from './types';
import { colors } from '../theme';

import AccountScreen from '../screens/account/AccountScreen';
import ProfileScreen from '../screens/account/ProfileScreen';
import PaymentMethodsScreen from '../screens/account/PaymentMethodsScreen';
import SavedAddressesScreen from '../screens/account/SavedAddressesScreen';
import GiftCardsScreen from '../screens/account/GiftCardsScreen';
import NotificationsScreen from '../screens/account/NotificationsScreen';
import PreferencesScreen from '../screens/account/PreferencesScreen';
import OrderHistoryScreen from '../screens/account/OrderHistoryScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import HelpSupportScreen from '../screens/account/HelpSupportScreen';
import AdminScreen from '../screens/admin/AdminScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

const AccountStack: React.FC = () => {
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
        name="Account"
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SavedAddresses"
        component={SavedAddressesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GiftCards"
        component={GiftCardsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AccountStack;
