import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewsStackParamList } from './types';
import NewsScreen from '../screens/news/NewsScreen';

const Stack = createNativeStackNavigator<NewsStackParamList>();

const NewsStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="News"
        component={NewsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default NewsStack;
