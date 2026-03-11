import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { encrypt, generatePassword, getPasswordStrength } from '../../../lib/crypto';
import { Colors, Spacing, Radius } from '../../../constants/theme';

const CATEGORIES = ['social', 'banking', 'email', 'shopping', 'work', 'other'];

export default function AddPasswordScreen() {
  const router = useRouter();
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('other');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genOptions, setGenOptions] = useState({
    uppercase: true, lowercase: true, numbers: true, symbols: true, length: 16
  });
  const [showGenerator, setShowGenerator] = useState(false);

  const strength = getPasswordStrength(password);

  const handleGenerate = () => {
    const generated = generatePassword(genOptions.length, genOptions);
    setPassword(generated);
  };

  const handleSave = async () => {
    if (!siteName || !username || !password) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const encryptedPassword = await encrypt(password);

      const { error } = await supabase.from('passwords').insert({
        user_id: user?.id || 'offline',
        site_name: siteName,
        site_url: siteUrl || null,
        username,
        password_encrypted: encryptedPassword,
        notes: notes || null,
        category,
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
          <Text style={styles.title}>Add Password</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveBtn, loading && { opacity: 0.5 }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Site / App Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gmail, Netflix"
              placeholderTextColor={Colors.textTertiary}
              value={siteName}
              onChangeText={setSiteName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor={Colors.textTertiary}
              value={siteUrl}
              onChangeText={setSiteUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username / Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password *</Text>
              <TouchableOpacity onPress={() => setShowGenerator(!showGenerator)}>
                <Text style={styles.generateLink}>⚙ Generate</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordField}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            {/* Strength indicator */}
            {password.length > 0 && (
              <View style={styles.strengthSection}>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        i <= strength.score ? { backgroundColor: strength.color } : {}
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Password Generator */}
          {showGenerator && (
            <View style={styles.generatorCard}>
              <Text style={styles.generatorTitle}>Password Generator</Text>
              {[
                { key: 'uppercase', label: 'Uppercase (A-Z)' },
                { key: 'lowercase', label: 'Lowercase (a-z)' },
                { key: 'numbers', label: 'Numbers (0-9)' },
                { key: 'symbols', label: 'Symbols (!@#$...)' },
              ].map(opt => (
                <View key={opt.key} style={styles.optionRow}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Switch
                    value={genOptions[opt.key as keyof typeof genOptions] as boolean}
                    onValueChange={v => setGenOptions({ ...genOptions, [opt.key]: v })}
                    trackColor={{ false: Colors.surface3, true: Colors.primary + '55' }}
                    thumbColor={genOptions[opt.key as keyof typeof genOptions] ? Colors.primary : Colors.textTertiary}
                  />
                </View>
              ))}

              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Length: {genOptions.length}</Text>
                <View style={styles.lengthBtns}>
                  {[8, 12, 16, 20, 24].map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.lengthBtn, genOptions.length === l && styles.lengthBtnActive]}
                      onPress={() => setGenOptions({ ...genOptions, length: l })}
                    >
                      <Text style={[styles.lengthBtnText, genOptions.length === l && styles.lengthBtnTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                <Text style={styles.generateBtnText}>Generate Password</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional notes..."
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveFullBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveFullBtnText}>{loading ? 'Saving...' : 'Save Password'}</Text>
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
  form: { padding: Spacing.lg, gap: 16, paddingBottom: 40 },
  inputGroup: { gap: 8 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  generateLink: { color: Colors.primary, fontSize: 13 },
  categoryRow: { flexDirection: 'row', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  catText: { color: Colors.textSecondary, fontSize: 13 },
  catTextActive: { color: Colors.primary, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface1, borderRadius: Radius.md,
    padding: 14, color: Colors.textPrimary, fontSize: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  passwordField: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn: {
    backgroundColor: Colors.surface1, borderRadius: Radius.md,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  strengthSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBar: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSegment: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: Colors.surface3,
  },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 70 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  generatorCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderActive,
    gap: 12,
  },
  generatorTitle: { color: Colors.primary, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionLabel: { color: Colors.textSecondary, fontSize: 14 },
  lengthBtns: { flexDirection: 'row', gap: 6 },
  lengthBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
  },
  lengthBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  lengthBtnText: { color: Colors.textSecondary, fontSize: 12 },
  lengthBtnTextActive: { color: '#000', fontWeight: '700' },
  generateBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 12, alignItems: 'center',
  },
  generateBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  saveFullBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 16, alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saveFullBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
