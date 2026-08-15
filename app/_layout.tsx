import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenCapture from 'expo-screen-capture';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BiometricLock } from '../src/components/BiometricLock';
import { registerBackgroundTasks } from '../src/services/backgroundTasks';

// Ensure background tasks are registered globally
registerBackgroundTasks();

export default function RootLayout() {
  useEffect(() => {
    // OS-level screenshot and screen recording protection
    ScreenCapture.preventScreenCaptureAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BiometricLock>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="pair" />
          </Stack>
        </SafeAreaProvider>
      </BiometricLock>
    </GestureHandlerRootView>
  );
}
