import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import { updateLastActive, isSessionExpired, clearSession } from '../lib/auth';
import { useRouter } from 'expo-router';


export default function RootLayout() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.match(/inactive|background/) && next === 'active') {
        if (await isSessionExpired()) {
          await clearSession();
          router.replace('/');
        }
      }
      if (next === 'background' || next === 'inactive') {
        await updateLastActive();
      }
      setAppState(next);
    });

    return () => { subscription.remove(); };
  }, [appState]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0A0A0F" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#0A0A0F' },
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="(auth)/pin-setup" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(app)" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
