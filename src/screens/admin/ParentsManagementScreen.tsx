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
import { useSelector } from 'react-redux';
import {
  AdminParent,
  deleteParent,
  getParents,
} from '../../services/adminApi';

const LIMIT = 15;

const ParentsManagementScreen: React.FC = () => {
  const token: string = useSelector((state: any) => state.auth?.token ?? '');

  const [parents, setParents] = useState<AdminParent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchParents = useCallback(
    async (pageNum: number, searchTerm: string, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      setError(null);

      try {
        const res = await getParents(token, {
          search: searchTerm || undefined,
          page: pageNum,
          limit: LIMIT,
        });

        if (res.success) {
          setParents(prev =>
            pageNum === 1 ? res.data : [...prev, ...res.data]
          );
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
    fetchParents(1, search);
  }, [fetchParents, search]);

  const onSearchChange = (text: string) => {
    setSearchInput(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(text.trim());
    }, 400);
  };

  const onRefresh = () => fetchParents(1, search, true);

  const onLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchParents(page + 1, search);
    }
  };

  const handleDelete = (parent: AdminParent) => {
    Alert.alert(
      'Deactivate Parent',
      `Deactivate ${parent.profile.firstName} ${parent.profile.lastName}?\n\nThis will also close all their active requirements.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParent(token, parent._id);
              setParents(prev => prev.filter(p => p._id !== parent._id));
              setTotal(t => t - 1);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to deactivate');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AdminParent }) => (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.profile.firstName?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>
            {item.profile.firstName} {item.profile.lastName}
          </Text>
          <Text style={styles.phone}>{item.phoneNumber}</Text>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={styles.badgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          📋 {item.requirementsCount} requirement{item.requirementsCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.metaText}>
          🗓 {new Date(item.createdAt).toLocaleDateString('en-IN')}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnDestructive]} onPress={() => handleDelete(item)}>
          <Text style={styles.btnTextDestructive}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
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
          returnKeyType="search"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{total} parent{total !== 1 ? 's' : ''}</Text>
        {error && <Text style={styles.errorBanner}>{error}</Text>}
      </View>

      <FlatList
        data={parents}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No parents found</Text>
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
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#333' },
  clearBtn: { fontSize: 16, color: '#999', padding: 4 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 4 },
  countText: { fontSize: 13, color: '#666' },
  errorBanner: { fontSize: 13, color: '#FF3B30' },
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
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  phone: { fontSize: 13, color: '#555', marginTop: 2 },
  email: { fontSize: 12, color: '#888', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeActive: { backgroundColor: '#d4edda' },
  badgeInactive: { backgroundColor: '#f8d7da' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  metaText: { fontSize: 12, color: '#666' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnDestructive: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  btnTextDestructive: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
});

export default ParentsManagementScreen;
