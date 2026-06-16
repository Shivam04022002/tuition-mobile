import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { getPlatformStats, PlatformStats } from '../../services/adminApi';
import { StatsCard, EmptyState, SectionHeader } from '../../components/ui';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const { width } = Dimensions.get('window');
const STAT_GAP = 10;
const STAT_W = (width - 32 - STAT_GAP) / 2;

const AdminDashboardScreen: React.FC = () => {
  const token: string = useSelector((state: any) => state.auth?.token ?? '');
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getPlatformStats(token);
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Failed to load stats. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => fetchStats(true), [fetchStats]);

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="error-outline"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCta={() => fetchStats()}
          iconColor={colors.error}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Header */}
      <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Admin Panel 📊</Text>
            <Text style={styles.heroTitle}>Platform Overview</Text>
            <Text style={styles.heroSub}>Monitor all platform activity</Text>
          </View>
          <View style={[styles.adminBadge]}>
            <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* ── User Stats */}
      <View style={styles.section}>
        <SectionHeader title="Users" icon="people-outline" />
        <View style={styles.statsGrid}>
          <StatsCard
            label="Total Parents"
            value={stats?.totalParents ?? 0}
            icon="home-outline"
            bgColor={colors.primary}
            style={styles.statItem}
          />
          <StatsCard
            label="Total Teachers"
            value={stats?.totalTeachers ?? 0}
            icon="school-outline"
            bgColor={colors.secondary}
            style={styles.statItem}
          />
          <StatsCard
            label="Pending Approval"
            value={stats?.pendingTeachers ?? 0}
            icon="time-outline"
            bgColor={colors.accent}
            style={styles.statItem}
          />
          <StatsCard
            label="Active Requirements"
            value={stats?.activeRequirements ?? 0}
            icon="document-text-outline"
            bgColor={colors.pink}
            style={styles.statItem}
          />
        </View>
      </View>

      {/* ── Activity Stats */}
      <View style={styles.section}>
        <SectionHeader title="Activity" icon="bar-chart-outline" />
        <View style={styles.statsGrid}>
          <StatsCard
            label="Applications"
            value={stats?.totalApplications ?? 0}
            icon="send-outline"
            bgColor={colors.info}
            style={styles.statItem}
          />
          <StatsCard
            label="Demo Classes"
            value={stats?.totalDemoClasses ?? 0}
            icon="videocam-outline"
            bgColor={colors.success}
            style={styles.statItem}
          />
        </View>
      </View>

      {/* ── Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" icon="flash-outline" />
        <View style={styles.actionsGrid}>
          {[
            { label: 'Manage Teachers', icon: 'school-outline', color: colors.primary, route: 'TeachersManagement' },
            { label: 'Manage Parents', icon: 'people-outline', color: colors.secondary, route: 'ParentsManagement' },
            { label: 'View Analytics', icon: 'bar-chart-outline', color: colors.pink, route: 'Analytics' },
            { label: 'Ticket Center', icon: 'ticket-outline', color: colors.accent, route: 'TicketDashboard' },
            { label: 'Revenue Dashboard', icon: 'trending-up-outline', color: colors.success, route: 'AdminRevenueDashboard' },
            { label: 'Subscriptions', icon: 'card-outline', color: colors.primary, route: 'AdminSubscriptions' },
            { label: 'Credits Mgmt', icon: 'wallet-outline', color: colors.secondary, route: 'AdminCreditsManagement' },
            { label: 'Wallet Analytics', icon: 'wallet-outline', color: '#6B7280', route: 'AdminWalletDashboard' },
            { label: 'Live Classes', icon: 'videocam-outline', color: colors.info, route: 'AdminLiveClassesDashboard' },
            { label: 'Course Dashboard', icon: 'storefront-outline', color: colors.secondary, route: 'AdminCourseDashboard' },
            { label: 'Campaigns', icon: 'megaphone-outline', color: colors.pink, route: 'AdminCampaigns' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { borderColor: action.color + '30' }]}
              activeOpacity={0.8}
              onPress={() => (action as any).route ? navigation.navigate((action as any).route) : undefined}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '16' }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingSpinner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary + '14',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  loadingText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },

  // ── Hero
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: '500', marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.60)' },
  adminBadge: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: STAT_GAP },
  statItem: { width: STAT_W },

  // ── Quick Actions
  actionsGrid: { gap: 10 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1,
    ...shadows.sm,
  },
  actionIcon: {
    width: 42, height: 42, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
});

export default AdminDashboardScreen;
