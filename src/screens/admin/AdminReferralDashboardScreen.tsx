import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import * as referralApi from '../../services/referralApi';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';

const AdminReferralDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const token = useAppSelector(selectAuthToken);

  const [stats, setStats] = useState<referralApi.AdminReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<referralApi.TopReferrer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [referralsResponse, topReferrersResponse] = await Promise.all([
        referralApi.getAllReferrals(token, 1, 1),
        referralApi.getTopReferrers(token, 10),
      ]);

      if (referralsResponse.success && referralsResponse.data) {
        setStats(referralsResponse.data.stats);
      }
      if (topReferrersResponse.success && topReferrersResponse.data) {
        setTopReferrers(topReferrersResponse.data.topReferrers);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Referral Dashboard</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
        <Text style={styles.statLabel}>Total Referrals</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.rewarded || 0}</Text>
        <Text style={styles.statLabel}>Rewarded</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.totalCreditsGranted || 0}</Text>
        <Text style={styles.statLabel}>Credits Granted</Text>
      </View>
    </View>
  );

  const renderTopReferrers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Referrers</Text>
      {topReferrers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No referrers yet</Text>
        </View>
      ) : (
        topReferrers.map((referrer, index) => (
          <View key={referrer.teacherId} style={styles.referrerRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.referrerInfo}>
              <Text style={styles.referrerName}>{referrer.fullName}</Text>
              <Text style={styles.referrerCode}>Code: {referrer.referralCode}</Text>
            </View>
            <View style={styles.referrerStats}>
              <Text style={styles.referrerStat}>{referrer.rewarded} successful</Text>
              <Text style={styles.referrerCredits}>{referrer.totalCreditsEarned} credits</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading && !stats ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <>
            {renderStats()}
            {renderTopReferrers()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  headerRight: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  errorBanner: { backgroundColor: colors.errorLight, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: colors.error, fontSize: 14 },
  loader: { marginTop: 32 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  referrerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { color: colors.card, fontSize: 14, fontWeight: '600' },
  referrerInfo: { flex: 1 },
  referrerName: { fontSize: 16, fontWeight: '500', color: colors.text },
  referrerCode: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  referrerStats: { alignItems: 'flex-end' },
  referrerStat: { fontSize: 12, color: colors.textSecondary },
  referrerCredits: { fontSize: 14, fontWeight: '600', color: colors.success, marginTop: 2 },
});

export default AdminReferralDashboardScreen;
