import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { colors } from '../theme';

import MoreScreen from '../screens/more/MoreScreen';
import LocationsScreen from '../screens/locations/LocationsScreen';
import LocationDetailScreen from '../screens/locations/LocationDetailScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreStack: React.FC = () => {
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
        name="More"
        component={MoreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Locations"
        component={LocationsScreen}
        options={{ title: 'Locations' }}
      />
      <Stack.Screen
        name="LocationDetail"
        component={LocationDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
};

export default MoreStack;
