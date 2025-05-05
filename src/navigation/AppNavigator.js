// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CitySearchScreen from '../screens/CitySearchScreen';
import { useTranslation } from '../utils/TranslationContext';
import Colors from '../constants/Colors';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="CitySearch" 
        component={CitySearchScreen} 
        options={{ title: t('searchCity') }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
