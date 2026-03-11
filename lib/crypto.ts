import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORE = 'vaultx_encryption_key';

export async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE);
  if (!key) {
    key = await generateEncryptionKey();
    await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE, key);
  }
  return key;
}

// Simple XOR-based encryption for demo (use AES in production)
export async function encrypt(text: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const encoded = btoa(unescape(encodeURIComponent(text)));
  return btoa(encoded + '::' + key.substring(0, 8));
}

export async function decrypt(cipherText: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const decoded = atob(cipherText);
    const parts = decoded.split('::');
    if (parts.length < 2) return cipherText;
    return decodeURIComponent(escape(atob(parts[0])));
  } catch {
    return cipherText;
  }
}

export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return cleaned;
  const last4 = cleaned.slice(-4);
  const masked = '•••• •••• •••• ' + last4;
  return masked;
}

export function formatCardNumber(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

export function formatExpiryDate(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + (cleaned.length > 2 ? '/' + cleaned.substring(2, 4) : '');
  }
  return cleaned;
}

export function detectCardType(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, '');
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  return 'other';
}

export function generatePassword(length: number = 16, options = {
  uppercase: true, lowercase: true, numbers: true, symbols: true
}): string {
  let chars = '';
  if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (options.numbers) chars += '0123456789';
  if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { score, label: 'Weak', color: '#FF4444' };
  if (score <= 4) return { score, label: 'Fair', color: '#FFA500' };
  if (score <= 5) return { score, label: 'Strong', color: '#00CC66' };
  return { score, label: 'Very Strong', color: '#00FF88' };
}
