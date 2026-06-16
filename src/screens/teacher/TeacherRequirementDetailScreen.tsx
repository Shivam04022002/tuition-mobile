import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import {
  getRequirementDetail,
  getMatchAnalysis,
  saveRequirement,
  unsaveRequirement,
  hideRequirement,
  RequirementDetail,
  MatchAnalysis,
} from '../../services/requirementsMarketplaceApi';
import {
  getCreditBalance,
  unlockLead as apiUnlockLead,
  CreditBalance,
  ParentContactDetails,
} from '../../services/creditApi';

// ── Route params ───────────────────────────────────────────────────────────────
type RouteParams = {
  RequirementDetail: {
    requirementId: string;
    item?: any;
  };
};

// ── Match colour helpers ───────────────────────────────────────────────────────
const getMatchColor = (score: number): string => {
  if (score >= 90) return colors.success;
  if (score >= 75) return colors.primary;
  if (score >= 60) return colors.accent;
  return colors.textSecondary;
};

const getMatchLabel = (score: number): string => {
  if (score >= 90) return 'Excellent Match';
  if (score >= 75) return 'Good Match';
  if (score >= 60) return 'Fair Match';
  return 'Low Match';
};

// ── Status config ─────────────────────────────────────────────────────────────
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':  return { label: 'Active',  color: colors.success, icon: 'checkmark-circle' };
    case 'paused':  return { label: 'Paused',  color: colors.accent,  icon: 'pause-circle' };
    case 'closed':  return { label: 'Closed',  color: colors.error,   icon: 'close-circle' };
    case 'expired': return { label: 'Expired', color: colors.textSecondary, icon: 'time' };
    default:        return { label: status,    color: colors.textSecondary, icon: 'help-circle' };
  }
};

const getApplicationStatusConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'applied':        return { label: 'Applied',         color: colors.info,    icon: 'paper-plane' };
    case 'shortlisted':    return { label: 'Shortlisted',     color: colors.success, icon: 'star' };
    case 'rejected':       return { label: 'Not Selected',    color: colors.error,   icon: 'close-circle' };
    case 'hired':          return { label: 'Selected!',       color: colors.success, icon: 'trophy' };
    case 'recommended':    return { label: 'Demo Scheduled',  color: colors.accent,  icon: 'calendar' };
    case 'viewed':         return { label: 'Viewed',          color: colors.textSecondary, icon: 'eye' };
    default:               return { label: 'Not Applied',     color: colors.textSecondary, icon: 'document-outline' };
  }
};

const tuitionLabel = (type: string) =>
  ({ home: 'Home Tuition', online: 'Online', group: 'Group', crash: 'Crash Course' }[type] || type);

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

const fmtDate = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
const shimmer = colors.border + '90';

const SkelBar: React.FC<{ w?: number | string; h?: number; mt?: number }> = ({ w = '100%', h = 14, mt = 0 }) => (
  <View style={{ width: w as any, height: h, borderRadius: 6, backgroundColor: shimmer, marginTop: mt }} />
);

const DetailSkeleton: React.FC = () => (
  <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
    {[0, 1, 2, 3, 4].map(i => (
      <View key={i} style={[skelStyles.card, { marginBottom: 12 }]}>
        <SkelBar h={16} w="55%" />
        <SkelBar h={12} mt={10} w="80%" />
        <SkelBar h={12} mt={6} w="65%" />
        <SkelBar h={12} mt={6} w="70%" />
      </View>
    ))}
  </ScrollView>
);

const MatchSkeleton: React.FC = () => (
  <View style={skelStyles.card}>
    <SkelBar h={16} w="60%" />
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <SkelBar w={90} h={11} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: shimmer }} />
        </View>
        <SkelBar w={34} h={11} mt={0} />
      </View>
    ))}
  </View>
);

const skelStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

// ── Match Bar ──────────────────────────────────────────────────────────────────
const MatchBar: React.FC<{ label: string; score: number; weight: string }> = ({ label, score, weight }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score / 100, duration: 700, useNativeDriver: false }).start();
  }, [score, anim]);
  const barColor = getMatchColor(score);
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <Animated.View
          style={[
            barStyles.fill,
            { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={[barStyles.pct, { color: barColor }]}>{score}%</Text>
      <Text style={barStyles.weight}>{weight}</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  label:  { width: 92, fontSize: 12, color: colors.textSecondary },
  track:  { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  fill:   { height: '100%', borderRadius: 3 },
  pct:    { width: 34, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  weight: { width: 30, fontSize: 10, color: colors.textTertiary, textAlign: 'right' },
});

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <View style={sectionStyles.card}>
    <View style={sectionStyles.header}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  card:   { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title:  { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 8 },
});

// ── Row item ──────────────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; value?: string | number; chip?: boolean; chipColor?: string }> = ({
  label, value, chip, chipColor,
}) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    {chip && value ? (
      <View style={[rowStyles.chip, { backgroundColor: (chipColor || colors.primary) + '18', borderColor: (chipColor || colors.primary) + '40' }]}>
        <Text style={[rowStyles.chipText, { color: chipColor || colors.primary }]}>{value}</Text>
      </View>
    ) : (
      <Text style={rowStyles.value}>{value ?? '—'}</Text>
    )}
  </View>
);

const rowStyles = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label:    { fontSize: 13, color: colors.textSecondary, flex: 1 },
  value:    { fontSize: 13, color: colors.text, fontWeight: '500', flex: 1.2, textAlign: 'right' },
  chip:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
});

// ── Timeline item ──────────────────────────────────────────────────────────────
const TimelineItem: React.FC<{ label: string; date?: string; active?: boolean; last?: boolean }> = ({
  label, date, active, last,
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
    <View style={{ alignItems: 'center', width: 22 }}>
      <View style={[tlStyles.dot, { backgroundColor: active ? colors.primary : colors.border }]} />
      {!last && <View style={[tlStyles.line, { backgroundColor: colors.border }]} />}
    </View>
    <View style={{ flex: 1, paddingBottom: last ? 0 : 16, paddingLeft: 10 }}>
      <Text style={[tlStyles.label, { color: active ? colors.text : colors.textSecondary }]}>{label}</Text>
      <Text style={tlStyles.date}>{date ? fmtDate(date) : '—'}</Text>
    </View>
  </View>
);

const tlStyles = StyleSheet.create({
  dot:   { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  line:  { width: 2, flex: 1, minHeight: 16, marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600' },
  date:  { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

// ══════════════════════════════════════════════════════════════════════════════
// Main Screen
// ══════════════════════════════════════════════════════════════════════════════
const TeacherRequirementDetailScreen: React.FC = () => {
  const insets    = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route     = useRoute<RouteProp<RouteParams, 'RequirementDetail'>>();
  const dispatch  = useAppDispatch();
  const token     = useAppSelector(selectAuthToken);

  const { requirementId } = route.params;

  const [detail, setDetail]         = useState<RequirementDetail | null>(null);
  const [analysis, setAnalysis]     = useState<MatchAnalysis | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [isSaved,     setIsSaved]     = useState(false);
  const [isHidden,    setIsHidden]    = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isHiding,    setIsHiding]    = useState(false);

  // Credit / Unlock state
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [isUnlocked, setIsUnlocked]       = useState(false);
  const [isUnlocking, setIsUnlocking]     = useState(false);
  const [parentContact, setParentContact] = useState<ParentContactDetails | null>(null);
  const [unlockId, setUnlockId]           = useState<string | null>(null);

  // ── Fetch detail ────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (mode: 'initial' | 'refresh') => {
    if (!token) return;
    mode === 'initial' ? setIsLoading(true) : setIsRefreshing(true);
    setError(null);
    try {
      const data = await getRequirementDetail(token, requirementId);
      setDetail(data);
      setIsSaved(data.isSaved ?? false);
      setIsHidden(data.isHidden ?? false);
      if (__DEV__) console.log('[ReqDetail] Requirement Detail Viewed', { requirementId });
    } catch (err: any) {
      if (err?.message === 'Unauthorized') { dispatch(logout()); return; }
      setError(err?.message || 'Failed to load requirement');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, requirementId, dispatch]);

  // ── Fetch match analysis (lazy) ─────────────────────────────────────────────
  const fetchAnalysis = useCallback(async () => {
    if (!token || analysis) return;
    setAnalysisLoading(true);
    try {
      const data = await getMatchAnalysis(token, requirementId);
      setAnalysis(data);
    } catch (_) {
      // non-fatal — show empty state
    } finally {
      setAnalysisLoading(false);
    }
  }, [token, requirementId, analysis]);

  useEffect(() => {
    fetchDetail('initial');
  }, [fetchDetail]);

  // Lazy-load match analysis after detail loads
  useEffect(() => {
    if (detail && !analysis) fetchAnalysis();
  }, [detail, analysis, fetchAnalysis]);

  // Fetch credit balance
  useEffect(() => {
    if (!token) return;
    getCreditBalance(token)
      .then(b => setCreditBalance(b))
      .catch(() => {});
  }, [token]);

  // ── Apply ───────────────────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    if (!token || !detail) return;
    const appStatus = detail.applicationStatus;
    if (appStatus && appStatus !== 'viewed' && appStatus !== 'recommended' && appStatus !== null) {
      Alert.alert('Already Applied', `Your application status: ${appStatus}`);
      return;
    }
    // Navigate to full application form
    if (__DEV__) console.log('[ReqDetail] Apply Clicked', { requirementId });
    navigation.navigate('ApplyToRequirement', { requirement: detail });
  }, [token, detail, navigation, requirementId]);

  // ── Save toggle ─────────────────────────────────────────────────────────────
  const handleSaveToggle = useCallback(async () => {
    if (!token || !detail || isSaving) return;
    const next = !isSaved;
    setIsSaved(next); // optimistic
    setIsSaving(true);
    try {
      if (next) {
        await saveRequirement(token, detail.requirementId);
        if (__DEV__) console.log('[ReqDetail] Requirement Saved', { requirementId });
      } else {
        await unsaveRequirement(token, detail.requirementId);
      }
    } catch (err: any) {
      setIsSaved(!next); // revert
      Alert.alert('Error', err?.message || 'Failed to update bookmark');
    } finally {
      setIsSaving(false);
    }
  }, [token, detail, isSaved, isSaving, requirementId]);

  // ── Hide ────────────────────────────────────────────────────────────────────
  const handleHide = useCallback(() => {
    if (!token || !detail) return;
    Alert.alert(
      'Hide Requirement',
      'This requirement will no longer appear in your marketplace. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: async () => {
            setIsHiding(true);
            try {
              await hideRequirement(token, detail.requirementId);
              setIsHidden(true);
              if (__DEV__) console.log('[ReqDetail] Requirement Hidden', { requirementId });
              Alert.alert('Hidden', 'This requirement has been hidden from your marketplace.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to hide requirement');
            } finally {
              setIsHiding(false);
            }
          },
        },
      ],
    );
  }, [token, detail, navigation, requirementId]);

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `📚 Tuition Requirement\nID: ${detail.requirementId}\nSubjects: ${detail.subjects.join(', ')}\nGrade: ${detail.studentDetails.grade} | Board: ${detail.studentDetails.board}\nBudget: ₹${detail.budget.minAmount.toLocaleString()}–₹${detail.budget.maxAmount.toLocaleString()}/month\nMode: ${tuitionLabel(detail.tuitionType)}\nLocation: ${detail.location.city}`,
        title: `Tuition Requirement – ${detail.requirementId}`,
      });
      if (__DEV__) console.log('[ReqDetail] Requirement Shared', { requirementId });
    } catch (_) {}
  }, [detail, requirementId]);

  // ── Unlock Lead ──────────────────────────────────────────────────────────────
  const handleUnlockLead = useCallback(async () => {
    if (!token || !detail || isUnlocking) return;
    if (!creditBalance || (!creditBalance.isUnlimited && creditBalance.creditsRemaining <= 0)) {
      Alert.alert('No Credits', 'You have no credits remaining. Upgrade your plan to unlock leads.');
      return;
    }
    Alert.alert(
      'Unlock Lead',
      `Use 1 credit to unlock parent contact information?\n\nCredits remaining: ${creditBalance.isUnlimited ? '∞' : creditBalance.creditsRemaining}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            setIsUnlocking(true);
            try {
              const result = await apiUnlockLead(token, detail.requirementId);
              setIsUnlocked(true);
              setParentContact(result.parentContactDetails);
              setUnlockId(result.unlockId);
              // Refresh balance
              try {
                const b = await getCreditBalance(token);
                setCreditBalance(b);
              } catch (_) {}
              if (__DEV__) console.log('[ReqDetail] Lead Unlocked', { requirementId });
              Alert.alert('Lead Unlocked!', 'Parent contact information is now visible below.');
            } catch (err: any) {
              if (err?.message === 'SESSION_EXPIRED') { dispatch(logout()); return; }
              // If already unlocked (409), the API returns data
              if (err?.message?.includes('already unlocked')) {
                setIsUnlocked(true);
              }
              Alert.alert('Unlock Failed', err?.message || 'Failed to unlock lead');
            } finally {
              setIsUnlocking(false);
            }
          },
        },
      ],
    );
  }, [token, detail, isUnlocking, creditBalance, dispatch, requirementId]);

  // ── Applied status ──────────────────────────────────────────────────────────
  const canApply = useMemo(() => {
    if (!detail) return false;
    const s = detail.applicationStatus;
    return !s || s === 'viewed' || s === 'recommended';
  }, [detail]);

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <DetailSkeleton />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load requirement</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail('initial')}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusCfg    = getStatusConfig(detail.status);
  const appStatusCfg = getApplicationStatusConfig(detail.applicationStatus);
  const matchColor   = getMatchColor(detail.matchScore);
  const matchLabel   = getMatchLabel(detail.matchScore);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <ScreenHeader
        onBack={() => navigation.goBack()}
        onSave={handleSaveToggle}
        onShare={handleShare}
        isSaved={isSaved}
        isSaving={isSaving}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchDetail('refresh')} tintColor={colors.primary} />
        }
      >

        {/* ── SECTION 1: Header Card ─────────────────────────────────────── */}
        <View style={[s1.card, { borderColor: matchColor + '40' }]}>
          <View style={s1.topRow}>
            <View>
              <Text style={s1.reqId}>{detail.requirementId}</Text>
              <Text style={s1.postedDate}>Posted {timeAgo(detail.createdAt)}</Text>
            </View>
            <View style={[s1.matchBadge, { backgroundColor: matchColor + '18', borderColor: matchColor + '40' }]}>
              <Text style={[s1.matchPct, { color: matchColor }]}>{detail.matchScore}%</Text>
              <Text style={[s1.matchLabel, { color: matchColor }]}>{matchLabel}</Text>
            </View>
          </View>

          <View style={s1.statusRow}>
            <View style={[s1.statusBadge, { backgroundColor: statusCfg.color + '18' }]}>
              <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
              <Text style={[s1.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
            <View style={s1.appsRow}>
              <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
              <Text style={s1.appsText}>{detail.applicationsCount} applicants</Text>
            </View>
          </View>

          {/* Application status pill */}
          <View style={[s1.appStatusPill, { backgroundColor: appStatusCfg.color + '15', borderColor: appStatusCfg.color + '40' }]}>
            <Ionicons name={appStatusCfg.icon as any} size={14} color={appStatusCfg.color} />
            <Text style={[s1.appStatusText, { color: appStatusCfg.color }]}>{appStatusCfg.label}</Text>
          </View>
        </View>

        {/* ── SECTION 2: Student Details ─────────────────────────────────── */}
        <Section title="Student Details" icon="person-outline">
          <Row label="Class / Grade"  value={detail.studentDetails.grade} />
          <Row label="Board"          value={detail.studentDetails.board} />
          <Row label="Student Name"   value={detail.studentDetails.studentName || '—'} />
          <View style={chipRow.wrap}>
            <Text style={chipRow.label}>Subjects</Text>
            <View style={chipRow.chips}>
              {detail.subjects.map(s => (
                <View key={s} style={[chipRow.chip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                  <Text style={[chipRow.chipText, { color: colors.primary }]}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          {detail.studentDetails.genderPreference && detail.studentDetails.genderPreference !== 'any' && (
            <Row label="Gender Preference" value={detail.studentDetails.genderPreference} chip chipColor={colors.info} />
          )}
        </Section>

        {/* ── SECTION 3: Tuition Details ─────────────────────────────────── */}
        <Section title="Tuition Details" icon="book-outline">
          <Row label="Teaching Mode"     value={tuitionLabel(detail.tuitionType)} chip chipColor={colors.secondary} />
          <Row label="Sessions / Week"   value={detail.schedule.daysPerWeek} />
          <Row label="Expected Start"    value={fmtDate(detail.schedule.startDate)} />
          {detail.schedule.preferredTimings.length > 0 && (
            <View style={chipRow.wrap}>
              <Text style={chipRow.label}>Preferred Timings</Text>
              <View style={chipRow.chips}>
                {detail.schedule.preferredTimings.map(t => (
                  <View key={t} style={[chipRow.chip, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                    <Text style={[chipRow.chipText, { color: colors.accentDark }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Section>

        {/* ── SECTION 4: Location ────────────────────────────────────────── */}
        <Section title="Location" icon="location-outline">
          <Row label="City"     value={detail.location.city} />
          <Row label="Area"     value={detail.location.address || '—'} />
          <Row label="Pincode"  value={detail.location.pincode} />
          <Row label="Travel Radius" value={`Up to ${(detail as any).location?.teachingRadius ?? '—'} km`} />
          {/* Map placeholder — future-ready */}
          <View style={mapPlaceholder.box}>
            <Ionicons name="map-outline" size={28} color={colors.textTertiary} />
            <Text style={mapPlaceholder.text}>Map view coming soon</Text>
          </View>
        </Section>

        {/* ── SECTION 5: Budget ──────────────────────────────────────────── */}
        <Section title="Budget" icon="cash-outline">
          <Row label="Budget Range"
               value={`₹${detail.budget.minAmount.toLocaleString()} – ₹${detail.budget.maxAmount.toLocaleString()}`} />
          <Row label="Monthly Budget"   value={`₹${detail.budget.maxAmount.toLocaleString()}`} />
          <Row label="Negotiable"
               value={detail.budget.negotiationAllowed ? 'Yes' : 'No'}
               chip
               chipColor={detail.budget.negotiationAllowed ? colors.success : colors.textSecondary} />
        </Section>

        {/* ── SECTION 6: Parent Preferences ─────────────────────────────── */}
        <Section title="Parent Preferences" icon="options-outline">
          {detail.studentDetails.genderPreference && (
            <Row label="Preferred Gender" value={
              detail.studentDetails.genderPreference === 'any' ? 'Any' :
              detail.studentDetails.genderPreference.charAt(0).toUpperCase() + detail.studentDetails.genderPreference.slice(1)
            } />
          )}
          {detail.languagePreference && detail.languagePreference.length > 0 && (
            <View style={chipRow.wrap}>
              <Text style={chipRow.label}>Languages</Text>
              <View style={chipRow.chips}>
                {detail.languagePreference.map(l => (
                  <View key={l} style={[chipRow.chip, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}>
                    <Text style={[chipRow.chipText, { color: colors.info }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {detail.tutorPreferences ? (
            <View style={{ marginTop: 8 }}>
              <Text style={[rowStyles.label, { marginBottom: 4 }]}>Additional Notes</Text>
              <Text style={notesStyle.text}>{detail.tutorPreferences}</Text>
            </View>
          ) : null}
        </Section>

        {/* ── SECTION 7: Match Analysis ──────────────────────────────────── */}
        <Section title="Match Analysis" icon="analytics-outline">
          {/* Overall score hero */}
          <View style={matchStyles.hero}>
            <Text style={[matchStyles.heroScore, { color: matchColor }]}>{detail.matchScore}%</Text>
            <Text style={[matchStyles.heroLabel, { color: matchColor }]}>{matchLabel}</Text>
          </View>

          {analysisLoading ? (
            <MatchSkeleton />
          ) : analysis ? (
            <View>
              <MatchBar label="Subject"      score={analysis.breakdown.subject.rawScore}      weight="30%" />
              <MatchBar label="Class"        score={analysis.breakdown.class.rawScore}        weight="18%" />
              <MatchBar label="Board"        score={analysis.breakdown.board.rawScore}        weight="12%" />
              <MatchBar label="Location"     score={analysis.breakdown.location.rawScore}     weight="15%" />
              <MatchBar label="Budget"       score={analysis.breakdown.budget.rawScore}       weight="10%" />
              <MatchBar label="Mode"         score={analysis.breakdown.mode.rawScore}         weight="10%" />
              <MatchBar label="Availability" score={analysis.breakdown.availability.rawScore} weight="5%" />

              {/* Subject detail */}
              {analysis.breakdown.subject.matchedSubjects && analysis.breakdown.subject.matchedSubjects.length > 0 && (
                <View style={matchStyles.detail}>
                  <Text style={matchStyles.detailLabel}>Matched Subjects:</Text>
                  <Text style={matchStyles.detailVal}>{analysis.breakdown.subject.matchedSubjects.join(', ')}</Text>
                </View>
              )}
              {/* Location detail */}
              {analysis.breakdown.location.requirementCity && (
                <View style={matchStyles.detail}>
                  <Text style={matchStyles.detailLabel}>City:</Text>
                  <Text style={matchStyles.detailVal}>
                    Req: {analysis.breakdown.location.requirementCity} | You: {analysis.breakdown.location.teacherCity || '—'}
                  </Text>
                </View>
              )}
              {/* Budget detail */}
              {analysis.breakdown.budget.requirementMax !== undefined && (
                <View style={matchStyles.detail}>
                  <Text style={matchStyles.detailLabel}>Budget vs Rate:</Text>
                  <Text style={matchStyles.detailVal}>
                    ₹{analysis.breakdown.budget.requirementMin?.toLocaleString()}–₹{analysis.breakdown.budget.requirementMax?.toLocaleString()} | Your rate: ₹{analysis.breakdown.budget.teacherRate?.toLocaleString() || '—'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyAnalysis}>
              <Ionicons name="bar-chart-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyAnalysisText}>No match data available</Text>
            </View>
          )}
        </Section>

        {/* ── SECTION 8: Competition ─────────────────────────────────────── */}
        <Section title="Competition" icon="podium-outline">
          {analysis ? (
            <View>
              <View style={compStyles.grid}>
                <CompStat label="Total Applied" value={analysis.competition.total} color={colors.info} />
                <CompStat label="Shortlisted"   value={analysis.competition.shortlisted} color={colors.success} />
                <CompStat label="Rejected"      value={analysis.competition.rejected}    color={colors.error} />
                <CompStat label="Selected"      value={analysis.competition.selected}    color={colors.accent} />
              </View>
              {analysis.competition.myPosition !== null && (
                <View style={compStyles.positionBanner}>
                  <Ionicons name="trophy-outline" size={16} color={colors.primary} />
                  <Text style={compStyles.positionText}>
                    You are ranked #{analysis.competition.myPosition} out of {analysis.competition.total} applicants
                  </Text>
                </View>
              )}
            </View>
          ) : analysisLoading ? (
            <View style={styles.emptyAnalysis}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyAnalysis}>
              <Ionicons name="people-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyAnalysisText}>No competition data available</Text>
            </View>
          )}
        </Section>

        {/* ── SECTION 9: Requirement Timeline ───────────────────────────── */}
        <Section title="Requirement Timeline" icon="time-outline">
          <TimelineItem label="Posted"  date={detail.createdAt}  active />
          <TimelineItem label="Updated" date={detail.updatedAt}  active={!!detail.updatedAt} />
          <TimelineItem label="Expires" date={detail.expiresAt}  active={false} />
          <TimelineItem label="Closed"  date={detail.status === 'closed' ? detail.updatedAt : undefined} last />
        </Section>

        {/* ── SECTION 10: Application Status ────────────────────────────── */}
        <Section title="Application Status" icon="document-text-outline">
          <View style={appStyles.statusCard}>
            <Ionicons name={appStatusCfg.icon as any} size={36} color={appStatusCfg.color} />
            <View style={{ marginLeft: 14 }}>
              <Text style={[appStyles.statusLabel, { color: appStatusCfg.color }]}>{appStatusCfg.label}</Text>
              <Text style={appStyles.statusSub}>
                {detail.applicationStatus
                  ? `Your application is ${detail.applicationStatus}`
                  : 'You have not applied to this requirement yet.'}
              </Text>
            </View>
          </View>
        </Section>

        {/* ── SECTION 11: Credit Balance Widget ──────────────────────────── */}
        <Section title="Credit Balance" icon="wallet-outline">
          {creditBalance ? (
            <View>
              <View style={unlockStyles.creditRow}>
                <View style={unlockStyles.creditStat}>
                  <Text style={unlockStyles.creditNum}>
                    {creditBalance.isUnlimited ? '∞' : creditBalance.creditsRemaining}
                  </Text>
                  <Text style={unlockStyles.creditLabel}>Remaining</Text>
                </View>
                <View style={unlockStyles.creditDivider} />
                <View style={unlockStyles.creditStat}>
                  <Text style={unlockStyles.creditNum}>{creditBalance.creditsUsed}</Text>
                  <Text style={unlockStyles.creditLabel}>Used</Text>
                </View>
                <View style={unlockStyles.creditDivider} />
                <View style={unlockStyles.creditStat}>
                  <Text style={unlockStyles.creditNum}>
                    {creditBalance.isUnlimited ? '∞' : creditBalance.totalCredits}
                  </Text>
                  <Text style={unlockStyles.creditLabel}>Total/Mo</Text>
                </View>
              </View>
              <TouchableOpacity
                style={unlockStyles.viewCreditsBtn}
                onPress={() => navigation.navigate('TeacherCredits')}
              >
                <Text style={unlockStyles.viewCreditsText}>View Credit History →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </Section>

        {/* ── SECTION 12: Unlock Lead / Contact Info ─────────────────────── */}
        <Section title={isUnlocked ? 'Parent Contact' : 'Unlock Lead'} icon={isUnlocked ? 'call-outline' : 'lock-closed-outline'}>
          {isUnlocked && parentContact ? (
            <View>
              <View style={unlockStyles.unlockedBadge}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <Text style={unlockStyles.unlockedBadgeText}>Lead Unlocked</Text>
                {unlockId && <Text style={unlockStyles.unlockIdText}>#{unlockId}</Text>}
              </View>
              <View style={unlockStyles.contactCard}>
                <View style={unlockStyles.contactRow}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                  <Text style={unlockStyles.contactLabel}>Name</Text>
                  <Text style={unlockStyles.contactValue}>{parentContact.parentName}</Text>
                </View>
                <View style={unlockStyles.contactRow}>
                  <Ionicons name="call-outline" size={16} color={colors.success} />
                  <Text style={unlockStyles.contactLabel}>Mobile</Text>
                  <Text style={unlockStyles.contactValue}>{parentContact.mobileNumber}</Text>
                </View>
                <View style={unlockStyles.contactRow}>
                  <Ionicons name="mail-outline" size={16} color={colors.info} />
                  <Text style={unlockStyles.contactLabel}>Email</Text>
                  <Text style={unlockStyles.contactValue}>{parentContact.email}</Text>
                </View>
                <View style={unlockStyles.contactRow}>
                  <Ionicons name="location-outline" size={16} color={colors.accent} />
                  <Text style={unlockStyles.contactLabel}>Address</Text>
                  <Text style={[unlockStyles.contactValue, { flex: 1 }]} numberOfLines={2}>{parentContact.address}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={unlockStyles.lockedContainer}>
              <View style={unlockStyles.lockedIcon}>
                <Ionicons name="lock-closed" size={32} color={colors.textTertiary} />
              </View>
              <Text style={unlockStyles.lockedTitle}>Contact info is locked</Text>
              <Text style={unlockStyles.lockedDesc}>
                Use 1 credit to unlock parent contact information for this requirement.
              </Text>
              <TouchableOpacity
                style={[
                  unlockStyles.unlockBtn,
                  { opacity: isUnlocking ? 0.7 : 1 },
                  (!creditBalance || (!creditBalance.isUnlimited && creditBalance.creditsRemaining <= 0))
                    ? { backgroundColor: colors.textTertiary }
                    : {},
                ]}
                onPress={handleUnlockLead}
                disabled={isUnlocking}
                activeOpacity={0.85}
              >
                {isUnlocking ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="lock-open-outline" size={18} color="#FFF" />
                    <Text style={unlockStyles.unlockBtnText}>Unlock Lead · 1 Credit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Section>

      </ScrollView>

      {/* ── Sticky Action Bar ──────────────────────────────────────────────── */}
      <View style={[actionBar.container, { paddingBottom: insets.bottom + 8 }]}>
        {/* Secondary actions row */}
        <View style={actionBar.secondaryRow}>
          <TouchableOpacity
            style={[actionBar.secondaryBtn, { borderColor: isSaved ? colors.primary : colors.border }]}
            onPress={handleSaveToggle}
            disabled={isSaving}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? colors.primary : colors.textSecondary}
            />
            <Text style={[actionBar.secondaryLabel, { color: isSaved ? colors.primary : colors.textSecondary }]}>
              {isSaving ? '…' : isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[actionBar.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleHide}
            disabled={isHiding}
          >
            <Ionicons name="eye-off-outline" size={18} color={colors.textSecondary} />
            <Text style={[actionBar.secondaryLabel, { color: colors.textSecondary }]}>
              {isHiding ? '…' : 'Hide'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[actionBar.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
            <Text style={[actionBar.secondaryLabel, { color: colors.textSecondary }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Primary apply button */}
        <TouchableOpacity
          style={[
            actionBar.applyBtn,
            { backgroundColor: canApply ? colors.primary : colors.textTertiary },
          ]}
          onPress={handleApply}
          disabled={!canApply}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane-outline" size={18} color="#FFF" />
          <Text style={actionBar.applyLabel}>
            {canApply ? 'Apply Now' : appStatusCfg.label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Header ─────────────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  onBack: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
}
const ScreenHeader: React.FC<ScreenHeaderProps> = ({ onBack, onSave, onShare, isSaved, isSaving }) => (
  <View style={headerStyles.container}>
    <TouchableOpacity onPress={onBack} style={headerStyles.backBtn}>
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
    <Text style={headerStyles.title}>Requirement Details</Text>
    <View style={headerStyles.actions}>
      {onSave && (
        <TouchableOpacity onPress={onSave} style={headerStyles.iconBtn} disabled={isSaving}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? colors.primary : colors.text} />
        </TouchableOpacity>
      )}
      {onShare && (
        <TouchableOpacity onPress={onShare} style={headerStyles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ── CompStat ───────────────────────────────────────────────────────────────────
const CompStat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <View style={compStyles.stat}>
    <Text style={[compStyles.statVal, { color }]}>{value}</Text>
    <Text style={compStyles.statLabel}>{label}</Text>
  </View>
);

// ── StyleSheets ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16 },
  errorContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle:       { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 16 },
  errorSub:         { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  retryBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 20, gap: 6 },
  retryText:        { color: '#FFF', fontWeight: '600', fontSize: 14 },
  emptyAnalysis:    { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyAnalysisText:{ fontSize: 13, color: colors.textSecondary },
});

const headerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:   { padding: 4 },
  title:     { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, marginLeft: 10 },
  actions:   { flexDirection: 'row', gap: 4 },
  iconBtn:   { padding: 6 },
});

const s1 = StyleSheet.create({
  card:         { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqId:        { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  postedDate:   { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  matchBadge:   { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  matchPct:     { fontSize: 20, fontWeight: '800' },
  matchLabel:   { fontSize: 10, fontWeight: '600', marginTop: 1 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: '600' },
  appsRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appsText:     { fontSize: 12, color: colors.textSecondary },
  appStatusPill:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  appStatusText:{ fontSize: 12, fontWeight: '600' },
});

const chipRow = StyleSheet.create({
  wrap:     { marginTop: 8 },
  label:    { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
});

const notesStyle = StyleSheet.create({
  text: { fontSize: 13, color: colors.text, lineHeight: 20, backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: 10 },
});

const matchStyles = StyleSheet.create({
  hero:        { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  heroScore:   { fontSize: 36, fontWeight: '800' },
  heroLabel:   { fontSize: 14, fontWeight: '600' },
  detail:      { flexDirection: 'row', marginTop: 8, gap: 6 },
  detailLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', minWidth: 90 },
  detailVal:   { fontSize: 12, color: colors.text, flex: 1 },
});

const compStyles = StyleSheet.create({
  grid:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stat:           { alignItems: 'center', flex: 1 },
  statVal:        { fontSize: 22, fontWeight: '800' },
  statLabel:      { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  positionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary + '10', borderRadius: 10, padding: 10 },
  positionText:   { fontSize: 13, color: colors.primary, fontWeight: '600', flex: 1 },
});

const mapPlaceholder = StyleSheet.create({
  box:  { backgroundColor: colors.backgroundSecondary, borderRadius: 10, height: 80, alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  text: { fontSize: 12, color: colors.textTertiary },
});

const appStyles = StyleSheet.create({
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 14 },
  statusLabel:{ fontSize: 16, fontWeight: '700' },
  statusSub:  { fontSize: 13, color: colors.textSecondary, marginTop: 4, maxWidth: 220 },
});

const actionBar = StyleSheet.create({
  container:     { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 10 },
  secondaryRow:  { flexDirection: 'row', gap: 8, marginBottom: 10 },
  secondaryBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingVertical: 9 },
  secondaryLabel:{ fontSize: 13, fontWeight: '600' },
  applyBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8 },
  applyLabel:    { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

const unlockStyles = StyleSheet.create({
  // Credit balance widget
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  creditStat: {
    alignItems: 'center',
    flex: 1,
  },
  creditNum: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  creditLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  creditDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  viewCreditsBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  viewCreditsText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  // Unlocked badge
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  unlockedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  unlockIdText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  // Contact card
  contactCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 55,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  // Locked state
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  lockedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  lockedDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TeacherRequirementDetailScreen;
