import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { ProfileAvatar, PrimaryButton } from '../../components/ui';
import TutorGallery from '../../components/parent/TutorGallery';
import TutorStats from '../../components/parent/TutorStats';
import TutorQualifications from '../../components/parent/TutorQualifications';
import TutorAvailability from '../../components/parent/TutorAvailability';
import {
  getTutorProfile,
  getTutorGallery,
  getTutorStats,
  TutorProfileData,
  TutorGalleryData,
  TutorStatsData,
} from '../../services/tutorProfileApi';
import { createShortlist, checkIsShortlisted } from '../../services/shortlistApi';
import { useReviews } from '../../hooks/useReviews';
import RatingBreakdown from '../../components/parent/RatingBreakdown';
import ReviewCard from '../../components/parent/ReviewCard';
import WriteReviewModal from '../../components/parent/WriteReviewModal';
import ContactRequestModal from '../../components/parent/ContactRequestModal';
import DemoRequestModal from '../../components/parent/DemoRequestModal';
import { useParentContact } from '../../hooks/useContact';

const { width } = Dimensions.get('window');

// ── Analytics (dev logging) ──────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, payload || '');
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const getMatchBadgeColors = (percentage: number) => {
  if (percentage >= 90) return { bg: colors.success + '20', text: colors.success };
  if (percentage >= 75) return { bg: colors.info + '20', text: colors.info };
  if (percentage >= 60) return { bg: colors.warning + '20', text: colors.warning };
  return { bg: colors.textTertiary + '20', text: colors.textTertiary };
};

// ── Skeleton Component ───────────────────────────────────────────────────────
const ProfileSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonHeader}>
      <View style={[styles.skeletonCircle, { width: 80, height: 80 }]} />
      <View style={styles.skeletonHeaderText}>
        <View style={[styles.skeletonBar, { width: '70%', height: 18 }]} />
        <View style={[styles.skeletonBar, { width: '50%', height: 14, marginTop: 8 }]} />
      </View>
    </View>
    <View style={styles.skeletonStatsRow}>
      <View style={[styles.skeletonBar, { width: '25%', height: 40 }]} />
      <View style={[styles.skeletonBar, { width: '25%', height: 40 }]} />
      <View style={[styles.skeletonBar, { width: '25%', height: 40 }]} />
    </View>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.skeletonSection}>
        <View style={[styles.skeletonBar, { width: '40%', height: 16 }]} />
        <View style={[styles.skeletonBar, { width: '90%', height: 12, marginTop: 12 }]} />
        <View style={[styles.skeletonBar, { width: '75%', height: 12, marginTop: 8 }]} />
      </View>
    ))}
  </View>
);

// ── Main Component ───────────────────────────────────────────────────────────
const TutorProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any, 'TutorProfile'>>();
  const token = useAppSelector(selectAuthToken);

  const { tutorId, matchId, showContact: initialShowContact } = route.params || {};
  const profileId = tutorId || matchId;

  // ─ State ─
  const [profile, setProfile] = useState<TutorProfileData | null>(null);
  const [gallery, setGallery] = useState<TutorGalleryData | null>(null);
  const [stats, setStats] = useState<TutorStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactModalType, setContactModalType] = useState<'call' | 'whatsapp' | 'message'>('message');
  const [demoModalVisible, setDemoModalVisible] = useState(false);

  const reviewHook = useReviews(profileId || '');
  const contactHook = useParentContact(token);

  // ─ Data Fetching ─
  const fetchProfile = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token || !profileId) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      if (mode === 'initial') setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const [profileData, galleryData, statsData] = await Promise.all([
          getTutorProfile(token, profileId),
          getTutorGallery(token, profileId).catch(() => null),
          getTutorStats(token, profileId).catch(() => null),
        ]);
        setProfile(profileData);
        setGallery(galleryData);
        setStats(statsData);
      } catch (err: any) {
        const msg = err?.message === 'Unauthorized'
          ? 'Session expired. Please login again.'
          : err?.message || 'Unable to load tutor profile.';
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, profileId]
  );

  useEffect(() => {
    fetchProfile('initial');
    trackEvent('Tutor Profile Opened', { tutorId: profileId });
  }, [fetchProfile, profileId]);

  // ─ Actions ─
  const handleShare = useCallback(async () => {
    if (!profile) return;
    trackEvent('Tutor Shared', { tutorId: profileId });
    const tutorName = profile.basicDetails?.fullName || 'Tutor';
    const shareUrl = `https://hometuitionapp.com/tutors/${profileId}`;
    try {
      await Share.share({
        title: `Check out ${tutorName} on Home Tuition App`,
        message: `I found a great tutor - ${tutorName}! Check their profile: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (_) {}
  }, [profile, profileId]);

  const handleShortlist = useCallback(async () => {
    if (!token || !profile || shortlistLoading) return;

    // Determine correct IDs
    // teacherId should be the User._id (teacher's user account)
    // teacherProfileId should be the TeacherProfile._id (profile document)
    const teacherId = profile.userId || profileId;
    const teacherProfileId = profileId;

    if (!teacherId) {
      Alert.alert('Error', 'Unable to identify tutor.');
      return;
    }

    trackEvent('Tutor Shortlisted', { tutorId: teacherId });
    setShortlistLoading(true);

    try {
      const response = await createShortlist(token, {
        teacherId,
        teacherProfileId,
        notes: undefined, // Optional: could add notes support later
      });

      setShortlisted(true);
      setShortlistId(response.data.shortlist._id);
      Alert.alert('Saved!', 'Tutor has been added to your saved list.');
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.includes('already shortlisted')) {
        setShortlisted(true);
        setShortlistId(err?.shortlistId || null);
        Alert.alert('Already Saved', 'This tutor is already in your saved list.');
      } else {
        Alert.alert('Error', err?.message || 'Failed to save tutor. Please try again.');
      }
    } finally {
      setShortlistLoading(false);
    }
  }, [token, profile, profileId, shortlistLoading]);

  const handleOpenContactModal = useCallback((type: 'call' | 'whatsapp' | 'message') => {
    setContactModalType(type);
    setContactModalVisible(true);
    trackEvent('Contact Modal Opened', { tutorId: profileId, type });
  }, [profileId]);

  const handleOpenDemoModal = useCallback(() => {
    setDemoModalVisible(true);
    trackEvent('Demo Modal Opened', { tutorId: profileId });
  }, [profileId]);

  const handleContactSubmit = useCallback(async (message: string, requirementId?: string) => {
    if (!token || !profileId) return;

    const result = await contactHook.createRequest({
      teacherId: profileId,
      teacherProfileId: profileId,
      requirementId,
      contactType: contactModalType,
      message,
    });

    if (result) {
      setContactModalVisible(false);
      Alert.alert(
        'Request Sent',
        `Your ${contactModalType} request has been sent to the tutor. You will be notified when they respond.`,
        [{ text: 'OK' }]
      );
    }
  }, [token, profileId, contactModalType, contactHook]);

  const handleDemoSubmit = useCallback(async (data: {
    demoDate: string;
    demoTime: string;
    demoMode: 'online' | 'offline';
    demoNotes?: string;
    message?: string;
    requirementId?: string;
  }) => {
    if (!token || !profileId) return;

    const result = await contactHook.createDemo({
      teacherId: profileId,
      teacherProfileId: profileId,
      requirementId: data.requirementId,
      demoDate: data.demoDate,
      demoTime: data.demoTime,
      demoMode: data.demoMode,
      demoNotes: data.demoNotes,
      message: data.message,
    });

    if (result) {
      setDemoModalVisible(false);
      Alert.alert(
        'Demo Request Sent',
        'Your demo request has been sent to the tutor. You will be notified when they respond.',
        [{ text: 'OK' }]
      );
    }
  }, [token, profileId, contactHook]);

  const handleGalleryPress = useCallback((_uri: string, _index: number) => {
    trackEvent('Gallery Viewed', { tutorId: profileId });
  }, [profileId]);

  const handleViewAllReviews = useCallback(() => {
    navigation.navigate('TutorReviews', { tutorId: profileId, tutorName: profile?.basicDetails?.fullName || 'Tutor' });
  }, [navigation, profile?.basicDetails?.fullName, profileId]);

  const handleOpenWriteReview = useCallback(() => {
    setEditingReview(null);
    reviewHook.clearSubmitError();
    setReviewModalVisible(true);
  }, [reviewHook]);

  const handleReviewSubmit = useCallback(
    async (payload: { rating: number; reviewText: string; subject: string; studentClass: string }) => {
      try {
        if (editingReview) {
          await reviewHook.editReview(editingReview._id, payload);
        } else {
          await reviewHook.submitReview(payload);
        }
        setReviewModalVisible(false);
      } catch (_) {}
    },
    [editingReview, reviewHook]
  );

  const handleRefresh = useCallback(() => {
    fetchProfile('refresh');
  }, [fetchProfile]);

  // ─ Derived ─
  const matchPercentage = (route.params as any)?.matchPercentage || 0;
  const badgeColors = useMemo(() => getMatchBadgeColors(matchPercentage), [matchPercentage]);

  // ─ Loading State ─
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tutor Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <ProfileSkeleton />
      </View>
    );
  }

  // ─ Error State ─
  if (error && !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tutor Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load tutor profile</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <PrimaryButton label="Retry" onPress={() => fetchProfile('initial')} style={styles.retryButton} />
        </View>
      </View>
    );
  }

  if (!profile) return null;

  const teacher = profile;
  const tutorName = teacher.basicDetails?.fullName || 'Tutor';
  const rating = teacher.stats?.averageRating || 0;
  const totalReviews = teacher.stats?.totalReviews || 0;
  const experienceYears = teacher.pricingRevenue?.experienceYears || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tutor Profile</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Section 1: Profile Header */}
        <View style={styles.profileHeader}>
          <ProfileAvatar
            name={tutorName}
            imageUri={teacher.basicDetails?.profilePhoto}
            size={80}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.tutorName}>{tutorName}</Text>
              {teacher.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: 6 }} />
              )}
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({totalReviews} reviews)</Text>
            </View>
            <Text style={styles.qualification}>
              {teacher.education?.highestQualification || 'Educator'}
            </Text>
          </View>
          {matchPercentage > 0 && (
            <View style={[styles.matchBadge, { backgroundColor: badgeColors.bg }]}>
              <Text style={[styles.matchText, { color: badgeColors.text }]}>{matchPercentage}%</Text>
              <Text style={[styles.matchSub, { color: badgeColors.text }]}>Match</Text>
            </View>
          )}
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{experienceYears}+</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{teacher.pricingRevenue?.hourlyRate || 0}</Text>
            <Text style={styles.statLabel}>/hr</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{teacher.stats?.totalStudents || 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {/* Section 2: About Tutor */}
        {teacher.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{teacher.bio}</Text>
          </View>
        )}

        {/* Section 3: Qualifications */}
        <TutorQualifications
          highestQualification={teacher.education?.highestQualification || ''}
          degree={teacher.education?.degree || ''}
          university={teacher.education?.university || ''}
          yearOfCompletion={teacher.education?.yearOfCompletion}
          certifications={teacher.education?.certifications || []}
        />

        {/* Section 4: Experience & Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects & Expertise</Text>
          <View style={styles.chipsRow}>
            {(teacher.teachingDetails?.subjects || []).map((subject, i) => (
              <View key={`sub-${i}`} style={styles.subjectChip}>
                <Text style={styles.subjectText}>{subject}</Text>
              </View>
            ))}
          </View>
          {teacher.teachingDetails?.specialization && (
            <View style={styles.specialRow}>
              <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
              <Text style={styles.specialText}>
                Specialization: {teacher.teachingDetails.specialization}
              </Text>
            </View>
          )}
          {teacher.teachingDetails?.classes?.length > 0 && (
            <View style={styles.classesRow}>
              <Text style={styles.classesLabel}>Classes:</Text>
              <Text style={styles.classesText}>
                {teacher.teachingDetails.classes.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Section 5: Languages */}
        {(teacher.basicDetails?.languages?.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.chipsRow}>
              {teacher.basicDetails!.languages!.map((lang, i) => (
                <View key={`lang-${i}`} style={styles.langChip}>
                  <Ionicons name="chatbubble-outline" size={12} color={colors.info} />
                  <Text style={styles.langText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section 6: Teaching Modes, Availability, Location */}
        <TutorAvailability
          availableDays={teacher.locationAvailability?.availableDays || []}
          availableTimeSlots={teacher.locationAvailability?.availableTimeSlots || []}
          city={teacher.locationAvailability?.city || ''}
          area={teacher.locationAvailability?.preferredAreas?.[0]}
          teachingModes={teacher.teachingDetails?.teachingModes || []}
        />

        {/* Section 7: Statistics */}
        <TutorStats
          totalStudents={stats?.totalStudents || teacher.stats?.totalStudents || 0}
          completedClasses={stats?.completedClasses || teacher.stats?.completedClasses || 0}
          experienceYears={stats?.experienceYears || experienceYears}
          averageRating={stats?.averageRating || rating}
        />

        {/* Section 8: Gallery */}
        <TutorGallery
          certificates={gallery?.certificates || []}
          qualificationImages={gallery?.qualificationImages || []}
          portfolioPhotos={gallery?.portfolioPhotos || []}
          onImagePress={handleGalleryPress}
        />

        {/* Section 9: Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.reviewHeaderRight}>
              <TouchableOpacity style={styles.writeReviewBtn} onPress={handleOpenWriteReview}>
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <Text style={styles.writeReviewText}>Write Review</Text>
              </TouchableOpacity>
              {(reviewHook.ratings?.totalReviews || 0) > 0 && (
                <TouchableOpacity style={styles.viewAllBtn} onPress={handleViewAllReviews}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {reviewHook.isLoading ? (
            <View style={styles.reviewsSkeleton}>
              <View style={styles.reviewSkeletonRow}>
                <View style={[styles.skeletonBar, { width: 80, height: 80, borderRadius: 12 }]} />
                <View style={styles.reviewSkeletonBars}>
                  {[1, 2, 3, 4, 5].map((i) => <View key={i} style={[styles.skeletonBar, { height: 8, borderRadius: 4 }]} />)}
                </View>
              </View>
            </View>
          ) : reviewHook.ratings ? (
            <RatingBreakdown ratings={reviewHook.ratings} />
          ) : null}

          {!reviewHook.isLoading && reviewHook.reviews.slice(0, 2).map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              canManage={false}
              onHelpful={() => reviewHook.toggleHelpful(review._id)}
            />
          ))}

          {!reviewHook.isLoading && reviewHook.reviews.length === 0 && (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.textTertiary} />
              <Text style={styles.emptyReviewsText}>No Reviews Yet</Text>
              <Text style={styles.emptyReviewsSub}>Be the first parent to review this tutor.</Text>
            </View>
          )}

          {!reviewHook.isLoading && (reviewHook.ratings?.totalReviews || 0) > 2 && (
            <TouchableOpacity style={styles.viewAllRowBtn} onPress={handleViewAllReviews}>
              <Text style={styles.viewAllRowText}>See all {reviewHook.ratings?.totalReviews} reviews</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom spacing for action bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <WriteReviewModal
        visible={reviewModalVisible}
        initialReview={editingReview}
        isSubmitting={reviewHook.isSubmitting}
        error={reviewHook.submitError}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleReviewSubmit}
      />

      {/* Contact Request Modal */}
      <ContactRequestModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        onSubmit={handleContactSubmit}
        contactType={contactModalType}
        tutorName={tutorName}
        requirements={[]} // TODO: Pass actual parent requirements
        isSubmitting={contactHook.isSubmitting}
        error={contactHook.submitError}
      />

      {/* Demo Request Modal */}
      <DemoRequestModal
        visible={demoModalVisible}
        onClose={() => setDemoModalVisible(false)}
        onSubmit={handleDemoSubmit}
        tutorName={tutorName}
        requirements={[]} // TODO: Pass actual parent requirements
        isSubmitting={contactHook.isSubmitting}
        error={contactHook.submitError}
      />

      {/* Fixed Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={handleShortlist}
          disabled={shortlisted || shortlistLoading}
        >
          <Ionicons
            name={shortlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={shortlisted ? colors.error : colors.primary}
          />
          <Text style={[styles.actionBtnText, styles.secondaryBtnText]}>
            {shortlisted ? 'Saved' : 'Save Tutor'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.outlineBtn]} onPress={handleOpenDemoModal}>
          <Ionicons name="videocam-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, styles.outlineBtnText]}>Demo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => handleOpenContactModal('call')}>
          <Ionicons name="call-outline" size={18} color={colors.textWhite} />
          <Text style={[styles.actionBtnText, styles.primaryBtnText]}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerRight: { width: 40 },
  shareButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '600', color: colors.text },
  errorSub: { marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryButton: { marginTop: 24, minWidth: 120 },

  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  tutorName: { fontSize: 20, fontWeight: '700', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.text },
  reviewCount: { fontSize: 12, color: colors.textSecondary },
  qualification: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  matchBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  matchText: { fontSize: 18, fontWeight: '800' },
  matchSub: { fontSize: 10, fontWeight: '600' },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },

  // Sections
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  bioText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  // Subjects
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  specialRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  specialText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  classesRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 6 },
  classesLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  classesText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  // Languages
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.info + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langText: { fontSize: 13, fontWeight: '600', color: colors.info },

  // Reviews
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  viewAllRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12 },
  viewAllRowText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  emptyReviews: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyReviewsText: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },
  emptyReviewsSub: { fontSize: 12, color: colors.textTertiary },
  writeReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.primary + '12' },
  writeReviewText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  reviewsSkeleton: { marginBottom: 8 },
  reviewSkeletonRow: { flexDirection: 'row', gap: 16, padding: 4 },
  reviewSkeletonBars: { flex: 1, gap: 8, justifyContent: 'center' },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
    ...shadows.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryBtn: { backgroundColor: colors.primary },
  secondaryBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  outlineBtn: { backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '30' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  primaryBtnText: { color: colors.textWhite },
  secondaryBtnText: { color: colors.text },
  outlineBtnText: { color: colors.primary },

  // Skeleton
  skeletonContainer: { padding: 16 },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  skeletonHeaderText: { flex: 1, marginLeft: 16 },
  skeletonCircle: { borderRadius: 40, backgroundColor: colors.backgroundSecondary },
  skeletonBar: { borderRadius: 6, backgroundColor: colors.backgroundSecondary },
  skeletonStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  skeletonSection: { marginBottom: 20 },

  bottomSpacing: { height: 100 },
});

export default TutorProfileScreen;
