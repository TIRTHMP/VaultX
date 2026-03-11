import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyMasterPIN, authenticateWithBiometrics, updateLastActive } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing } from '../../constants/theme';

const PIN_LENGTH = 6;

export default function LoginScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    // Auto-trigger biometrics on load
    setTimeout(() => handleBiometric(), 300);
  }, []);

  const shake = () => {
    Vibration.vibrate([0, 50, 100, 50]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleBiometric = async () => {
    const success = await authenticateWithBiometrics('Unlock VaultX');
    if (success) {
      await updateLastActive();
      router.replace('/(app)');
    }
  };

  const handleDigit = async (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      const valid = await verifyMasterPIN(newPin);
      if (valid) {
        await updateLastActive();
        router.replace('/(app)');
      } else {
        shake();
        setAttempts(a => a + 1);
        setError(`Incorrect PIN. ${3 - attempts - 1 > 0 ? `${3 - attempts - 1} attempts left` : 'Account locked'}`);
        setTimeout(() => { setPin(''); setError(''); }, 1000);
      }
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>⬡</Text>
          </View>
          <Text style={styles.logoText}>VAULTX</Text>
          <Text style={styles.tagline}>Your digital safe. Everything secured.</Text>
        </View>

        <View style={styles.pinSection}>
          <Text style={styles.label}>Enter Master PIN</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < pin.length ? styles.dotFilled : styles.dotEmpty
                ]}
              />
            ))}
          </Animated.View>
        </View>

        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['biometric', '0', 'delete'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.key, (key === 'biometric' || key === 'delete') ? styles.keySpecial : null]}
                  onPress={() => {
                    if (key === 'delete') handleDelete();
                    else if (key === 'biometric') handleBiometric();
                    else handleDigit(key);
                  }}
                  activeOpacity={0.65}
                >
                  {key === 'delete' ? (
                    <Text style={styles.keySpecialText}>⌫</Text>
                  ) : key === 'biometric' ? (
                    <Text style={styles.biometricIcon}>⊙</Text>
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signInLink} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.signInText}>Sign in to sync across devices →</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerIcon}>⬡</Text>
          <Text style={styles.footerText}>Protected by Master Lock & Biometrics</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xl },
  logoSection: { alignItems: 'center', marginTop: 32, marginBottom: 16 },
  logoIcon: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  logoIconText: { fontSize: 38, color: '#fff' },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: 6 },
  tagline: { color: Colors.textTertiary, fontSize: 13, marginTop: 4 },
  pinSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  label: { color: Colors.textSecondary, fontSize: 16, marginBottom: 20 },
  errorText: { color: Colors.error, fontSize: 13, marginBottom: 10 },
  dotsContainer: { flexDirection: 'row', gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotEmpty: { backgroundColor: Colors.surface3, borderWidth: 1, borderColor: Colors.border },
  dotFilled: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
  },
  keypad: { width: '100%', gap: 12 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  key: {
    width: 88, height: 88, borderRadius: 22,
    backgroundColor: Colors.surface2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  keySpecial: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { color: Colors.textPrimary, fontSize: 26, fontWeight: '300' },
  keySpecialText: { color: Colors.primary, fontSize: 26 },
  biometricIcon: { color: Colors.primary, fontSize: 36 },
  signInLink: { marginTop: 24 },
  signInText: { color: Colors.primary, fontSize: 14, opacity: 0.8 },
  footer: { position: 'absolute', bottom: 32, flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerIcon: { color: Colors.textTertiary, fontSize: 12 },
  footerText: { color: Colors.textTertiary, fontSize: 12 },
});
