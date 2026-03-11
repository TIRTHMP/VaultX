import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { clearSession, checkBiometricSupport } from '../../lib/auth';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [stats, setStats] = useState({ cards: 0, passwords: 0, documents: 0 });
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const username =
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        'there';
      setDisplayName(username);
    }

    const { isAvailable } = await checkBiometricSupport();
    setBiometricAvailable(isAvailable);

    if (user) {
      const [cards, passwords, docs] = await Promise.all([
        supabase.from('cards').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('passwords').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);
      setStats({ cards: cards.count || 0, passwords: passwords.count || 0, documents: docs.count || 0 });
    }
  }

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'This will sign you out of cloud sync. Your local data will remain.', [
      { text: 'Cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          await clearSession();
          router.replace('/');
        }
      },
    ]);
  };

  const handleLock = async () => {
    await clearSession();
    router.replace('/(auth)/login');
  };

  const getUserInitials = () => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <Text style={styles.userName}>{displayName || 'VaultX User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'Offline Mode'}</Text>
          <View style={styles.syncBadge}>
            <Text style={styles.syncDot}>{user ? '🟢' : '🔴'}</Text>
            <Text style={styles.syncText}>{user ? 'Synced to Cloud' : 'Offline Only'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Vault Summary</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Cards', value: stats.cards, color: Colors.accentBlue, icon: '💳' },
              { label: 'Passwords', value: stats.passwords, color: Colors.primary, icon: '🔑' },
              { label: 'Documents', value: stats.documents, color: Colors.accentGreen, icon: '📄' },
            ].map(stat => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Security */}
        <View style={[styles.section, { marginTop: 4 }]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.md, paddingTop: Spacing.md }]}>Security</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👁‍🗨</Text>
              <View>
                <Text style={styles.settingLabel}>Biometric Auth</Text>
                <Text style={styles.settingDesc}>
                  {biometricAvailable ? 'Available on this device' : 'Not available'}
                </Text>
              </View>
            </View>
            <Text style={[styles.badge, { color: biometricAvailable ? Colors.accentGreen : Colors.error }]}>
              {biometricAvailable ? 'ON' : 'OFF'}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>⏱</Text>
              <View>
                <Text style={styles.settingLabel}>Auto-Lock</Text>
                <Text style={styles.settingDesc}>Lock after 60s of inactivity</Text>
              </View>
            </View>
            <Switch
              value={autoLock}
              onValueChange={setAutoLock}
              trackColor={{ false: Colors.surface3, true: Colors.primary + '55' }}
              thumbColor={autoLock ? Colors.primary : Colors.textTertiary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔐</Text>
              <View>
                <Text style={styles.settingLabel}>End-to-End Encryption</Text>
                <Text style={styles.settingDesc}>All data encrypted locally</Text>
              </View>
            </View>
            <Text style={[styles.badge, { color: Colors.accentGreen }]}>ON</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('../(app)/reset-pin')}
          >
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionLabel}>Reset Master PIN</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleLock}>
            <Text style={styles.actionIcon}>🔒</Text>
            <Text style={styles.actionLabel}>Lock Vault</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          {user ? (
            <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={handleSignOut}>
              <Text style={styles.actionIcon}>↩</Text>
              <Text style={[styles.actionLabel, { color: Colors.error }]}>Sign Out</Text>
              <Text style={[styles.actionChevron, { color: Colors.error }]}>›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.actionIcon}>☁</Text>
              <Text style={styles.actionLabel}>Enable Cloud Sync</Text>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.versionSection}>
          <Text style={styles.logoFooter}>VAULTX</Text>
          <Text style={styles.version}>Version 2.0.0</Text>
          <Text style={styles.version}>Made with ❤️ for your security</Text>
        </View>
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
  content: { padding: Spacing.lg, gap: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '33',
    borderWidth: 2, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.primary, fontSize: 32, fontWeight: '700' },
  userName: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  userEmail: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncDot: { fontSize: 10 },
  syncText: { color: Colors.textTertiary, fontSize: 13 },
  statsCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.textTertiary, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
  },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { color: Colors.textTertiary, fontSize: 12 },
  section: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { fontSize: 20, width: 28 },
  settingLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500' },
  settingDesc: { color: Colors.textTertiary, fontSize: 12, marginTop: 1 },
  badge: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  actionDanger: {},
  actionIcon: { fontSize: 20, width: 28 },
  actionLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500', flex: 1 },
  actionChevron: { color: Colors.textTertiary, fontSize: 20 },
  versionSection: { alignItems: 'center', gap: 4, paddingTop: 8 },
  logoFooter: { color: Colors.primary, fontSize: 16, fontWeight: '800', letterSpacing: 4 },
  version: { color: Colors.textTertiary, fontSize: 12 },
});
