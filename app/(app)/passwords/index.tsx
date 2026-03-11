import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Alert, Clipboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { decrypt, getPasswordStrength } from '../../../lib/crypto';
import { authenticateWithBiometrics } from '../../../lib/auth';
import { Colors, Spacing, Radius } from '../../../constants/theme';

interface Password {
  id: string;
  site_name: string;
  site_url: string | null;
  username: string;
  password_encrypted: string;
  category: string;
  updated_at: string;
}

function PasswordItem({ item, onReveal }: { item: Password; onReveal: (id: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState('••••••••');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  const handleReveal = async () => {
    const ok = await authenticateWithBiometrics('View password');
    if (ok) {
      const decrypted = await decrypt(item.password_encrypted);
      setPassword(decrypted);
      setRevealed(true);
      onReveal(item.id);
    }
  };

  const handleCopy = async () => {
    if (!revealed) {
      await handleReveal();
      return;
    }
    Clipboard.setString(password);
    Alert.alert('Copied', 'Password copied to clipboard');
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      social: '💬', banking: '🏦', email: '📧',
      shopping: '🛒', work: '💼', other: '🔑',
    };
    return icons[cat] || '🔑';
  };

  const strength = getPasswordStrength(password === '••••••••' ? '' : password);

  return (
    <TouchableOpacity
      style={styles.passwordItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.passwordMain}>
        <View style={styles.passwordIcon}>
          <Text style={styles.passwordIconText}>{getCategoryIcon(item.category)}</Text>
        </View>
        <View style={styles.passwordInfo}>
          <Text style={styles.siteName}>{item.site_name}</Text>
          <Text style={styles.username}>{item.username}</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.passwordField}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordReveal}>
              <Text style={[styles.passwordValue, revealed && styles.passwordRevealed]}>
                {password}
              </Text>
              <TouchableOpacity onPress={handleReveal}>
                <Text style={styles.revealBtn}>{revealed ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {item.site_url && (
            <View style={styles.passwordField}>
              <Text style={styles.fieldLabel}>Website</Text>
              <Text style={styles.fieldValue}>{item.site_url}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={async () => {
                const ok = await authenticateWithBiometrics('Edit password');
                if (ok) { /* navigate to edit */ }
              }}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={async () => {
                const ok = await authenticateWithBiometrics('Delete password');
                if (ok) {
                  Alert.alert('Delete', 'Delete this password?', [
                    { text: 'Cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      await supabase.from('passwords').delete().eq('id', item.id);
                    }},
                  ]);
                }
              }}
            >
              <Text style={styles.actionIcon}>🗑</Text>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function PasswordsScreen() {
  const router = useRouter();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['all', 'social', 'banking', 'email', 'shopping', 'work', 'other'];

  useEffect(() => { loadPasswords(); }, []);

  async function loadPasswords() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', user.id)
      .order('site_name', { ascending: true });

    setPasswords(data || []);
    setLoading(false);
  }

  const filtered = passwords.filter(p => {
    const matchSearch = !search || p.site_name.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce((acc, p) => {
    const letter = p.site_name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(p);
    return acc;
  }, {} as Record<string, Password[]>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Passwords</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/passwords/add')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search passwords..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔑</Text>
            <Text style={styles.emptyTitle}>No passwords yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first password</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/passwords/add')}>
              <Text style={styles.emptyBtnText}>Add Password</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(grouped).sort().map(letter => (
            <View key={letter}>
              <Text style={styles.groupLetter}>{letter}</Text>
              {grouped[letter].map(item => (
                <PasswordItem key={item.id} item={item} onReveal={() => {}} />
              ))}
            </View>
          ))
        )}

        {/* Security checkup banner */}
        {passwords.length > 0 && (
          <View style={styles.checkupBanner}>
            <Text style={styles.checkupIcon}>🛡</Text>
            <View style={styles.checkupInfo}>
              <Text style={styles.checkupTitle}>Security Checkup</Text>
              <Text style={styles.checkupSub}>{passwords.length} passwords stored securely</Text>
            </View>
            <Text style={styles.checkupGreen}>✓</Text>
          </View>
        )}
      </ScrollView>
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
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: '#000', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface1,
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border, gap: 10, marginBottom: 12,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  categories: { paddingHorizontal: Spacing.lg, gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  categoryText: { color: Colors.textSecondary, fontSize: 13 },
  categoryTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  groupLetter: {
    color: Colors.textTertiary, fontSize: 12, fontWeight: '700',
    letterSpacing: 1.5, marginTop: 16, marginBottom: 8,
    paddingLeft: 4, textTransform: 'uppercase',
  },
  passwordItem: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  passwordMain: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: 12,
  },
  passwordIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.surface2,
    justifyContent: 'center', alignItems: 'center',
  },
  passwordIconText: { fontSize: 20 },
  passwordInfo: { flex: 1 },
  siteName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  username: { color: Colors.textTertiary, fontSize: 13, marginTop: 2 },
  expandIcon: { color: Colors.textTertiary, fontSize: 12 },
  expandedContent: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.md, gap: 12, backgroundColor: Colors.surface1,
  },
  passwordField: { gap: 4 },
  fieldLabel: { color: Colors.textTertiary, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  passwordReveal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passwordValue: { color: Colors.textSecondary, fontSize: 16, letterSpacing: 2, fontFamily: 'Courier New' },
  passwordRevealed: { color: Colors.textPrimary, letterSpacing: 0.5 },
  revealBtn: { fontSize: 20 },
  fieldValue: { color: Colors.textPrimary, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.surface2, borderRadius: Radius.md,
    paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
  },
  actionDanger: { borderColor: Colors.error + '44' },
  actionIcon: { fontSize: 14 },
  actionText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  checkupBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.accentGreen + '11',
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.accentGreen + '33',
    marginTop: 20, gap: 12,
  },
  checkupIcon: { fontSize: 24 },
  checkupInfo: { flex: 1 },
  checkupTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  checkupSub: { color: Colors.textTertiary, fontSize: 12 },
  checkupGreen: { color: Colors.accentGreen, fontSize: 18, fontWeight: '700' },
  loadingText: { color: Colors.textTertiary, textAlign: 'center', marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '600' },
  emptySubtitle: { color: Colors.textTertiary, fontSize: 14 },
  emptyBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingHorizontal: 28, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
