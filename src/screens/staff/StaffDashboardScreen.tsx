import React, { useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useStaffDashboard } from '../../hooks/useStaffPortal';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, sub }) => {
  const scale = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Animated.View>
  );
};


const QUICK_ACTIONS = [
  { label: 'Tickets', icon: 'ticket-outline', color: colors.error, route: 'StaffTickets' },
  { label: 'Verification Queue', icon: 'shield-checkmark-outline', color: colors.accent, route: 'StaffVerification' },
  { label: 'Reports', icon: 'bar-chart-outline', color: colors.success, route: 'StaffReports' },
];

const COMING_SOON = [
  { label: 'Advanced Operations', icon: 'construct-outline' },
  { label: 'Bulk Actions', icon: 'layers-outline' },
  { label: 'Automation Rules', icon: 'flash-outline' },
];

const StaffDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { dashboard, isLoading, isRefreshing, error, refresh, retry } = useStaffDashboard();

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const stats = [
    {
      label: 'Open Tickets',
      value: dashboard?.openTickets ?? 0,
      icon: 'ticket-outline',
      color: colors.error,
      sub: dashboard ? `${dashboard.urgentTickets} urgent` : undefined,
    },
    {
      label: 'Pending Verifications',
      value: dashboard?.pendingVerifications ?? 0,
      icon: 'shield-checkmark-outline',
      color: colors.accent,
      sub: undefined,
    },
    {
      label: 'Verified Teachers',
      value: dashboard?.resolvedToday ?? 0,
      icon: 'checkmark-circle-outline',
      color: colors.success,
      sub: undefined,
    },
    {
      label: 'Resolved Today',
      value: dashboard?.resolvedToday ?? 0,
      icon: 'checkmark-done-outline',
      color: colors.info,
      sub: undefined,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          colors={[colors.info]}
          tintColor={colors.info}
        />
      }
    >
      {/* ── Hero */}
      <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroGreeting}>Staff Panel 🛡️</Text>
            <Text style={styles.heroTitle}>Operations Hub</Text>
            <Text style={styles.heroSub}>Manage tickets & verifications</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="person-circle-outline" size={26} color="#FFF" />
          </View>
        </View>

        {/* Mini task strip */}
        <View style={styles.taskStrip}>
          <View style={styles.taskItem}>
            <Text style={styles.taskNum}>3</Text>
            <Text style={styles.taskTxt}>Done</Text>
          </View>
          <View style={styles.taskDivider} />
          <View style={styles.taskItem}>
            <Text style={styles.taskNum}>5</Text>
            <Text style={styles.taskTxt}>Pending</Text>
          </View>
          <View style={styles.taskDivider} />
          <View style={styles.taskItem}>
            <Text style={styles.taskNum}>8</Text>
            <Text style={styles.taskTxt}>Total</Text>
          </View>
        </View>
      </View>

      {/* ── Stats Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.info} />
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        {isLoading && !dashboard ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.info} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : error && !dashboard ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to load dashboard</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </View>
        )}
      </View>

      {/* ── Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { borderColor: a.color + '30' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(a.route)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Coming Soon */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Ionicons name="rocket-outline" size={18} color={colors.secondary} />
          </Animated.View>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
        </View>
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>🚀 Coming Soon</Text>
          </View>
          {COMING_SOON.map((item) => (
            <View key={item.label} style={styles.comingSoonRow}>
              <View style={styles.comingSoonIcon}>
                <Ionicons name={item.icon as any} size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.comingSoonLabel}>{item.label}</Text>
                <Text style={styles.comingSoonSub}>Under development — Q3 2027</Text>
              </View>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.secondary} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 24 },

  hero: {
    backgroundColor: colors.info,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  heroBadge: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },

  taskStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  taskItem: { alignItems: 'center' },
  taskNum: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  taskTxt: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  taskDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.30)' },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 4 },
  statSub: { fontSize: 11, color: colors.textTertiary, marginTop: 3 },

  actionsGrid: { gap: 10 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1,
    ...shadows.sm,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

  comingSoonCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
    ...shadows.sm,
    gap: 14,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary + '15',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  comingSoonBadgeText: { fontSize: 13, fontWeight: '700', color: colors.secondary },
  comingSoonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  comingSoonIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.secondary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  comingSoonLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  comingSoonSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  lockedBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: colors.secondary + '12',
    justifyContent: 'center', alignItems: 'center',
  },

  loadingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 20, justifyContent: 'center',
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  errorBox: {
    alignItems: 'center', gap: 8, paddingVertical: 20,
  },
  errorTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.info, borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

export default StaffDashboardScreen;
