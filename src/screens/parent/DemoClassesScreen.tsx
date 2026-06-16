import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { apiConfig } from '../../config/api';

const API_BASE_URL = apiConfig.baseURL;

interface DemoClass {
  _id: string;
  demoId?: string;
  status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
  subject?: string;
  mode?: string;
  notes?: string;
  teacherProfileId?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
    };
  };
  applicationId?: {
    applicationId?: string;
  };
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  scheduled: { color: colors.primary, icon: 'calendar-outline', label: 'Scheduled' },
  rescheduled: { color: colors.warning ?? '#F59E0B', icon: 'refresh-outline', label: 'Rescheduled' },
  completed: { color: colors.success, icon: 'checkmark-circle-outline', label: 'Completed' },
  cancelled: { color: colors.error, icon: 'close-circle-outline', label: 'Cancelled' },
};

const FILTER_OPTIONS = [
  { label: 'All', value: undefined as string | undefined },
  { label: 'Upcoming', value: 'scheduled' },
  { label: 'Rescheduled', value: 'rescheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const DemoClassesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const [demos, setDemos] = useState<DemoClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  const fetchDemos = useCallback(async (mode: 'initial' | 'refresh') => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    if (mode === 'refresh') setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/demo-classes/parent`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.status === 401) throw new Error('Session expired. Please login again.');
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || `Failed to load demo classes (${response.status})`);
      }
      const body = await response.json();
      const list: DemoClass[] = body?.data?.democlasses ?? body?.data?.demos ?? body?.data ?? [];
      setDemos(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load demo classes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDemos('initial');
  }, [fetchDemos]);

  const handleRefresh = useCallback(() => {
    fetchDemos('refresh');
  }, [fetchDemos]);

  const filtered = selectedFilter
    ? demos.filter(d => d.status === selectedFilter)
    : demos;

  const renderItem = useCallback(({ item }: { item: DemoClass }) => {
    const tutorName = item.teacherProfileId?.basicDetails?.fullName || 'Tutor';
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.scheduled;
    const dateStr = item.scheduledDate
      ? new Date(item.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : 'Date TBD';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
            <Ionicons name={cfg.icon as any} size={26} color={cfg.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.tutorName}>{tutorName}</Text>
            {item.subject ? <Text style={styles.subjectText}>{item.subject}</Text> : null}
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.dateText}>{dateStr}{item.scheduledTime ? ` · ${item.scheduledTime}` : ''}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        {item.mode ? (
          <View style={styles.modeRow}>
            <Ionicons name={item.mode === 'online' ? 'videocam-outline' : 'home-outline'} size={13} color={colors.textSecondary} />
            <Text style={styles.modeText}>{item.mode === 'online' ? 'Online' : 'In-Person'}</Text>
          </View>
        ) : null}
        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demo Classes</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.filterTab, selectedFilter === opt.value && styles.filterTabActive]}
            onPress={() => setSelectedFilter(opt.value)}
          >
            <Text style={[styles.filterText, selectedFilter === opt.value && styles.filterTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDemos('initial')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="videocam-outline" size={56} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No demo classes</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter ? 'No demos match this filter' : 'Schedule a demo class from an application'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border ?? '#E2E8F0',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  headerRight: { width: 32 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border ?? '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  tutorName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  subjectText: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: colors.textSecondary },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  modeText: { fontSize: 12, color: colors.textSecondary },
  notesText: { fontSize: 12, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: colors.error, textAlign: 'center', marginVertical: 12 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: colors.primary,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});

export default DemoClassesScreen;
