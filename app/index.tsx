import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { hasMasterPIN } from '../lib/auth';
import { Colors } from '../constants/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const hasPIN = await hasMasterPIN();
      
      if (!hasPIN) {
        router.replace('/(auth)/pin-setup');
        return;
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
