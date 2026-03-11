import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { encrypt, formatCardNumber, formatExpiryDate, detectCardType } from '../../../lib/crypto';
import { Colors, Spacing, Radius } from '../../../constants/theme';

export default function AddCardScreen() {
  const router = useRouter();
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const cardType = detectCardType(cardNumber);
  const isMetallic = cardType === 'visa' || cardType === 'mastercard';

  const handleSave = async () => {
    if (!cardHolder || !cardNumber || !expiry) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const encryptedNumber = await encrypt(cardNumber.replace(/\s/g, ''));
      const encryptedNotes = notes ? await encrypt(notes) : null;

      const { error } = await supabase.from('cards').insert({
        user_id: user?.id || 'offline',
        card_holder_name: cardHolder.toUpperCase(),
        card_number_encrypted: encryptedNumber,
        expiry_date: expiry,
        card_type: cardType,
        bank_name: bankName,
        notes_encrypted: encryptedNotes,
        color_scheme: isMetallic ? 'metallic-black' : 'metallic-gray',
      });

      if (error) throw error;
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Card</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveBtn, loading && { opacity: 0.5 }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Card Preview */}
        <View style={[styles.cardPreview, isMetallic ? styles.cardBlack : styles.cardGray]}>
          <View style={styles.cardPreviewTop}>
            <View style={styles.chip}>
              <View style={styles.chipInner} />
            </View>
            <Text style={styles.cardNetworkLabel}>{cardType.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardNumberPreview}>
            {cardNumber || '•••• •••• •••• ••••'}
          </Text>
          <View style={styles.cardPreviewBottom}>
            <View>
              <Text style={styles.previewLabel}>CARD HOLDER</Text>
              <Text style={styles.previewValue}>{cardHolder || 'YOUR NAME'}</Text>
            </View>
            <View>
              <Text style={styles.previewLabel}>EXPIRES</Text>
              <Text style={styles.previewValue}>{expiry || 'MM/YY'}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={Colors.textTertiary}
              value={cardNumber}
              onChangeText={v => setCardNumber(formatCardNumber(v))}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Expiry Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor={Colors.textTertiary}
                value={expiry}
                onChangeText={v => setExpiry(formatExpiryDate(v))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Holder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="JOHN DOE"
              placeholderTextColor={Colors.textTertiary}
              value={cardHolder}
              onChangeText={v => setCardHolder(v.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank / Issuer</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chase, Wells Fargo"
              placeholderTextColor={Colors.textTertiary}
              value={bankName}
              onChangeText={setBankName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Secure Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="CVV, PIN, or other private notes..."
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              secureTextEntry
            />
          </View>

          <View style={styles.cardTypeRow}>
            <Text style={styles.cardTypeLabel}>Detected: </Text>
            <View style={[styles.cardTypeBadge, { borderColor: isMetallic ? Colors.accentBlue : Colors.primary }]}>
              <Text style={[styles.cardTypeText, { color: isMetallic ? Colors.accentBlue : Colors.primary }]}>
                {cardType.toUpperCase()} • {isMetallic ? 'Metallic Black' : 'Metallic Gray'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveFullBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveFullBtnText}>{loading ? 'Saving...' : 'Save Card'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  backBtn: { color: Colors.primary, fontSize: 22 },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  saveBtn: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  cardPreview: {
    marginHorizontal: Spacing.lg, borderRadius: Radius.xl,
    padding: 20, height: 180, justifyContent: 'space-between',
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardBlack: { backgroundColor: '#111118' },
  cardGray: { backgroundColor: '#1E1E2C' },
  cardPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chip: {
    width: 34, height: 26, borderRadius: 5,
    backgroundColor: '#C8A951', justifyContent: 'center', alignItems: 'center',
  },
  chipInner: { width: 22, height: 16, borderRadius: 3, backgroundColor: '#B8923A' },
  cardNetworkLabel: { color: Colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  cardNumberPreview: {
    color: '#fff', fontSize: 18, letterSpacing: 3,
    fontFamily: 'Courier New', textAlign: 'center', fontWeight: '300',
  },
  cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  previewLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  previewValue: { color: '#fff', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  form: { paddingHorizontal: Spacing.lg, gap: 16, paddingBottom: 40 },
  inputGroup: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surface1, borderRadius: Radius.md,
    padding: 14, color: Colors.textPrimary, fontSize: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTypeLabel: { color: Colors.textTertiary, fontSize: 13 },
  cardTypeBadge: { borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  cardTypeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  saveFullBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 16, alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saveFullBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
