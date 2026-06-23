import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { applyToLead } from '../../services/dashboardApi';
import { TutorMatch, TeacherApplication, DemoClass } from '../../services/teacherApi';
import { useTeacherDashboard } from '../../hooks/useTeacherDashboard';
import { useSubscription } from '../../hooks/useSubscription';
import { useCredits } from '../../hooks/useCredits';
import { StatsCard, EmptyState, SectionHeader, PrimaryButton, ProfileAvatar } from '../../components/ui';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const { width } = Dimensions.get('window');

type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';

const getAppStatusColor = (status: ApplicationStatus): string => {
  const map: Record<ApplicationStatus, string> = {
    pending: colors.accent,
    shortlisted: colors.info,
    accepted: colors.success,
    rejected: colors.error,
    withdrawn: colors.textTertiary,
  };
  return map[status] || colors.textTertiary;
};

const TeacherDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const navigation = useNavigation<any>();

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  }, [dispatch]);
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  // ── Dashboard data via hook ─────────────────────────────────────────────────
  const {
    data: dashboardData,
    isLoading: loading,
    isRefreshing: refreshing,
    error,
    refresh: onRefresh,
    retry: loadDashboardData,
  } = useTeacherDashboard(token);

  // ── Subscription data via hook ──────────────────────────────────────────────
  const {
    currentData: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription();

  // ── Credits data via hook ───────────────────────────────────────────────────
  const {
    balance: creditBalance,
    isLoading: creditsLoading,
    error: creditsError,
  } = useCredits();

  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Handle session expiry from the hook
  useEffect(() => {
    if (error === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [error, dispatch]);

  const handleApply = async (match: TutorMatch) => {
    try {
      if (!token) return;
      setApplyingId(match._id);
      await applyToLead(token, match.requirementId);
      Alert.alert('Success', 'Application submitted successfully');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const stats = dashboardData?.stats;
  const completion = stats?.profileCompletion || 0;
  const verificationStatus = stats?.verificationStatus || 'pending';

  const verifColor = verificationStatus === 'verified' ? colors.success
    : verificationStatus === 'pending' ? colors.accent
    : colors.error;
  const verifLabel = verificationStatus === 'verified' ? '✓ Verified'
    : verificationStatus === 'pending' ? '⏳ Pending'
    : '✗ Rejected';

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && error !== 'Session expired. Please login again.') {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="error-outline"
          title="Something went wrong"
          description={error}
          ctaLabel="Retry"
          onCta={loadDashboardData}
          iconColor={colors.error}
        />
      </View>
    );
  }

  const matches = dashboardData?.matches?.slice(0, 3) || [];
  const applications = dashboardData?.applications?.slice(0, 3) || [];
  const demos = dashboardData?.upcomingDemos?.slice(0, 3) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroGreeting}>Welcome back 👋</Text>
            <Text style={styles.heroName}>Teacher</Text>
            <Text style={styles.heroSub}>Manage your leads and applications</Text>
          </View>
          <ProfileAvatar name="Teacher" size={52} showBorder />
        </View>

        {/* Verification + Completion row */}
        <View style={styles.heroMeta}>
          <View style={[styles.verifPill, { backgroundColor: verifColor + '22' }]}>
            <View style={[styles.verifDot, { backgroundColor: verifColor }]} />
            <Text style={[styles.verifText, { color: verifColor }]}>{verifLabel}</Text>
          </View>
          <View style={styles.completionWrap}>
            <View style={styles.completionBar}>
              <View style={[styles.completionFill, { width: `${completion}%` as any, backgroundColor: verifColor }]} />
            </View>
            <Text style={styles.completionPct}>{completion}% profile</Text>
          </View>
        </View>

        {/* CTA if incomplete */}
        {completion < 100 ? (
          <TouchableOpacity style={styles.heroCta} activeOpacity={0.88} onPress={() => navigation.navigate('TeacherOnboarding')}>
            <View style={styles.heroCtaLeft}>
              <View style={styles.heroCtaIcon}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.heroCtaTitle}>Complete Your Profile</Text>
                <Text style={styles.heroCtaSub}>{completion}% done · Tap to continue</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Quick Stats" icon="bar-chart-outline" />
        <View style={styles.statsGrid}>
          <StatsCard
            label="Matching Leads"
            value={stats?.tuitionRequestsAvailable || 0}
            icon="people-outline"
            bgColor={colors.primary}
            style={styles.statItem}
          />
          <StatsCard
            label="Applications Sent"
            value={stats?.applicationsSent || 0}
            icon="send-outline"
            bgColor={colors.secondary}
            style={styles.statItem}
          />
          <StatsCard
            label="Upcoming Demos"
            value={dashboardData?.upcomingDemos?.length || 0}
            icon="videocam-outline"
            bgColor={colors.pink}
            style={styles.statItem}
          />
          <StatsCard
            label="Active Students"
            value={stats?.activeStudents || 0}
            icon="school-outline"
            bgColor={colors.accent}
            style={styles.statItem}
          />
        </View>
      </View>

      {/* ── Subscription Plan Badge + Upgrade CTA ──────────────────────── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.analyticsCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.warning + '30' }]}
          onPress={() => navigation.navigate('TeacherSubscription')}
          activeOpacity={0.8}
        >
          <View style={styles.analyticsContent}>
            <View style={styles.analyticsLeft}>
              <View style={[styles.analyticsIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="diamond-outline" size={24} color={colors.warning} />
              </View>
              <View style={styles.analyticsInfo}>
                {subscriptionLoading ? (
                  // Loading state - shimmer effect
                  <View style={{ width: 120, height: 18, backgroundColor: colors.border, borderRadius: 4 }} />
                ) : subscriptionError || !subscriptionData ? (
                  // Error state - fallback to safe defaults
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                        Free Plan
                      </Text>
                      <View style={{ backgroundColor: '#94A3B8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>FREE</Text>
                      </View>
                    </View>
                    <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                      Tap to view subscription options
                    </Text>
                  </View>
                ) : (
                  // Live data from backend
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                        {subscriptionData.plan.displayName}
                      </Text>
                      <View style={{
                        backgroundColor: subscriptionData.plan.badgeColor || '#94A3B8',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        marginLeft: 8
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                          {subscriptionData.plan.badge || subscriptionData.currentPlan.toUpperCase()}
                        </Text>
                      </View>
                      {/* Status indicator */}
                      {subscriptionData.subscription?.status === 'active' && (
                        <View style={{
                          backgroundColor: colors.success,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          marginLeft: 6
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>ACTIVE</Text>
                        </View>
                      )}
                      {subscriptionData.subscription?.status === 'expired' && (
                        <View style={{
                          backgroundColor: colors.error,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          marginLeft: 6
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>EXPIRED</Text>
                        </View>
                      )}
                    </View>
                    {/* Credits display if available */}
                    {(subscriptionData.limits.creditsPerMonth ?? 0) > 0 && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                        {subscriptionData.limits.creditsPerMonth === -1
                          ? 'Unlimited credits'
                          : `${subscriptionData.limits.creditsPerMonth} credits/month`}
                      </Text>
                    )}
                    {/* Show remaining if not unlimited and not free */}
                    {subscriptionData.currentPlan !== 'free' &&
                     subscriptionData.limits.creditsPerMonth !== -1 &&
                     subscriptionData.limits.creditsPerMonth > 0 && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.primary, fontWeight: '500' }]}>
                        {subscriptionData.limits.creditsPerMonth - (subscriptionData.usage?.leadUnlocksUsed || 0)} remaining
                      </Text>
                    )}
                    {/* Default subtitle for free plan */}
                    {subscriptionData.currentPlan === 'free' && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                        Upgrade for more applications, leads & visibility
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subscriptionLoading ? colors.textTertiary : colors.warning} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Credits Balance Card ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.analyticsCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.success + '30' }]}
          onPress={() => navigation.navigate('TeacherCredits')}
          activeOpacity={0.8}
        >
          <View style={styles.analyticsContent}>
            <View style={styles.analyticsLeft}>
              <View style={[styles.analyticsIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="wallet-outline" size={24} color={colors.success} />
              </View>
              <View style={styles.analyticsInfo}>
                {creditsLoading ? (
                  // Loading state - shimmer
                  <View style={{ width: 140, height: 18, backgroundColor: colors.border, borderRadius: 4 }} />
                ) : creditsError || !creditBalance ? (
                  // Error state - fallback
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                        Credits
                      </Text>
                      <View style={{ backgroundColor: colors.textTertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>--</Text>
                      </View>
                    </View>
                    <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                      Tap to view credit balance
                    </Text>
                  </View>
                ) : (
                  // Live data from backend
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                        {creditBalance.isUnlimited ? 'Unlimited' : `${creditBalance.creditsRemaining}`} Credits
                      </Text>
                      <View style={{
                        backgroundColor: creditBalance.creditsRemaining === 0 ? colors.error : colors.success,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        marginLeft: 8
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                          {creditBalance.planName.charAt(0).toUpperCase() + creditBalance.planName.slice(1)}
                        </Text>
                      </View>
                    </View>
                    {/* Credits usage subtitle */}
                    {!creditBalance.isUnlimited && creditBalance.totalCredits > 0 && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                        {creditBalance.creditsUsed} used of {creditBalance.totalCredits} monthly
                      </Text>
                    )}
                    {creditBalance.isUnlimited && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.success }]}>
                        Unlimited credits with {creditBalance.planName} plan
                      </Text>
                    )}
                    {/* Low credits warning */}
                    {!creditBalance.isUnlimited && creditBalance.creditsRemaining <= 2 && creditBalance.creditsRemaining > 0 && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.warning, fontWeight: '500' }]}>
                        Low credits - buy more to unlock leads
                      </Text>
                    )}
                    {/* Zero credits alert */}
                    {!creditBalance.isUnlimited && creditBalance.creditsRemaining === 0 && (
                      <Text style={[styles.analyticsSubtitle, { color: colors.error, fontWeight: '600' }]}>
                        No credits remaining - buy more to continue
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={creditsLoading ? colors.textTertiary : colors.success} />
          </View>
        </TouchableOpacity>

        {/* Buy More Credits CTA (shown for non-unlimited plans) */}
        {!creditsLoading && !creditsError && creditBalance && !creditBalance.isUnlimited && (
          <TouchableOpacity
            style={[styles.analyticsCard, { backgroundColor: colors.card, marginTop: 8 }]}
            onPress={() => navigation.navigate('CreditPacks')}
            activeOpacity={0.8}
          >
            <View style={styles.analyticsContent}>
              <View style={styles.analyticsLeft}>
                <View style={[styles.analyticsIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
                </View>
                <View style={styles.analyticsInfo}>
                  <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                    Buy More Credits
                  </Text>
                  <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                    Purchase credit packs to unlock more leads
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Analytics Quick Action ───────────────────────────────────────── */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.analyticsCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('TeacherAnalytics')}
          activeOpacity={0.8}
        >
          <View style={styles.analyticsContent}>
            <View style={styles.analyticsLeft}>
              <View style={[styles.analyticsIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="analytics-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.analyticsInfo}>
                <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                  Analytics Dashboard
                </Text>
                <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                  Track your performance, conversion rates, and growth trends
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.analyticsCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('TeacherEarnings')}
          activeOpacity={0.8}
        >
          <View style={styles.analyticsContent}>
            <View style={styles.analyticsLeft}>
              <View style={[styles.analyticsIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="wallet-outline" size={24} color={colors.success} />
              </View>
              <View style={styles.analyticsInfo}>
                <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                  Earnings Dashboard
                </Text>
                <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                  Track your revenue, conversion metrics, and earning potential
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Matching Leads ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Matching Leads" icon="star-outline" onSeeAll={() => {}} />
        {matches.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No matching leads"
            description="Complete your profile to unlock more lead matches."
            ctaLabel="Complete Profile"
            onCta={() => {}}
            iconColor={colors.secondary}
          />
        ) : (
          matches.map((match) => (
            <View key={match._id} style={styles.leadCard}>
              <View style={styles.leadCardTop}>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadStudent}>
                    {match.requirement?.studentDetails?.studentName || 'Student'}
                  </Text>
                  <Text style={styles.leadGrade}>
                    {match.requirement?.studentDetails?.grade} · {match.requirement?.subjects?.join(', ')}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: colors.success + '18' }]}>
                  <Text style={[styles.scoreText, { color: colors.success }]}>
                    {Math.round(match.overallScore)}%
                  </Text>
                  <Text style={styles.scoreLabel}>Match</Text>
                </View>
              </View>
              <View style={styles.leadMeta}>
                <View style={styles.leadMetaItem}>
                  <Ionicons name="book-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.leadMetaText}>{match.requirement?.board || 'CBSE'} Board</Text>
                </View>
                <View style={styles.leadMetaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.leadMetaText}>{match.requirement?.location?.city || 'Location TBD'}</Text>
                </View>
                <View style={styles.leadMetaItem}>
                  <Ionicons name="cash-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.leadMetaText}>
                    ₹{match.requirement?.budget?.minAmount || 0}–₹{match.requirement?.budget?.maxAmount || 0}/mo
                  </Text>
                </View>
              </View>
              {match.status === 'recommended' ? (
                <PrimaryButton
                  label={applyingId === match._id ? 'Applying...' : 'Apply Now'}
                  onPress={() => handleApply(match)}
                  loading={applyingId === match._id}
                  disabled={applyingId === match._id}
                  variant="primary"
                  size="sm"
                  fullWidth
                  style={{ marginTop: 12 }}
                />
              ) : match.status === 'applied' ? (
                <View style={[styles.appliedBadge, { backgroundColor: colors.success + '14' }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.appliedText, { color: colors.success }]}>Applied</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* ── Recent Applications ─────────────────────────────────────────── */}
      {applications.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Recent Applications" icon="document-text-outline" onSeeAll={() => {}} />
          {applications.map((app) => (
            <View key={app._id} style={styles.appCard}>
              <View style={styles.appCardRow}>
                <View style={styles.appCardInfo}>
                  <Text style={styles.appParent}>
                    {app.parent?.profile?.parentName || 'Parent'}
                  </Text>
                  <Text style={styles.appReq}>
                    {app.parentRequirement?.studentDetails?.studentName} · {app.parentRequirement?.subjects?.join(', ')}
                  </Text>
                  <Text style={styles.appDate}>Applied {formatDate(app.createdAt)}</Text>
                </View>
                <View style={[styles.appStatusPill, { backgroundColor: getAppStatusColor(app.status) + '18' }]}>
                  <Text style={[styles.appStatusText, { color: getAppStatusColor(app.status) }]}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Upcoming Demos ──────────────────────────────────────────────── */}
      {demos.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Upcoming Demos" icon="calendar-outline" onSeeAll={() => {}} />
          {demos.map((demo) => (
            <View key={demo._id} style={styles.demoCard}>
              <View style={[styles.demoIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="videocam-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.demoInfo}>
                <Text style={styles.demoStudent}>{demo.studentDetails?.studentName}</Text>
                <Text style={styles.demoSub}>
                  {demo.studentDetails?.subject} · {demo.studentDetails?.grade}
                </Text>
                <View style={styles.demoTimeRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.demoTimeText}>
                    {formatDate(demo.scheduledDate)} · {demo.scheduledTime}
                  </Text>
                </View>
              </View>
              <View style={[styles.demoPill, { backgroundColor: colors.info + '15' }]}>
                <Text style={[styles.demoPillText, { color: colors.info }]}>{demo.status}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const STAT_GAP = 10;
const STAT_W = (width - 32 - STAT_GAP) / 2;

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
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLeft: { flex: 1 },
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 18 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  verifPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  verifDot: { width: 7, height: 7, borderRadius: 4 },
  verifText: { fontSize: 12, fontWeight: '700' },
  completionWrap: { flex: 1, alignItems: 'flex-end', gap: 4 },
  completionBar: {
    width: '100%', height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  completionFill: { height: '100%', borderRadius: 3 },
  completionPct: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  heroCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...shadows.md,
  },
  heroCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCtaIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary + '16',
    justifyContent: 'center', alignItems: 'center',
  },
  heroCtaTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 1 },
  heroCtaSub: { fontSize: 11, color: colors.textSecondary },

  // ── Sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: STAT_GAP },
  statItem: { width: STAT_W },

  // ── Analytics Card
  analyticsCard: {
    borderRadius: 16,
    padding: 16,
    ...shadows.card,
  },
  analyticsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analyticsInfo: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  analyticsSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },

  // ── Lead Card
  leadCard: {
    backgroundColor: colors.card,
    borderRadius: 20, padding: 18, marginBottom: 12,
    ...shadows.card,
  },
  leadCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  leadInfo: { flex: 1 },
  leadStudent: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  leadGrade: { fontSize: 13, color: colors.textSecondary },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  scoreText: { fontSize: 17, fontWeight: '800', lineHeight: 20 },
  scoreLabel: { fontSize: 9, color: colors.success, fontWeight: '600', letterSpacing: 0.5 },
  leadMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  leadMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leadMetaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  appliedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    alignSelf: 'flex-start', marginTop: 10,
  },
  appliedText: { fontSize: 13, fontWeight: '700' },

  // ── Application Card
  appCard: {
    backgroundColor: colors.card,
    borderRadius: 20, padding: 16, marginBottom: 10,
    ...shadows.sm,
  },
  appCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appCardInfo: { flex: 1 },
  appParent: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 },
  appReq: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  appDate: { fontSize: 11, color: colors.textTertiary },
  appStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  appStatusText: { fontSize: 12, fontWeight: '700' },

  // ── Demo Card
  demoCard: {
    backgroundColor: colors.card,
    borderRadius: 20, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    ...shadows.sm,
  },
  demoIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  demoInfo: { flex: 1 },
  demoStudent: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  demoSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  demoTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  demoTimeText: { fontSize: 11, color: colors.textSecondary },
  demoPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  demoPillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

export default TeacherDashboardScreen;
