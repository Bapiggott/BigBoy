import "react-native-url-polyfill/auto";
import React from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Complete any pending auth sessions when the app loads
// This is required for the OAuth redirect to work properly
WebBrowser.maybeCompleteAuthSession();

// Providers - order matters: outer providers are available to inner ones
import {
  NetworkProvider,
  UserProvider,
  LocationProvider,
  CartProvider,
  ToastProvider,
} from './src/store';

// Navigation
import { RootNavigator } from './src/navigation';

// Toast Display Component
import ToastDisplay from './src/components/ToastDisplay';

/**
 * Big Boy App
 * 
 * Provider hierarchy (outer → inner):
 * 1. SafeAreaProvider - Safe area insets
 * 2. GestureHandlerRootView - Gesture handling
 * 3. NetworkProvider - Online/offline status detection
 * 4. UserProvider - Authentication state
 * 5. LocationProvider - Selected restaurant location
 * 6. CartProvider - Shopping cart state
 * 7. ToastProvider - Toast notifications
 */
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <NetworkProvider>
          <UserProvider>
            <LocationProvider>
              <CartProvider>
                <ToastProvider>
                  <RootNavigator />
                  <ToastDisplay />
                </ToastProvider>
              </CartProvider>
            </LocationProvider>
          </UserProvider>
        </NetworkProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
