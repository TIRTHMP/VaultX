import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const MASTER_PIN_KEY = 'vaultx_master_pin';
const LAST_ACTIVE_KEY = 'vaultx_last_active';
const AUTO_LOCK_TIMEOUT = 60 * 1000; // 60 seconds

export async function checkBiometricSupport(): Promise<{
  isAvailable: boolean;
  biometricType: LocalAuthentication.AuthenticationType[];
}> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const biometricType = await LocalAuthentication.supportedAuthenticationTypesAsync();
  
  return {
    isAvailable: compatible && enrolled,
    biometricType,
  };
}

export async function authenticateWithBiometrics(reason: string = 'Authenticate to access VaultX'): Promise<boolean> {
  try {
    const { isAvailable } = await checkBiometricSupport();
    
    if (!isAvailable) {
      // Fallback to PIN
      return await authenticateWithPIN();
    }
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Use PIN',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });
    
    return result.success;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return false;
  }
}

export async function authenticateWithPIN(): Promise<boolean> {
  // In a real app, show a PIN entry modal
  // This is a simplified version
  const storedPin = await SecureStore.getItemAsync(MASTER_PIN_KEY);
  if (!storedPin) return false;
  return true; // Would return result of PIN verification modal
}

export async function saveMasterPIN(pin: string): Promise<void> {
  const hashedPin = btoa(pin + 'vaultx_salt_2024');
  await SecureStore.setItemAsync(MASTER_PIN_KEY, hashedPin);
}

export async function verifyMasterPIN(pin: string): Promise<boolean> {
  const storedPin = await SecureStore.getItemAsync(MASTER_PIN_KEY);
  if (!storedPin) return false;
  const hashedPin = btoa(pin + 'vaultx_salt_2024');
  return storedPin === hashedPin;
}

export async function hasMasterPIN(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(MASTER_PIN_KEY);
  return !!pin;
}

export async function updateLastActive(): Promise<void> {
  await SecureStore.setItemAsync(LAST_ACTIVE_KEY, Date.now().toString());
}

export async function isSessionExpired(): Promise<boolean> {
  const lastActive = await SecureStore.getItemAsync(LAST_ACTIVE_KEY);
  if (!lastActive) return true;
  
  const elapsed = Date.now() - parseInt(lastActive);
  return elapsed > AUTO_LOCK_TIMEOUT;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_ACTIVE_KEY);
}
