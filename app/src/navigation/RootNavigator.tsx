import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';
import { useUser } from '../store/UserContext';
import { LoadingScreen } from '../components/LoadingScreen';

import AuthStack from './AuthStack';
import TabNavigator from './TabNavigator';

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useUser();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={colors.background} />
      {isAuthenticated ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;
