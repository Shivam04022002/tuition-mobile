import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Subscription, SubscriptionFilters, getSubscriptions, getSubscriptionSummary } from '../../services/adminSubscriptionApi';

interface Props {
  navigation: any;
}

const planColors: Record<string, string> = { free: '#9CA3AF', starter: '#3B82F6', professional: '#8B5CF6', premium: '#F59E0B' };
const statusColors: Record<string, string> = { active: '#10B981', cancelled: '#EF4444', expired: '#6B7280', pending: '#F59E0B', suspended: '#DC2626' };

export default function AdminSubscriptionsScreen({ navigation }: Props) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SubscriptionFilters>({ limit: 20 });
  const [summary, setSummary] = useState<any>(null);

  const loadSubscriptions = useCallback(async (pageNum: number, append = false) => {
    try {
      const response = await getSubscriptions({ ...filters, page: pageNum, search: search || undefined });
      if (response.success) {
        if (append) { setSubscriptions(prev => [...prev, ...response.data.subscriptions]); }
        else { setSubscriptions(response.data.subscriptions); }
        setHasMore(response.data.pagination.hasMore);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load subscriptions');
    }
  }, [filters, search]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await getSubscriptionSummary();
      if (response.success) setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSubscriptions(1, false), loadSummary()]);
    setLoading(false);
  }, [loadSubscriptions, loadSummary]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([loadSubscriptions(1, false), loadSummary()]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadSubscriptions(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
    loadSubscriptions(1, false);
  };

  const getPlanBadge = (plan: string) => (
    <View style={[styles.badge, { backgroundColor: planColors[plan] || colors.textTertiary }]}>
      <Text style={styles.badgeText}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Text>
    </View>
  );

  const getStatusBadge = (status: string) => (
    <View style={[styles.badge, { backgroundColor: statusColors[status] || colors.textTertiary }]}>
      <Text style={styles.badgeText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Subscription }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminSubscriptionDetail', { teacherId: item.teacher?.teacherId, subscriptionId: item.subscriptionId })}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.subscriptionId}>{item.subscriptionId}</Text>
          <Text style={styles.teacherName}>{item.teacher?.fullName || 'Unknown'}</Text>
        </View>
        <View style={styles.badges}>
          {getPlanBadge(item.planName)}
          {getStatusBadge(item.status)}
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>{item.teacher?.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.teacher?.phone}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.credits?.creditsRemaining === -1 ? '∞' : item.credits?.creditsRemaining}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.usage?.applicationsUsed || 0}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
            <Text style={styles.statLabel}>Expires</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSummary = () => {
    if (!summary) return null;
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.statusDistribution?.active || 0}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.upcomingExpirations || 0}</Text>
            <Text style={styles.summaryLabel}>Expiring Soon</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.suspendedCount || 0}</Text>
            <Text style={styles.summaryLabel}>Suspended</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="card-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyText}>No subscriptions found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
    </View>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminCreditHistory')} style={styles.headerRight}>
          <Ionicons name="wallet-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search by name, email, or ID..." value={search} onChangeText={handleSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {renderSummary()}
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textWhite },
  backButton: { padding: 4 },
  headerRight: { padding: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, margin: 16, paddingHorizontal: 12, borderRadius: 8, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: colors.text },
  summaryContainer: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, elevation: 2 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: colors.card, borderRadius: 12, marginBottom: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLeft: { flex: 1 },
  subscriptionId: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  teacherName: { fontSize: 16, fontWeight: '600', color: colors.text },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.textWhite },
  cardBody: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 12, gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  infoText: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textTertiary, marginTop: 8 },
  loader: { padding: 16 },
});
