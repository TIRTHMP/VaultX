import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username || email.split('@')[0] }
          }
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email to confirm your account');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>⬡</Text>
            </View>
            <Text style={styles.logoText}>VAULTX</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'login' && styles.tabActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'register' && styles.tabActive]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Sign in to sync your vault across devices'
                : 'Create an account for cross-device sync'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. tirth"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.skipText}>Skip — Use offline only</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Your data is encrypted end-to-end. Only you can access your vault.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.lg, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: Colors.primary, fontSize: 15 },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoIconText: { fontSize: 30, color: '#fff' },
  logoText: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: 5 },
  card: {
    width: '100%', backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface1, borderRadius: Radius.lg, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: 10, borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#000' },
  subtitle: { color: Colors.textTertiary, fontSize: 13, marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surface1, borderRadius: Radius.md,
    padding: 14, color: Colors.textPrimary, fontSize: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 16, alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: 16 },
  skipText: { color: Colors.textTertiary, fontSize: 14 },
  disclaimer: {
    color: Colors.textTertiary, fontSize: 12,
    textAlign: 'center', marginTop: 24, paddingHorizontal: 20,
  },
});
