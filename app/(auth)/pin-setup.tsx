import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveMasterPIN } from '../../lib/auth';
import { Colors, Spacing, Radius } from '../../constants/theme';

const PIN_LENGTH = 6;

export default function PINSetupScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Vibration.vibrate(400);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (digit: string) => {
    if (step === 'create') {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => setStep('confirm'), 100);
      }
    } else {
      const newConfirm = confirmPin + digit;
      setConfirmPin(newConfirm);
      setError('');
      if (newConfirm.length === PIN_LENGTH) {
        if (newConfirm === pin) {
          await saveMasterPIN(pin);
          router.replace('/(auth)/register');
        } else {
          shake();
          setError('PINs do not match. Try again.');
          setTimeout(() => {
            setConfirmPin('');
            setPin('');
            setStep('create');
            setError('');
          }, 1200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const currentPin = step === 'create' ? pin : confirmPin;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>⬡</Text>
        </View>
        <Text style={styles.logoText}>VAULTX</Text>
        <Text style={styles.tagline}>Your digital safe. Everything secured.</Text>
      </View>

      <View style={styles.pinSection}>
        <Text style={styles.stepText}>
          {step === 'create' ? 'Create a Master PIN' : 'Confirm your PIN'}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < currentPin.length ? styles.dotFilled : styles.dotEmpty
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
                style={[
                  styles.key,
                  key === 'biometric' || key === 'delete' ? styles.keySpecial : null
                ]}
                onPress={() => {
                  if (key === 'delete') handleDelete();
                  else if (key !== 'biometric') handleDigit(key);
                }}
                activeOpacity={0.7}
              >
                {key === 'delete' ? (
                  <Text style={styles.keySpecialText}>⌫</Text>
                ) : key === 'biometric' ? (
                  <Text style={styles.keySpecialText}>⊙</Text>
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Protected by Master Lock & Biometrics
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIconText: {
    fontSize: 40,
    color: '#fff',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 6,
  },
  tagline: {
    color: Colors.textTertiary,
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  pinSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  stepText: {
    color: Colors.textSecondary,
    fontSize: 17,
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotEmpty: {
    backgroundColor: Colors.surface3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  keypad: {
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  key: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keySpecial: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '300',
  },
  keySpecialText: {
    color: Colors.primary,
    fontSize: 28,
  },
  disclaimer: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 32,
    letterSpacing: 0.3,
  },
});
