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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import WalletComingSoonCard from './WalletComingSoonCard';

const { width } = Dimensions.get('window');
const CARD_W = (width - 32 - 10) / 2;

interface RevenueCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  change: string;
  changePositive: boolean;
}

interface RevenueRow {
  label: string;
  value: string;
  icon: string;
  color: string;
  note: string;
}

const AdminWalletDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const heroStats: RevenueCard[] = [
    {
      label: 'Total Revenue',
      value: '₹0',
      icon: 'trending-up-outline',
      color: colors.primary,
      change: '+0%',
      changePositive: true,
    },
    {
      label: 'Pending Refunds',
      value: '₹0',
      icon: 'return-down-back-outline',
      color: colors.warning,
      change: '0 requests',
      changePositive: true,
    },
    {
      label: 'Lead Unlock Revenue',
      value: '₹0',
      icon: 'lock-open-outline',
      color: colors.success,
      change: '0 unlocks',
      changePositive: true,
    },
    {
      label: 'Platform Earnings',
      value: '₹0',
      icon: 'business-outline',
      color: colors.secondary,
      change: 'Net 0%',
      changePositive: true,
    },
  ];

  const breakdownRows: RevenueRow[] = [
    {
      label: 'GST Collected',
      value: '₹0',
      icon: 'receipt-outline',
      color: colors.info,
      note: 'CGST + SGST (18%)',
    },
    {
      label: 'Razorpay Fees',
      value: '₹0',
      icon: 'card-outline',
      color: colors.pink,
      note: '2% + ₹3 per txn',
    },
    {
      label: 'Refund Processed',
      value: '₹0',
      icon: 'arrow-undo-outline',
      color: colors.warning,
      note: '7-day policy window',
    },
    {
      label: 'Promo Discounts',
      value: '₹0',
      icon: 'pricetag-outline',
      color: colors.accent,
      note: 'Active promo codes',
    },
    {
      label: 'Net Payout',
      value: '₹0',
      icon: 'wallet-outline',
      color: colors.success,
      note: 'After fees & refunds',
    },
  ];

  const monthlyMock = [
    { month: 'Jan', height: 20 },
    { month: 'Feb', height: 35 },
    { month: 'Mar', height: 25 },
    { month: 'Apr', height: 50 },
    { month: 'May', height: 40 },
    { month: 'Jun', height: 65 },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wallet Analytics</Text>
          <Text style={styles.headerSubtitle}>Demo Data — No Backend</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>DEMO</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Ionicons name="flask-outline" size={16} color={colors.accent} />
            <Text style={styles.demoNoticeText}>
              All values are mock/demo data. Real figures will appear after Razorpay integration.
            </Text>
          </View>

          {/* Hero Stats Grid */}
          <Text style={styles.sectionLabel}>REVENUE OVERVIEW</Text>
          <View style={styles.statsGrid}>
            {heroStats.map(stat => (
              <View key={stat.label} style={[styles.statCard, { width: CARD_W }]}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
                  <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={[styles.changeBadge, { backgroundColor: stat.changePositive ? colors.successLight : colors.errorLight }]}>
                  <Text style={[styles.changeText, { color: stat.changePositive ? colors.success : colors.error }]}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Breakdown Table */}
          <Text style={styles.sectionLabel}>FINANCIAL BREAKDOWN</Text>
          <View style={styles.breakdownCard}>
            {breakdownRows.map((row, idx) => (
              <React.Fragment key={row.label}>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownIcon, { backgroundColor: row.color + '18' }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.color} />
                  </View>
                  <View style={styles.breakdownText}>
                    <Text style={styles.breakdownLabel}>{row.label}</Text>
                    <Text style={styles.breakdownNote}>{row.note}</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: row.color }]}>{row.value}</Text>
                </View>
                {idx < breakdownRows.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Mock Chart */}
          <Text style={styles.sectionLabel}>MONTHLY TREND (MOCK)</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Revenue Trend</Text>
              <View style={styles.demoBadgeSmall}>
                <Text style={styles.demoBadgeSmallText}>MOCK</Text>
              </View>
            </View>
            <View style={styles.chartBars}>
              {monthlyMock.map(bar => (
                <View key={bar.month} style={styles.chartBarGroup}>
                  <View style={styles.chartBarTrack}>
                    <View style={[styles.chartBarFill, { height: bar.height, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={styles.chartBarLabel}>{bar.month}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartFooter}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.chartFooterText}>Real data after payment gateway integration</Text>
            </View>
          </View>

          {/* Coming Soon Card */}
          <WalletComingSoonCard
            title="Admin Wallet Analytics"
            description="Complete revenue dashboard with Razorpay integration — gross, GST, refunds, platform net earnings, promo impact and monthly trend charts."
            icon="bar-chart-outline"
            iconColor={colors.primary}
            progress={75}
            eta="Q4 2026"
          />

          {/* Quick Actions */}
          <Text style={styles.sectionLabel}>QUICK ACTIONS (DISABLED)</Text>
          <View style={styles.actionsCard}>
            {[
              { icon: 'checkmark-circle-outline', label: 'Process Pending Refunds', color: colors.warning },
              { icon: 'pricetag-outline', label: 'Create Promo Code', color: colors.accent },
              { icon: 'cloud-download-outline', label: 'Export Financial Report', color: colors.info },
              { icon: 'pie-chart-outline', label: 'GST Report', color: colors.secondary },
            ].map((action, idx, arr) => (
              <React.Fragment key={action.label}>
                <View style={styles.actionRow}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed-outline" size={12} color={colors.textTertiary} />
                    <Text style={styles.lockedText}>Soon</Text>
                  </View>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 1 },
  demoBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  demoBadgeText: { fontSize: 10, fontWeight: '900', color: colors.textWhite, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  demoNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.accent + '15', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colors.accent + '30',
  },
  demoNoticeText: { flex: 1, fontSize: 13, color: colors.accent, lineHeight: 19, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, paddingHorizontal: 4,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    alignItems: 'flex-start', ...shadows.card,
  },
  statIconWrap: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 8, lineHeight: 17 },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  changeText: { fontSize: 11, fontWeight: '700' },

  breakdownCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  breakdownIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  breakdownText: { flex: 1 },
  breakdownLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  breakdownNote: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  breakdownValue: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },

  chartCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, ...shadows.card },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  demoBadgeSmall: { backgroundColor: colors.accent + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  demoBadgeSmallText: { fontSize: 10, fontWeight: '800', color: colors.accent },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 80, marginBottom: 8 },
  chartBarGroup: { flex: 1, alignItems: 'center', gap: 6 },
  chartBarTrack: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  chartBarFill: { borderRadius: 4, width: '100%', minHeight: 4 },
  chartBarLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '600' },
  chartFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  chartFooterText: { fontSize: 11, color: colors.textTertiary },

  actionsCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, opacity: 0.7,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  lockedText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
});

export default AdminWalletDashboardScreen;
