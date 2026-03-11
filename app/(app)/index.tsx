import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { clearSession } from '../../lib/auth';
import { Colors, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface SectionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  color: string;
  bgColors: string[];
  onPress: () => void;
  delay: number;
}

function SectionCard({ title, subtitle, icon, count, color, bgColors, onPress, delay }: SectionCardProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.sectionCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
          <View style={[styles.sectionIcon, { backgroundColor: color + '22' }]}>
            <Text style={[styles.sectionIconText, { color }]}>{icon}</Text>
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.sectionRight}>
            <Text style={[styles.sectionCount, { color }]}>{count}</Text>
            <Text style={[styles.chevron, { color }]}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [counts, setCounts] = useState({ cards: 0, passwords: 0, documents: 0 });
  const [greeting, setGreeting] = useState('');
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    loadUser();
    loadCounts();

    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      // Try metadata username first, fallback to email prefix
      const username =
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        'there';
      setDisplayName(username);
    }
  }

  async function loadCounts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [cards, passwords, docs] = await Promise.all([
      supabase.from('cards').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('passwords').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id),
    ]);

    setCounts({
      cards: cards.count || 0,
      passwords: passwords.count || 0,
      documents: docs.count || 0,
    });
  }

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View style={[styles.header, {
          opacity: headerFade,
          transform: [{ translateY: headerAnim }],
        }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMini}>
              <Text style={styles.logoMiniText}>⬡</Text>
            </View>
            <Text style={styles.logoTitle}>VAULTX</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.lockBtn} onPress={handleLock}>
              <Text style={styles.lockIcon}>🔒</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/(app)/profile')}
            >
              {user ? (
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              ) : (
                <Text style={styles.avatarText}>?</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.greetingName}>
            {displayName || 'Welcome back'}
          </Text>
          <Text style={styles.tagline}>Your digital safe. Everything secured.</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Cards', value: counts.cards, color: Colors.accentBlue },
            { label: 'Passwords', value: counts.passwords, color: Colors.primary },
            { label: 'Documents', value: counts.documents, color: Colors.accentGreen },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Section Cards */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionHeader}>Your Vault</Text>

          <SectionCard
            title="Cards"
            subtitle="Credit & debit cards"
            icon="💳"
            count={counts.cards}
            color={Colors.accentBlue}
            bgColors={['#1a2a4a', '#1a3060']}
            onPress={() => router.push('/(app)/cards')}
            delay={100}
          />
          <SectionCard
            title="Passwords"
            subtitle="Accounts & logins"
            icon="🔑"
            count={counts.passwords}
            color={Colors.primary}
            bgColors={['#3a2a1a', '#503010']}
            onPress={() => router.push('/(app)/passwords')}
            delay={200}
          />
          <SectionCard
            title="Documents"
            subtitle="Files & documents"
            icon="📄"
            count={counts.documents}
            color={Colors.accentGreen}
            bgColors={['#1a3a2a', '#1a4a30']}
            onPress={() => router.push('/(app)/documents')}
            delay={300}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerIcon}>⬡</Text>
          <Text style={styles.footerText}>Protected by Master Lock & Biometrics</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.lg,
    paddingTop: 8, paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMini: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  logoMiniText: { fontSize: 18, color: '#fff' },
  logoTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, letterSpacing: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  lockIcon: { fontSize: 16 },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary + '33',
    borderWidth: 2, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  greetingSection: { paddingHorizontal: Spacing.lg, paddingTop: 20, paddingBottom: 12 },
  greeting: { color: Colors.textTertiary, fontSize: 14, letterSpacing: 0.4 },
  greetingName: { color: Colors.textPrimary, fontSize: 26, fontWeight: '700', marginTop: 2 },
  tagline: { color: Colors.textTertiary, fontSize: 13, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: Spacing.lg, marginBottom: 28,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { color: Colors.textTertiary, fontSize: 12, marginTop: 4 },
  sectionsContainer: { paddingHorizontal: Spacing.lg, gap: 12 },
  sectionHeader: {
    color: Colors.textTertiary, fontSize: 12,
    fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, gap: 14,
  },
  sectionIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionIconText: { fontSize: 22 },
  sectionInfo: { flex: 1 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '600' },
  sectionSubtitle: { color: Colors.textTertiary, fontSize: 13, marginTop: 2 },
  sectionRight: { alignItems: 'center', gap: 2 },
  sectionCount: { fontSize: 20, fontWeight: '700' },
  chevron: { fontSize: 22, fontWeight: '300' },
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6, marginTop: 36,
  },
  footerIcon: { color: Colors.textTertiary, fontSize: 12 },
  footerText: { color: Colors.textTertiary, fontSize: 12 },
});
