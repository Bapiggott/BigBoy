import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewsStackParamList } from './types';
import NewsScreen from '../screens/news/NewsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<NewsStackParamList>();

const NewsStack: React.FC = () => {
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
        name="News"
        component={NewsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default NewsStack;
