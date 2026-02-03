import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RewardsStackParamList } from './types';
import { colors } from '../theme';

import RewardsScreen from '../screens/rewards/RewardsScreen';
import RewardDetailScreen from '../screens/rewards/RewardDetailScreen';
import MyRewardsScreen from '../screens/rewards/MyRewardsScreen';

const Stack = createNativeStackNavigator<RewardsStackParamList>();

const RewardsStack: React.FC = () => {
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
        name="Rewards"
        component={RewardsScreen}
        options={{ title: 'Rewards' }}
      />
      <Stack.Screen
        name="RewardDetail"
        component={RewardDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="MyRewards"
        component={MyRewardsScreen}
        options={{ title: 'My Rewards' }}
      />
    </Stack.Navigator>
  );
};

export default RewardsStack;
