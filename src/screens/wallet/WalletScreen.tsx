import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import WalletComingSoonCard from './WalletComingSoonCard';

const { width } = Dimensions.get('window');

interface RouteParams {
  role?: 'parent' | 'teacher';
}

const WalletScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const useCases = [
    { icon: 'flash-outline', label: 'Quick Lead Unlocks', color: colors.primary },
    { icon: 'return-down-back-outline', label: 'Faster Refunds', color: colors.success },
    { icon: 'gift-outline', label: 'Bonus Credits', color: colors.accent },
    { icon: 'ribbon-outline', label: 'Promotional Rewards', color: colors.pink },
    ...(role === 'teacher' ? [
      { icon: 'lock-open-outline', label: 'Lead Unlock Credits', color: colors.secondary },
      { icon: 'people-outline', label: 'Referral Earnings', color: colors.info },
      { icon: 'trophy-outline', label: 'Bonus Campaign Rewards', color: colors.accent },
    ] : []),
  ];

  const futureFeatures: { icon: string; label: string; color: string }[] = [
    { icon: 'add-circle-outline', label: 'Add Money', color: colors.primary },
    { icon: 'arrow-up-circle-outline', label: 'Withdraw', color: colors.success },
    { icon: 'receipt-outline', label: 'Transaction History', color: colors.info },
    { icon: 'people-outline', label: 'Referral Rewards', color: colors.accent },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('WalletHistory', { role })}
        >
          <Ionicons name="time-outline" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Balance Hero Card */}
          <View style={styles.balanceCard}>
            {/* Decorative blobs */}
            <View style={styles.balanceBlob1} />
            <View style={styles.balanceBlob2} />

            <View style={styles.balanceTop}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="wallet-outline" size={28} color={colors.textWhite} />
              </View>
              <View style={styles.balanceStatusBadge}>
                <View style={styles.balanceDot} />
                <Text style={styles.balanceStatusText}>Coming Soon</Text>
              </View>
            </View>

            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹0.00</Text>
            <Text style={styles.balanceSubtitle}>
              Wallet launches soon — your balance will appear here
            </Text>

            {/* Quick action strip */}
            <View style={styles.quickActions}>
              {[
                { icon: 'add-outline', label: 'Add' },
                { icon: 'arrow-up-outline', label: 'Send' },
                { icon: 'receipt-outline', label: 'History' },
              ].map(a => (
                <View key={a.label} style={styles.quickAction}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={a.icon as any} size={18} color={colors.textWhite} />
                  </View>
                  <Text style={styles.quickActionLabel}>{a.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Coming Soon Feature Card */}
          <WalletComingSoonCard
            title="Wallet Launching Soon"
            description="A seamless in-app wallet to power instant lead unlocks, quick refunds, referral rewards and promotional credits — all in one place."
            icon="wallet-outline"
            iconColor={colors.primary}
            progress={75}
            eta="Q4 2026"
          />

          {/* Use Cases */}
          <Text style={styles.sectionLabel}>WALLET USE CASES</Text>
          <View style={styles.useCaseGrid}>
            {useCases.map(uc => (
              <View key={uc.label} style={styles.useCaseCard}>
                <View style={[styles.useCaseIcon, { backgroundColor: uc.color + '18' }]}>
                  <Ionicons name={uc.icon as any} size={22} color={uc.color} />
                </View>
                <Text style={styles.useCaseLabel}>{uc.label}</Text>
              </View>
            ))}
          </View>

          {/* Future Features */}
          <Text style={styles.sectionLabel}>FUTURE FEATURES</Text>
          <View style={styles.featuresCard}>
            {futureFeatures.map((feat, idx) => (
              <React.Fragment key={feat.label}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: feat.color + '18' }]}>
                    <Ionicons name={feat.icon as any} size={20} color={feat.color} />
                  </View>
                  <Text style={styles.featureLabel}>{feat.label}</Text>
                  <View style={styles.disabledBadge}>
                    <Text style={styles.disabledText}>Soon</Text>
                  </View>
                </View>
                {idx < futureFeatures.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Info note */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
            <Text style={styles.noteText}>
              Wallet is powered by Razorpay. All transactions are encrypted and PCI-DSS compliant.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const CARD_W = (width - 32 - 10) / 2;

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  historyBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  // Balance Card
  balanceCard: {
    borderRadius: 28, padding: 22,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden', position: 'relative',
    ...shadows.lg,
  },
  balanceBlob1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    top: -50, right: -50, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  balanceBlob2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    bottom: -30, left: -20, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  balanceTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  balanceIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  balanceStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  balanceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  balanceStatusText: { fontSize: 12, fontWeight: '700', color: colors.textWhite },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginBottom: 6 },
  balanceAmount: {
    fontSize: 42, fontWeight: '900', color: colors.textWhite, letterSpacing: -1, marginBottom: 6,
  },
  balanceSubtitle: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 20,
  },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  quickActionLabel: { fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: '600' },

  // Section
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, paddingHorizontal: 4,
  },

  // Use Cases
  useCaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  useCaseCard: {
    width: CARD_W, backgroundColor: colors.card, borderRadius: 18,
    padding: 14, alignItems: 'center', gap: 10, ...shadows.sm,
  },
  useCaseIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  useCaseLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },

  // Features
  featuresCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  disabledBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  disabledText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 70 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight, padding: 14, borderRadius: 14,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19, fontWeight: '500' },
});

export default WalletScreen;
