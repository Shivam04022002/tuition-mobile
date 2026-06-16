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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import WalletComingSoonCard from './WalletComingSoonCard';

const FILTER_TABS = ['All', 'Credits', 'Debits', 'Refunds'];

const WalletHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emptyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(emptyBounce, { toValue: -8, duration: 1200, useNativeDriver: true }),
        Animated.timing(emptyBounce, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const summaryStats = [
    { label: 'Total In', value: '₹0', icon: 'arrow-down-circle-outline', color: colors.success },
    { label: 'Total Out', value: '₹0', icon: 'arrow-up-circle-outline', color: colors.error },
    { label: 'Refunds', value: '₹0', icon: 'return-down-back-outline', color: colors.info },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Summary Stats */}
          <View style={styles.statsRow}>
            {summaryStats.map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '18' }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTER_TABS.map((tab, idx) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, idx === 0 && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, idx === 0 && styles.filterTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Empty State */}
          <View style={styles.emptySection}>
            <Animated.View style={[styles.emptyIconWrap, { transform: [{ translateY: emptyBounce }] }]}>
              <View style={styles.emptyIconInner}>
                <Ionicons name="wallet-outline" size={48} color={colors.primary} />
              </View>
              <Text style={styles.emptyEmoji}>📭</Text>
            </Animated.View>

            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>
              Wallet is under development.{'\n'}
              Your transaction history will appear here once the wallet launches.
            </Text>

            {/* Skeleton preview rows */}
            <View style={styles.skeletonCard}>
              <Text style={styles.skeletonLabel}>Preview — Sample Transaction</Text>
              {[
                { label: 'Lead Unlock', amount: '−₹299', color: colors.error, icon: 'lock-open-outline' },
                { label: 'Referral Bonus', amount: '+₹50', color: colors.success, icon: 'gift-outline' },
                { label: 'Refund Credit', amount: '+₹299', color: colors.info, icon: 'return-down-back-outline' },
              ].map((item, idx, arr) => (
                <React.Fragment key={item.label}>
                  <View style={styles.skeletonRow}>
                    <View style={[styles.skeletonIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <View style={styles.skeletonText}>
                      <View style={styles.skeletonBarLong} />
                      <View style={styles.skeletonBarShort} />
                    </View>
                    <Text style={[styles.skeletonAmount, { color: item.color }]}>{item.amount}</Text>
                  </View>
                  {idx < arr.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
              <View style={styles.skeletonOverlay}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                <Text style={styles.skeletonOverlayText}>Available after wallet launch</Text>
              </View>
            </View>
          </View>

          {/* Coming Soon Card */}
          <WalletComingSoonCard
            title="Transaction History"
            description="All your wallet credits, debits, refunds and referral earnings will be listed here with full details and filters."
            icon="receipt-outline"
            iconColor={colors.secondary}
            progress={75}
            eta="Q4 2026"
          />

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

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
  filterBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6, ...shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, fontWeight: '500', color: colors.textTertiary, textAlign: 'center' },

  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: colors.textWhite },

  emptySection: { alignItems: 'center', paddingVertical: 10 },
  emptyIconWrap: { position: 'relative', alignItems: 'center', marginBottom: 20 },
  emptyIconInner: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: colors.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyEmoji: { position: 'absolute', bottom: -8, right: -8, fontSize: 28 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  emptySubtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },

  skeletonCard: {
    backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden',
    width: '100%', ...shadows.card, position: 'relative',
  },
  skeletonLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  skeletonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, opacity: 0.5,
  },
  skeletonIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  skeletonText: { flex: 1, gap: 6 },
  skeletonBarLong: { height: 10, borderRadius: 5, backgroundColor: colors.border, width: '70%' },
  skeletonBarShort: { height: 8, borderRadius: 4, backgroundColor: colors.borderLight, width: '40%' },
  skeletonAmount: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
  skeletonOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingVertical: 12, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  skeletonOverlayText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
});

export default WalletHistoryScreen;
