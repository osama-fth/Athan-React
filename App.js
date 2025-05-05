// App.js
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TranslationProvider } from './src/utils/TranslationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

// Impedisce alla splash screen di nascondersi automaticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simula un ritardo per mostrare la splash screen più a lungo
        // Imposta il tempo che desideri (in millisecondi)
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1,5 secondi
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // Questo nasconde la splash screen una volta che la UI è pronta
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <TranslationProvider>
          <NavigationContainer>
            <StatusBar style="light-content" />
            <AppNavigator />
          </NavigationContainer>
        </TranslationProvider>
      </SafeAreaProvider>
    </View>
  );
}
