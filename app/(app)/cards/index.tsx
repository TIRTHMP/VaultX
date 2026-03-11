import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, PanResponder, Dimensions, Alert, Modal, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { authenticateWithBiometrics } from '../../../lib/auth';
import { maskCardNumber, decrypt, detectCardType, formatCardNumber } from '../../../lib/crypto';
import { Colors, Spacing, Radius } from '../../../constants/theme';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

interface Card {
  id: string;
  card_holder_name: string;
  card_number_encrypted: string;
  expiry_date: string;
  card_type: string;
  bank_name: string;
  notes_encrypted: string | null;
  color_scheme: string;
}

function CardItem({ card, onDelete, onPress }: {
  card: Card;
  onDelete: (id: string) => void;
  onPress: (card: Card) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState<'none' | 'left' | 'right'>('none');
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [unlocked, setUnlocked] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const isMetallic = card.card_type === 'visa' || card.card_type === 'mastercard';
  const cardGradientStart = isMetallic ? '#1a1a2e' : '#1E1E2C';
  const cardGradientEnd = isMetallic ? '#2d2d4a' : '#252538';
  const cardAccent = card.card_type === 'visa' ? '#1A56DB' :
    card.card_type === 'mastercard' ? '#EB5757' :
      Colors.primary;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => {
      translateX.setValue(g.dx);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -SWIPE_THRESHOLD) {
        // Swipe left = delete
        Animated.spring(translateX, { toValue: -width * 0.7, useNativeDriver: true }).start();
        setSwiped('left');
      } else if (g.dx > SWIPE_THRESHOLD) {
        // Swipe right = unlock
        handleUnlock();
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        setSwiped('none');
      }
    },
  });

  const handleUnlock = async () => {
    const ok = await authenticateWithBiometrics('Unlock card details');
    if (ok) {
      const decryptedNumber = await decrypt(card.card_number_encrypted);
      setCardNumber(decryptedNumber);
      setUnlocked(true);
    }
  };

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.timing(flipAnim, { toValue, duration: 500, useNativeDriver: true }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <View style={styles.cardWrapper}>
      {/* Background actions */}
      {swiped === 'left' && (
        <View style={styles.deleteAction}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={async () => {
              const ok = await authenticateWithBiometrics('Confirm card deletion');
              if (!ok) {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                setSwiped('none');
                return;
              }
              Alert.alert('Delete Card', 'Are you sure?', [
                {
                  text: 'Cancel', onPress: () => {
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                    setSwiped('none');
                  }
                },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(card.id) },
              ]);
            }}
          >
            <Text style={styles.deleteText}>🗑</Text>
            <Text style={styles.deleteLabel}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[styles.cardContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Front */}
        <Animated.View style={[
          styles.creditCard,
          { transform: [{ rotateY: frontRotate }], backfaceVisibility: 'hidden' },
          isMetallic ? styles.cardMetallicBlack : styles.cardMetallicGray,
        ]}>
          {/* Card shine overlay */}
          <View style={styles.cardShine} />

          <View style={styles.cardTop}>
            <View style={styles.chip}>
              <View style={styles.chipInner} />
            </View>
            <Text style={[styles.cardNetwork, { color: cardAccent }]}>
              {card.card_type?.toUpperCase() || 'CARD'}
            </Text>
          </View>

          <Text style={styles.cardNumber}>
            {unlocked
              ? formatCardNumber(cardNumber)
              : maskCardNumber(card.card_number_encrypted)}
          </Text>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>CARD HOLDER</Text>
              <Text style={styles.cardValue}>{card.card_holder_name}</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>{card.expiry_date}</Text>
            </View>
            <TouchableOpacity onPress={handleFlip}>
              <Text style={styles.flipHint}>↩ Notes</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bankBadge}>
            <Text style={styles.bankName}>{card.bank_name}</Text>
          </View>

          {!unlocked && (
            <TouchableOpacity style={styles.lockOverlay} onPress={handleUnlock}>
              <Text style={styles.lockOverlayIcon}>🔒</Text>
              <Text style={styles.lockOverlayText}>Tap to unlock</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Back */}
        <Animated.View style={[
          styles.creditCard, styles.cardBack,
          { transform: [{ rotateY: backRotate }], backfaceVisibility: 'hidden' },
          isMetallic ? styles.cardMetallicBlack : styles.cardMetallicGray,
        ]}>
          <View style={styles.magneticStripe} />
          <View style={styles.cvvSection}>
            <Text style={styles.cvvLabel}>SECURE NOTES</Text>
            <View style={styles.cvvBox}>
              <Text style={styles.cvvText}>
                {unlocked
                  ? (card.notes_encrypted || 'No notes')
                  : '••••••••••••'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.flipBackBtn} onPress={handleFlip}>
            <Text style={styles.flipHint}>↩ Front</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>← Delete  •  → Unlock</Text>
      </View>
    </View>
  );
}

export default function CardsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setCards(data || []);
    setLoading(false);
  }

  async function deleteCard(id: string) {
    await supabase.from('cards').delete().eq('id', id);
    setCards(c => c.filter(card => card.id !== id));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← </Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cards</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/cards/add')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.cardsList}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first card</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(app)/cards/add')}
            >
              <Text style={styles.emptyBtnText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onDelete={deleteCard}
              onPress={() => { }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_HEIGHT = 200;

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
  cardsList: { padding: Spacing.lg, gap: 20 },
  cardWrapper: { gap: 4, position: 'relative' },
  cardContainer: { borderRadius: Radius.xl, overflow: 'hidden' },
  creditCard: {
    width: '100%', height: CARD_HEIGHT,
    borderRadius: Radius.xl, padding: 20,
    justifyContent: 'space-between', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardMetallicBlack: { backgroundColor: '#111118' },
  cardMetallicGray: { backgroundColor: '#1E1E2C' },
  cardBack: { position: 'absolute', top: 0, left: 0, right: 0 },
  cardShine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: CARD_HEIGHT * 0.5,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chip: {
    width: 36, height: 28, borderRadius: 6,
    backgroundColor: '#C8A951', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DDB95A',
  },
  chipInner: {
    width: 24, height: 18, borderRadius: 3,
    backgroundColor: '#B8923A',
    borderWidth: 1, borderColor: '#CC9F44',
  },
  cardNetwork: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  cardNumber: {
    color: '#fff', fontSize: 18, fontWeight: '300',
    letterSpacing: 2.5, fontFamily: 'Courier New',
    textAlign: 'center',
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  cardValue: { color: '#fff', fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },
  flipHint: { color: Colors.primary, fontSize: 11, opacity: 0.8 },
  bankBadge: {
    position: 'absolute', top: 20, left: '50%',
    transform: [{ translateX: -30 }],
  },
  bankName: { color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 1 },
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.xl,
    justifyContent: 'center', alignItems: 'center', gap: 8,
    backdropFilter: 'blur(10px)',
  },
  lockOverlayIcon: { fontSize: 28 },
  lockOverlayText: { color: Colors.textSecondary, fontSize: 13 },
  magneticStripe: {
    height: 44, backgroundColor: '#000',
    marginHorizontal: -20, marginTop: 20,
  },
  cvvSection: { paddingTop: 12 },
  cvvLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 1.5, marginBottom: 8 },
  cvvBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.sm, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cvvText: { color: '#fff', fontSize: 14, letterSpacing: 1 },
  flipBackBtn: { alignItems: 'flex-end' },
  deleteAction: {
    position: 'absolute', right: 0, top: 0, bottom: 24,
    width: width * 0.7, justifyContent: 'center', alignItems: 'flex-end',
    paddingRight: 24, borderRadius: Radius.xl, backgroundColor: Colors.error + '33',
  },
  deleteBtn: { alignItems: 'center', gap: 4 },
  deleteText: { fontSize: 24 },
  deleteLabel: { color: Colors.error, fontSize: 12, fontWeight: '600' },
  swipeHint: { alignItems: 'center' },
  swipeHintText: { color: Colors.textTertiary, fontSize: 10, letterSpacing: 0.5 },
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
