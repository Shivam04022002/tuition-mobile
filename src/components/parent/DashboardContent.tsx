import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import {
  SectionHeader,
  PrimaryButton,
  ProfileAvatar,
} from '../ui';
import DashboardEmpty from './DashboardEmpty';
import DashboardStatsGrid from './DashboardStatsGrid';
import type {
  QuickStats,
  DashboardRequirement,
  DashboardApplication,
  DashboardRecommendedTutor,
  DashboardDemoClass,
} from '../../services/parentDashboardService';

const { width } = Dimensions.get('window');
const STAT_GAP = 10;
const STAT_W = (width - 32 - STAT_GAP) / 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':   return colors.success;
    case 'paused':   return colors.warning ?? '#F59E0B';
    case 'closed':   return colors.textTertiary;
    case 'expired':  return colors.error;
    case 'draft':    return colors.info ?? '#3B82F6';
    default:         return colors.textTertiary;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'active':   return 'checkmark-circle-outline';
    case 'paused':   return 'pause-circle-outline';
    case 'closed':   return 'lock-closed-outline';
    case 'expired':  return 'time-outline';
    case 'draft':    return 'document-outline';
    default:         return 'help-circle-outline';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':   return 'Active';
    case 'paused':   return 'Paused';
    case 'closed':   return 'Closed';
    case 'expired':  return 'Expired';
    case 'draft':    return 'Draft';
    default:         return status;
  }
}

// ── Skeleton Requirement Card ─────────────────────────────────────────────────

const RequirementCardSkeleton: React.FC = memo(() => (
  <View style={styles.reqCard}>
    <View style={styles.reqCardHeader}>
      <View style={styles.reqCardLeft}>
        <View style={[styles.skeletonBar, { width: 140, height: 18, marginBottom: 6 }]} />
        <View style={[styles.skeletonBar, { width: 80, height: 13 }]} />
      </View>
      <View style={[styles.skeletonBar, { width: 64, height: 24, borderRadius: 12 }]} />
    </View>
    <View style={styles.reqMeta}>
      <View style={[styles.skeletonBar, { width: 110, height: 13 }]} />
      <View style={[styles.skeletonBar, { width: 90, height: 13 }]} />
    </View>
    <View style={[styles.cardActions, { marginTop: 4 }]}>
      <View style={[styles.skeletonBar, { flex: 1, height: 34, borderRadius: 10 }]} />
      <View style={[styles.skeletonBar, { flex: 1, height: 34, borderRadius: 10 }]} />
    </View>
  </View>
));

RequirementCardSkeleton.displayName = 'RequirementCardSkeleton';

// ── Requirement Card ──────────────────────────────────────────────────────────

interface RequirementCardProps {
  requirement: DashboardRequirement;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
}

const RequirementCard: React.FC<RequirementCardProps> = memo((
  { requirement, onViewDetails, onEdit, onPause, onResume, onClose, onDelete },
) => {
  const statusColor = getStatusColor(requirement.status);
  const subjects = requirement.subjects?.slice(0, 2).join(', ') || 'Subject';
  const grade = requirement.studentDetails?.grade || 'Grade';
  const board = requirement.studentDetails?.board;
  const budgetText = requirement.budget
    ? `₹${requirement.budget.minAmount}–₹${requirement.budget.maxAmount}/mo`
    : 'Budget TBD';
  const dateText = requirement.createdAt
    ? new Date(requirement.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'N/A';
  const appCount = requirement.totalMatches ?? 0;

  return (
    <View style={styles.reqCard}>
      {/* Header row: student info + status badge */}
      <View style={styles.reqCardHeader}>
        <View style={styles.reqCardLeft}>
          <Text style={styles.reqSubject}>{subjects}</Text>
          <Text style={styles.reqGrade}>
            {grade}{board ? ` • ${board}` : ''}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
          <Ionicons name={getStatusIcon(requirement.status) as any} size={11} color={statusColor} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {getStatusLabel(requirement.status)}
          </Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.reqMeta}>
        <View style={styles.reqMetaItem}>
          <Ionicons name="cash-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.reqMetaText}>{budgetText}</Text>
        </View>
        <View style={styles.reqMetaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.reqMetaText}>{dateText}</Text>
        </View>
        <View style={styles.reqMetaItem}>
          <Ionicons name="people-outline" size={13} color={appCount > 0 ? colors.primary : colors.textSecondary} />
          <Text style={[styles.reqMetaText, appCount > 0 ? styles.reqMatchText : undefined]}>
            {appCount} app{appCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <PrimaryButton
          label="View"
          onPress={() => onViewDetails(requirement._id)}
          variant="outline"
          size="sm"
          style={styles.actionFlex}
        />
        {(requirement.status === 'active' || requirement.status === 'paused') && (
          <PrimaryButton
            label="Edit"
            onPress={() => onEdit(requirement._id)}
            variant="primary"
            size="sm"
            style={styles.actionFlex}
          />
        )}
      </View>

      {/* Secondary actions */}
      <View style={[styles.cardActions, styles.secondaryActions]}>
        {requirement.status === 'active' && (
          <PrimaryButton
            label="Pause"
            onPress={() => onPause(requirement._id)}
            variant="outline"
            size="sm"
            style={styles.actionFlex}
          />
        )}
        {requirement.status === 'paused' && (
          <PrimaryButton
            label="Resume"
            onPress={() => onResume(requirement._id)}
            variant="outline"
            size="sm"
            style={styles.actionFlex}
          />
        )}
        {(requirement.status === 'active' || requirement.status === 'paused') && (
          <PrimaryButton
            label="Close"
            onPress={() => onClose(requirement._id)}
            variant="outline"
            size="sm"
            style={styles.actionFlex}
          />
        )}
        {(requirement.status === 'closed' || requirement.status === 'expired') && (
          <PrimaryButton
            label="Delete"
            onPress={() => onDelete(requirement._id)}
            variant="danger"
            size="sm"
            style={styles.actionFlex}
          />
        )}
      </View>
    </View>
  );
});

RequirementCard.displayName = 'RequirementCard';

interface ApplicationCardProps {
  application: DashboardApplication;
  onView: (id: string) => void;
  onShortlist: (id: string) => void;
  onReject: (id: string) => void;
}

function getApplicationStatusColor(status: string): string {
  switch (status) {
    case 'pending': return colors.warning ?? '#F59E0B';
    case 'shortlisted': return colors.info ?? '#3B82F6';
    case 'rejected': return colors.error;
    case 'accepted': return colors.success;
    case 'withdrawn': return colors.textTertiary;
    default: return colors.textTertiary;
  }
}

function getApplicationStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Applied';
    case 'shortlisted': return 'Shortlisted';
    case 'rejected': return 'Rejected';
    case 'accepted': return 'Selected';
    case 'withdrawn': return 'Withdrawn';
    default: return status;
  }
}

const ApplicationCard: React.FC<ApplicationCardProps> = memo(({ application, onView, onShortlist, onReject }) => {
  const tutorName = application.teacherProfileId?.basicDetails?.fullName || 'Unknown';
  const profilePhoto = application.teacherProfileId?.basicDetails?.profilePhoto || '';
  const experience = application.teacherProfileId?.pricingRevenue?.experienceYears || 0;
  const rating = application.teacherProfileId?.stats?.averageRating || 0;
  const subjects = application.teacherProfileId?.teachingDetails?.subjects || [];
  const status = application.status || 'pending';
  const statusColor = getApplicationStatusColor(status);
  const statusLabel = getApplicationStatusLabel(status);
  const appliedDate = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  const canShortlist = status === 'pending';
  const canReject = status === 'pending' || status === 'shortlisted';

  return (
    <View style={styles.appCard}>
      <View style={styles.appCardHeader}>
        <ProfileAvatar name={tutorName} imageUri={profilePhoto} size={56} />
        <View style={styles.appCardInfo}>
          <Text style={styles.appName}>{tutorName}</Text>
          <View style={styles.appRating}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingVal}>{Number(rating).toFixed(1)}</Text>
            <Text style={styles.expVal}>• {experience} yrs exp</Text>
          </View>
          <View style={styles.appStatusRow}>
            <View style={[styles.appStatusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.appStatusText, { color: statusColor }]}>{statusLabel}</Text>
            {appliedDate && (
              <Text style={styles.appDateText}>• {appliedDate}</Text>
            )}
          </View>
        </View>
      </View>

      {subjects.length > 0 ? (
        <View style={styles.subjectRow}>
          {subjects.slice(0, 3).map((s: string, i: number) => (
            <View key={i} style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.cardActions}>
        <PrimaryButton label="View" onPress={() => onView(application._id)} variant="outline" size="sm" style={styles.actionThird} />
        {canShortlist && (
          <PrimaryButton label="Shortlist" onPress={() => onShortlist(application._id)} variant="primary" size="sm" style={styles.actionThird} />
        )}
        {canReject && (
          <PrimaryButton label="Reject" onPress={() => onReject(application._id)} variant="danger" size="sm" style={styles.actionThird} />
        )}
      </View>
    </View>
  );
});

ApplicationCard.displayName = 'ApplicationCard';

interface TutorCardProps {
  tutor: DashboardRecommendedTutor;
  onViewProfile: (id: string) => void;
  onViewMap: (tutor: DashboardRecommendedTutor) => void;
}

/**
 * Get match score badge color based on percentage
 * 90+ = Green (Excellent Match)
 * 75-89 = Blue (Good Match)
 * 60-74 = Orange (Fair Match)
 * Below 60 = Grey (Low Match)
 */
const getMatchBadgeColors = (percentage: number) => {
  if (percentage >= 90) {
    return { bg: colors.success + '20', text: colors.success };
  }
  if (percentage >= 75) {
    return { bg: colors.info + '20', text: colors.info };
  }
  if (percentage >= 60) {
    return { bg: colors.warning + '20', text: colors.warning };
  }
  return { bg: colors.textTertiary + '20', text: colors.textTertiary };
};

const TutorCard: React.FC<TutorCardProps> = memo(({ tutor, onViewProfile, onViewMap }) => {
  const name = tutor.teacherProfileId?.basicDetails?.fullName || 'Unknown';
  const photo = tutor.teacherProfileId?.basicDetails?.profilePhoto || '';
  const experience = tutor.teacherProfileId?.pricingRevenue?.experienceYears || 0;
  const rating = tutor.teacherProfileId?.stats?.averageRating || 0;
  const subjects = tutor.teacherProfileId?.teachingDetails?.subjects || [];
  const matchScore = tutor.overallScore || 0;
  const tutorId = tutor.teacherId?._id || tutor._id;
  const badgeColors = getMatchBadgeColors(matchScore);

  return (
    <View style={[styles.tutorCard, { width: width * 0.72 }]}>
      <View style={styles.tutorCardTop}>
        <ProfileAvatar name={name} imageUri={photo} size={56} />
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>{name}</Text>
          <Text style={styles.tutorExp}>{experience} yrs experience</Text>
          <View style={styles.tutorRating}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingVal}>{Number(rating).toFixed(1)}</Text>
          </View>
        </View>
        {matchScore ? (
          <View style={[styles.matchBadge, { backgroundColor: badgeColors.bg }]}>
            <Text style={[styles.matchText, { color: badgeColors.text }]}>{Math.round(matchScore)}%</Text>
            <Text style={[styles.matchSub, { color: badgeColors.text }]}>Match</Text>
          </View>
        ) : null}
      </View>

      {subjects.length > 0 ? (
        <View style={styles.subjectRow}>
          {subjects.slice(0, 3).map((s: string, i: number) => (
            <View key={i} style={[styles.subjectChip, styles.subjectChipSecondary]}>
              <Text style={[styles.subjectChipText, styles.subjectChipSecondaryText]}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.tutorCardActions}>
        <PrimaryButton label="View Profile" onPress={() => onViewProfile(tutorId || tutor._id)} variant="outline" size="sm" style={styles.actionFlex} />
        <PrimaryButton label="View On Map" onPress={() => onViewMap(tutor)} variant="primary" size="sm" style={styles.actionFlex} />
      </View>
    </View>
  );
});

TutorCard.displayName = 'TutorCard';

interface DemoCardProps {
  demo: DashboardDemoClass;
}

const DemoCard: React.FC<DemoCardProps> = memo(({ demo }) => {
  const tutorName = demo.teacherProfileId?.basicDetails?.fullName || 'Tutor';
  const dateText = demo.scheduledDate ? new Date(demo.scheduledDate).toLocaleDateString() : 'TBD';

  return (
    <View style={styles.demoCard}>
      <View style={styles.demoIconWrap}>
        <Ionicons name="videocam-outline" size={26} color={colors.primary} />
      </View>
      <View style={styles.demoBody}>
        <Text style={styles.demoTutor}>{tutorName}</Text>
        <Text style={styles.demoSubject}>{demo.subject || 'Subject TBD'}</Text>
        <View style={styles.demoTime}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.demoTimeText}>
            {dateText}{demo.scheduledTime ? ` · ${demo.scheduledTime}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.demoBadge}>
        <Text style={styles.demoBadgeText}>Scheduled</Text>
      </View>
    </View>
  );
});

DemoCard.displayName = 'DemoCard';

// ── Main DashboardContent ─────────────────────────────────────────────────────

interface DashboardContentProps {
  stats: QuickStats | null;
  isStatsLoading?: boolean;
  hasStatsError?: boolean;
  isRequirementsLoading?: boolean;
  requirements: DashboardRequirement[];
  applications: DashboardApplication[];
  recommendedTutors: DashboardRecommendedTutor[];
  upcomingDemos: DashboardDemoClass[];
  onViewRequirement: (id: string) => void;
  onEditRequirement: (id: string) => void;
  onPauseRequirement: (id: string) => void;
  onResumeRequirement: (id: string) => void;
  onCloseRequirement: (id: string) => void;
  onDeleteRequirement: (id: string) => void;
  onPostRequirement: () => void;
  onViewApplication: (id: string) => void;
  onShortlistApplication: (id: string) => void;
  onRejectApplication: (id: string) => void;
  onViewTutorProfile: (id: string) => void;
  onViewTutorMap: (tutor: DashboardRecommendedTutor) => void;
  onViewAllRequirements?: () => void;
  onViewAllApplications?: () => void;
  onViewAllShortlisted?: () => void;
  onViewAllDemos?: () => void;
  onViewAllRecommendedTutors?: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = memo(({
  stats,
  isStatsLoading = false,
  hasStatsError = false,
  isRequirementsLoading = false,
  requirements,
  applications,
  recommendedTutors,
  upcomingDemos,
  onViewRequirement,
  onEditRequirement,
  onPauseRequirement,
  onResumeRequirement,
  onCloseRequirement,
  onDeleteRequirement,
  onPostRequirement,
  onViewApplication,
  onShortlistApplication,
  onRejectApplication,
  onViewTutorProfile,
  onViewTutorMap,
  onViewAllRequirements,
  onViewAllApplications,
  onViewAllShortlisted,
  onViewAllDemos,
  onViewAllRecommendedTutors,
}) => {
  return (
    <>
      {/* ── Quick Stats ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Quick Stats" icon="bar-chart-outline" />
        <DashboardStatsGrid
          stats={stats}
          isLoading={isStatsLoading}
          hasError={hasStatsError}
          onActiveRequirementsPress={onViewAllRequirements}
          onApplicationsPress={onViewAllApplications}
          onShortlistedPress={onViewAllShortlisted}
          onDemoClassesPress={onViewAllDemos}
        />
      </View>

      {/* ── Active Requirements ──────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="My Requirements"
          icon="document-text-outline"
          onSeeAll={onViewAllRequirements}
        />
        {isRequirementsLoading ? (
          <>
            <RequirementCardSkeleton />
            <RequirementCardSkeleton />
          </>
        ) : requirements.length === 0 ? (
          <DashboardEmpty section="requirements" onCta={onPostRequirement} />
        ) : (
          requirements.map((req) => (
            <RequirementCard
              key={req._id}
              requirement={req}
              onViewDetails={onViewRequirement}
              onEdit={onEditRequirement}
              onPause={onPauseRequirement}
              onResume={onResumeRequirement}
              onClose={onCloseRequirement}
              onDelete={onDeleteRequirement}
            />
          ))
        )}
      </View>

      {/* ── Recent Applications ──────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="Recent Applications"
          icon="people-outline"
          onSeeAll={onViewAllApplications}
        />
        {applications.length === 0 ? (
          <DashboardEmpty section="applications" onCta={onPostRequirement} />
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app._id}
              application={app}
              onView={onViewApplication}
              onShortlist={onShortlistApplication}
              onReject={onRejectApplication}
            />
          ))
        )}
      </View>

      {/* ── Recommended Tutors ───────────────────────────────────── */}
      <View style={[styles.section, styles.noBottomMargin]}>
        <SectionHeader title="Recommended Tutors" icon="star-outline" onSeeAll={onViewAllRecommendedTutors} />
      </View>
      {recommendedTutors.length === 0 ? (
        <View style={[styles.section, styles.noPaddingTop]}>
          <DashboardEmpty section="recommended" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {recommendedTutors.map((tutor) => (
            <TutorCard
              key={tutor._id}
              tutor={tutor}
              onViewProfile={onViewTutorProfile}
              onViewMap={onViewTutorMap}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Upcoming Demos ───────────────────────────────────────── */}
      {upcomingDemos.length > 0 ? (
        <View style={[styles.section, styles.demoSection]}>
          <SectionHeader title="Upcoming Demos" icon="calendar-outline" onSeeAll={onViewAllDemos} />
          {upcomingDemos.map((demo) => (
            <DemoCard key={demo._id} demo={demo} />
          ))}
        </View>
      ) : null}

      <View style={styles.bottomSpace} />
    </>
  );
});

DashboardContent.displayName = 'DashboardContent';

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 24 },
  noBottomMargin: { marginBottom: 0 },
  noPaddingTop: { paddingTop: 0 },
  demoSection: { marginTop: 24 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: STAT_GAP },
  statItem: { width: STAT_W },

  // Requirement Card
  reqCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    ...shadows.card,
  },
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reqCardLeft: { flex: 1 },
  reqSubject: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 3 },
  reqGrade: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  reqMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  reqMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqMetaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  reqMatchText: { color: colors.primary, fontWeight: '600' },

  // Application Card
  appCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    ...shadows.card,
  },
  appCardHeader: { flexDirection: 'row', marginBottom: 12, gap: 12, alignItems: 'center' },
  appCardInfo: { flex: 1 },
  appName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  appRating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingVal: { fontSize: 13, fontWeight: '700', color: colors.text },
  expVal: { fontSize: 12, color: colors.textSecondary },
  appStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  appStatusDot: { width: 8, height: 8, borderRadius: 4 },
  appStatusText: { fontSize: 12, fontWeight: '600' },
  appDateText: { fontSize: 11, color: colors.textSecondary },

  // Shared chips
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  subjectChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: colors.primary + '12',
  },
  subjectChipText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  subjectChipSecondary: { backgroundColor: colors.secondary + '15' },
  subjectChipSecondaryText: { color: colors.secondary },

  // Skeleton
  skeletonBar: {
    backgroundColor: colors.border ?? '#E2E8F0',
    borderRadius: 6,
  },

  // Shared action rows
  cardActions: { flexDirection: 'row', gap: 8 },
  secondaryActions: { marginTop: 6 },
  actionFlex: { flex: 1 },
  actionThird: { flex: 1 },

  // Tutor Card
  tutorCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    ...shadows.card,
  },
  tutorCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  tutorExp: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  tutorRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchBadge: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center',
  },
  matchText: { fontSize: 16, fontWeight: '800', lineHeight: 18 },
  matchSub: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  tutorCardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },

  horizontalList: { paddingHorizontal: 16, paddingBottom: 4, gap: 14 },

  // Demo Card
  demoCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadows.card,
  },
  demoIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  demoBody: { flex: 1 },
  demoTutor: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  demoSubject: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  demoTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  demoTimeText: { fontSize: 11, color: colors.textSecondary },
  demoBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: colors.info + '15',
  },
  demoBadgeText: { fontSize: 11, fontWeight: '700', color: colors.info },

  bottomSpace: { height: 40 },
});

export default DashboardContent;
