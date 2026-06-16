import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  AdminTeacher,
  approveTeacher,
  blockTeacher,
  getTeachers,
  rejectTeacher,
  unblockTeacher,
} from '../../services/adminApi';

const LIMIT = 15;

type FilterStatus = 'all' | 'pending' | 'verified' | 'rejected';

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

const TeachersManagementScreen: React.FC = () => {
  const token: string = useSelector((state: any) => state.auth?.token ?? '');
  const navigation = useNavigation<any>();

  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTeachers = useCallback(
    async (pageNum: number, searchTerm: string, status: FilterStatus, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const res = await getTeachers(token, {
          search: searchTerm || undefined,
          verificationStatus: status === 'all' ? undefined : status,
          page: pageNum,
          limit: LIMIT,
        });

        if (res.success) {
          setTeachers(prev => pageNum === 1 ? res.data : [...prev, ...res.data]);
          setTotalPages(res.pagination.pages);
          setTotal(res.pagination.total);
          setPage(pageNum);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchTeachers(1, search, filterStatus);
  }, [fetchTeachers, search, filterStatus]);

  const onSearchChange = (text: string) => {
    setSearchInput(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(text.trim()), 400);
  };

  const onRefresh = () => fetchTeachers(1, search, filterStatus, true);
  const onLoadMore = () => {
    if (!loadingMore && page < totalPages) fetchTeachers(page + 1, search, filterStatus);
  };

  const updateTeacherInList = (id: string, patch: Partial<AdminTeacher>) => {
    setTeachers(prev => prev.map(t => t._id === id ? { ...t, ...patch } : t));
  };

  const handleApprove = (t: AdminTeacher) => {
    Alert.alert('Approve Teacher', `Approve ${t.basicDetails.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveTeacher(token, t._id);
            updateTeacherInList(t._id, { verificationStatus: 'verified', isActive: true, isBlocked: false });
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          }
        },
      },
    ]);
  };

  const handleReject = (t: AdminTeacher) => {
    Alert.prompt(
      'Reject Teacher',
      `Enter rejection reason for ${t.basicDetails.fullName}:`,
      async (reason) => {
        if (!reason?.trim()) return;
        try {
          await rejectTeacher(token, t._id, reason.trim());
          updateTeacherInList(t._id, { verificationStatus: 'rejected' });
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
        }
      },
      'plain-text'
    );
  };

  const handleBlock = (t: AdminTeacher) => {
    Alert.prompt(
      'Block Teacher',
      `Enter block reason for ${t.basicDetails.fullName}:`,
      async (reason) => {
        if (!reason?.trim()) return;
        try {
          await blockTeacher(token, t._id, reason.trim());
          updateTeacherInList(t._id, { isBlocked: true, isActive: false });
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
        }
      },
      'plain-text'
    );
  };

  const handleUnblock = (t: AdminTeacher) => {
    Alert.alert('Unblock Teacher', `Unblock ${t.basicDetails.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await unblockTeacher(token, t._id);
            updateTeacherInList(t._id, { isBlocked: false, isActive: true });
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          }
        },
      },
    ]);
  };

  const statusColor = (status: string) => {
    if (status === 'verified') return { bg: '#d4edda', text: '#155724' };
    if (status === 'rejected') return { bg: '#f8d7da', text: '#721c24' };
    return { bg: '#fff3cd', text: '#856404' };
  };

  const renderItem = ({ item }: { item: AdminTeacher }) => {
    const sc = statusColor(item.verificationStatus);
    const subjects = item.teachingDetails?.subjects?.slice(0, 2).join(', ') || '—';
    const city = item.locationAvailability?.city || '—';

    return (
      <View style={[styles.card, item.isBlocked && styles.cardBlocked]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.basicDetails?.fullName?.[0] ?? 'T').toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.basicDetails?.fullName}</Text>
            <Text style={styles.sub}>{subjects}</Text>
            <Text style={styles.sub}>📍 {city}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>
              {item.verificationStatus}
            </Text>
          </View>
        </View>

        {item.isBlocked && (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedText}>⛔ BLOCKED{item.blockReason ? `: ${item.blockReason}` : ''}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => navigation.navigate('TeacherDetail', { teacherId: item._id })}
          >
            <Text style={styles.btnTextPrimary}>View</Text>
          </TouchableOpacity>

          {item.verificationStatus === 'pending' && (
            <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => handleApprove(item)}>
              <Text style={styles.btnTextSuccess}>Approve</Text>
            </TouchableOpacity>
          )}

          {item.verificationStatus !== 'rejected' && (
            <TouchableOpacity style={[styles.btn, styles.btnWarning]} onPress={() => handleReject(item)}>
              <Text style={styles.btnTextWarning}>Reject</Text>
            </TouchableOpacity>
          )}

          {item.isBlocked ? (
            <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => handleUnblock(item)}>
              <Text style={styles.btnTextSuccess}>Unblock</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnDestructive]} onPress={() => handleBlock(item)}>
              <Text style={styles.btnTextDestructive}>Block</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, mobile or email…"
          placeholderTextColor="#999"
          value={searchInput}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filterStatus === f.key && styles.filterChipActive]}
            onPress={() => setFilterStatus(f.key)}
          >
            <Text style={[styles.filterText, filterStatus === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{total} teacher{total !== 1 ? 's' : ''}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <FlatList
        data={teachers}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No teachers found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#333' },
  clearBtn: { fontSize: 16, color: '#999', padding: 4 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 12, color: '#555', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 4 },
  countText: { fontSize: 13, color: '#666' },
  errorText: { fontSize: 13, color: '#FF3B30' },
  list: { padding: 12, paddingTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBlocked: { borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  blockedBanner: {
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
  },
  blockedText: { fontSize: 12, color: '#FF3B30' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
  },
  btnPrimary: { borderColor: '#007AFF', backgroundColor: '#f0f8ff' },
  btnSuccess: { borderColor: '#34C759', backgroundColor: '#f0fff4' },
  btnWarning: { borderColor: '#FF9500', backgroundColor: '#fffbf0' },
  btnDestructive: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  btnTextPrimary: { color: '#007AFF', fontSize: 12, fontWeight: '600' },
  btnTextSuccess: { color: '#34C759', fontSize: 12, fontWeight: '600' },
  btnTextWarning: { color: '#FF9500', fontSize: 12, fontWeight: '600' },
  btnTextDestructive: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
});

export default TeachersManagementScreen;
