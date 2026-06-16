import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { CreditBalance, CreditFilters, getAllCredits, getCreditsSummary } from '../../services/adminCreditsApi';

interface Props {
  navigation: any;
}

const planColors: Record<string, string> = { free: '#9CA3AF', starter: '#3B82F6', professional: '#8B5CF6', premium: '#F59E0B' };

export default function AdminCreditsManagementScreen({ navigation }: Props) {
  const [teachers, setTeachers] = useState<CreditBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<any>(null);

  const loadCredits = useCallback(async (pageNum: number, append = false) => {
    try {
      const response = await getAllCredits({ page: pageNum, limit: 20, search: search || undefined });
      if (response.success) {
        if (append) setTeachers(prev => [...prev, ...response.data.teachers]);
        else setTeachers(response.data.teachers);
        setHasMore(response.data.pagination.hasMore);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load credits');
    }
  }, [search]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await getCreditsSummary();
      if (response.success) setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCredits(1, false), loadSummary()]);
    setLoading(false);
  }, [loadCredits, loadSummary]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([loadCredits(1, false), loadSummary()]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadCredits(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
    loadCredits(1, false);
  };

  const getPlanBadge = (plan: string) => (
    <View style={[styles.badge, { backgroundColor: planColors[plan] || colors.textTertiary }]}>
      <Text style={styles.badgeText}>{plan?.charAt(0).toUpperCase() + plan?.slice(1)}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: CreditBalance }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminCreditHistory', { teacherId: item.teacher?.teacherId })}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.teacherName}>{item.teacher?.fullName || 'Unknown'}</Text>
          <Text style={styles.teacherEmail}>{item.teacher?.email}</Text>
        </View>
        {getPlanBadge(item.planName)}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.creditDisplay}>
          <View style={styles.creditItem}>
            <Text style={styles.creditValue}>{item.credits?.creditsRemaining === -1 ? '∞' : item.credits?.creditsRemaining}</Text>
            <Text style={styles.creditLabel}>Remaining</Text>
          </View>
          <View style={styles.creditDivider} />
          <View style={styles.creditItem}>
            <Text style={styles.creditValue}>{item.credits?.creditsUsed || 0}</Text>
            <Text style={styles.creditLabel}>Used</Text>
          </View>
          <View style={styles.creditDivider} />
          <View style={styles.creditItem}>
            <Text style={styles.creditValue}>{item.usage?.applicationsUsed || 0}</Text>
            <Text style={styles.creditLabel}>Applications</Text>
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
            <Text style={styles.summaryValue}>{summary.unlimitedUsers || 0}</Text>
            <Text style={styles.summaryLabel}>Unlimited</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.lowBalanceTeachers || 0}</Text>
            <Text style={styles.summaryLabel}>Low Balance</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyText}>No credit data found</Text>
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
        <Text style={styles.headerTitle}>Credits Management</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminSubscriptions')} style={styles.headerRight}>
          <Ionicons name="card-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search by name or email..." value={search} onChangeText={handleSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {renderSummary()}
      <FlatList
        data={teachers}
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
  teacherName: { fontSize: 16, fontWeight: '600', color: colors.text },
  teacherEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.textWhite },
  cardBody: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  creditDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  creditItem: { alignItems: 'center', flex: 1 },
  creditValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  creditLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  creditDivider: { width: 1, height: 40, backgroundColor: colors.border },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginTop: 16 },
  loader: { padding: 16 },
});
