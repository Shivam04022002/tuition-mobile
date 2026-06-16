import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { getRequirementById, ParentRequirement } from '../../services/requirementApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

// ── Types ─────────────────────────────────────────────────────────────────────

type RouteParams = {
  RequirementDetail: { requirementId: string };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type StatusConfig = {
  color: string;
  icon: string;
  label: string;
};

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'active':
      return { color: colors.success, icon: 'checkmark-circle-outline', label: 'Active' };
    case 'paused':
      return { color: colors.warning, icon: 'pause-circle-outline', label: 'Paused' };
    case 'closed':
      return { color: colors.textTertiary, icon: 'lock-closed-outline', label: 'Closed' };
    case 'expired':
      return { color: colors.error, icon: 'time-outline', label: 'Expired' };
    default:
      return { color: colors.textSecondary, icon: 'help-circle-outline', label: status };
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
  <View style={skeletonStyles.container}>
    {[180, 80, 120, 100, 140].map((w, i) => (
      <View key={i} style={[skeletonStyles.bar, { width: w }]} />
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  bar: { height: 16, borderRadius: 8, backgroundColor: colors.border ?? '#E2E8F0' },
});

// ── InfoRow ───────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <View style={styles.infoTexts}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

const RequirementDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'RequirementDetail'>>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const { requirementId } = route.params;

  const [requirement, setRequirement] = useState<ParentRequirement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'initial') setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      try {
        const result = await getRequirementById(token, requirementId);
        setRequirement(result.requirement);
      } catch (err: any) {
        if (err?.message === 'Unauthorized') {
          dispatch(logout());
          Alert.alert('Session Expired', 'Please login again');
          return;
        }
        setError(err?.message || 'Failed to load requirement');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, requirementId, dispatch],
  );

  useEffect(() => {
    fetchDetail('initial');
  }, [fetchDetail]);

  const handleEdit = useCallback(() => {
    if (!requirement) return;
    navigation.navigate('ParentRequirementForm', {
      mode: 'edit',
      editId: requirement._id,
      initialData: {
        studentName: requirement.studentDetails?.studentName || '',
        grade: requirement.studentDetails?.grade || '',
        board: requirement.studentDetails?.board || '',
        subjects: requirement.subjects || [],
        budgetMin: String(requirement.budget?.minAmount ?? 0),
        budgetMax: String(requirement.budget?.maxAmount ?? 0),
      },
    });
  }, [navigation, requirement]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Requirement Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <DetailSkeleton />
      </View>
    );
  }

  if (error || !requirement) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Requirement Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={52} color={colors.error} />
          <Text style={styles.errorText}>{error || 'Requirement not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail('initial')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(requirement.status);
  const subjects = requirement.subjects?.join(', ') || '—';
  const tuitionLabel = requirement.tuitionType
    ? requirement.tuitionType.charAt(0).toUpperCase() + requirement.tuitionType.slice(1)
    : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requirement Details</Text>
        {requirement.status === 'active' || requirement.status === 'paused' ? (
          <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchDetail('refresh')}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.reqId}>{requirement.requirementId || '—'}</Text>
              <Text style={styles.studentName}>
                {requirement.studentDetails?.studentName || 'Student'}
              </Text>
              <Text style={styles.gradeBoard}>
                {requirement.studentDetails?.grade || ''}
                {requirement.studentDetails?.board
                  ? ` • ${requirement.studentDetails.board}`
                  : ''}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '18' }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Subjects chips */}
          {requirement.subjects?.length > 0 && (
            <View style={styles.subjectsRow}>
              {requirement.subjects.map(s => (
                <View key={s} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Application count */}
          <View style={styles.appCountRow}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.appCountText}>
              {requirement.totalMatches ?? 0} application
              {(requirement.totalMatches ?? 0) !== 1 ? 's' : ''} received
            </Text>
          </View>
        </View>

        {/* Details section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirement Info</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="book-outline" label="Subjects" value={subjects} />
            <View style={styles.divider} />
            <InfoRow icon="school-outline" label="Class / Grade" value={requirement.studentDetails?.grade || '—'} />
            <View style={styles.divider} />
            <InfoRow icon="layers-outline" label="Board" value={requirement.studentDetails?.board || '—'} />
            <View style={styles.divider} />
            <InfoRow icon="home-outline" label="Tuition Mode" value={`${tuitionLabel} Tuition`} />
            <View style={styles.divider} />
            <InfoRow
              icon="cash-outline"
              label="Budget"
              value={`₹${requirement.budget?.minAmount ?? 0} – ₹${requirement.budget?.maxAmount ?? 0}/month`}
            />
            {requirement.location?.city ? (
              <>
                <View style={styles.divider} />
                <InfoRow icon="location-outline" label="City" value={requirement.location.city} />
              </>
            ) : null}
            {requirement.schedule?.preferredTimings?.length > 0 ? (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="time-outline"
                  label="Preferred Timings"
                  value={requirement.schedule.preferredTimings.join(', ')}
                />
              </>
            ) : null}
          </View>
        </View>

        {/* Timeline section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline" label="Created" value={formatDate(requirement.createdAt)} />
            <View style={styles.divider} />
            <InfoRow icon="refresh-outline" label="Last Updated" value={formatDate(requirement.updatedAt)} />
            {requirement.expiresAt ? (
              <>
                <View style={styles.divider} />
                <InfoRow icon="hourglass-outline" label="Expires" value={formatDate(requirement.expiresAt)} />
              </>
            ) : null}
          </View>
        </View>

        {/* Notes */}
        {!!requirement.tutorPreferences && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={[styles.infoCard, styles.notesCard]}>
              <Text style={styles.notesText}>{requirement.tutorPreferences}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border ?? '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 10,
  },
  editBtn: { padding: 4 },
  headerSpacer: { width: 28 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    ...shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroLeft: { flex: 1, marginRight: 12 },
  reqId: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  studentName: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
  gradeBoard: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.primary + '12',
  },
  subjectChipText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  appCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border ?? '#E2E8F0',
  },
  appCountText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  section: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 4,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border ?? '#E2E8F0',
    marginHorizontal: 16,
  },

  notesCard: { paddingHorizontal: 16, paddingVertical: 14 },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 22 },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default RequirementDetailScreen;
