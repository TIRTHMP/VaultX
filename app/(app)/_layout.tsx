import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="cards/index" />
      <Stack.Screen name="cards/add" />
      <Stack.Screen name="passwords/index" />
      <Stack.Screen name="passwords/add" />
      <Stack.Screen name="documents/index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="reset-pin" />
    </Stack>
  );
}
