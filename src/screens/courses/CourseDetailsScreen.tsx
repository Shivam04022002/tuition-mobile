import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const TABS = ['About', 'Curriculum', 'Instructor', 'Reviews'];

const MOCK_CURRICULUM = [
  { week: 1, title: 'Introduction & Foundations', lessons: 4, duration: '2h 30m' },
  { week: 2, title: 'Core Concepts Deep Dive', lessons: 6, duration: '3h 45m' },
  { week: 3, title: 'Practice & Problem Solving', lessons: 5, duration: '3h 00m' },
  { week: 4, title: 'Advanced Topics', lessons: 4, duration: '2h 15m' },
  { week: 5, title: 'Mock Tests & Revision', lessons: 3, duration: '1h 30m' },
];

const MOCK_REVIEWS = [
  { name: 'Priya S.', rating: 5, text: 'Excellent course structure!', avatar: '👩' },
  { name: 'Rahul M.', rating: 4, text: 'Very well explained concepts.', avatar: '👨' },
  { name: 'Ananya K.', rating: 5, text: 'Best course for exam prep!', avatar: '👩' },
];

const CourseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const categoryName: string = route.params?.categoryName ?? 'Mathematics';
  const [activeTab, setActiveTab] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons key={i} name={i < rating ? 'star' : 'star-outline'} size={12} color={colors.accent} />
    ));

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <View style={styles.tabContent}>
            <Text style={styles.aboutTitle}>About This Course</Text>
            <Text style={styles.aboutText}>
              This comprehensive course covers all key topics in {categoryName}, designed for students who want to excel in their academics and competitive exams. The curriculum is crafted by expert educators with years of teaching experience.
            </Text>
            <View style={styles.aboutHighlights}>
              {[
                { icon: 'videocam-outline', label: '25 HD Video Lessons', color: colors.info },
                { icon: 'time-outline', label: '12 Hours of Content', color: colors.primary },
                { icon: 'document-text-outline', label: 'Downloadable Notes', color: colors.success },
                { icon: 'clipboard-outline', label: '5 Mock Tests', color: colors.accent },
                { icon: 'ribbon-outline', label: 'Certificate of Completion', color: colors.secondary },
                { icon: 'people-outline', label: 'Community Access', color: colors.pink },
              ].map(h => (
                <View key={h.label} style={styles.highlightRow}>
                  <View style={[styles.highlightIcon, { backgroundColor: h.color + '18' }]}>
                    <Ionicons name={h.icon as any} size={16} color={h.color} />
                  </View>
                  <Text style={styles.highlightLabel}>{h.label}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.tabContent}>
            {MOCK_CURRICULUM.map((week, idx) => (
              <View key={week.week} style={styles.curriculumItem}>
                <View style={styles.curriculumWeekBadge}>
                  <Text style={styles.curriculumWeekText}>W{week.week}</Text>
                </View>
                <View style={styles.curriculumContent}>
                  <Text style={styles.curriculumTitle}>{week.title}</Text>
                  <View style={styles.curriculumMeta}>
                    <Ionicons name="play-circle-outline" size={13} color={colors.textTertiary} />
                    <Text style={styles.curriculumMetaText}>{week.lessons} lessons</Text>
                    <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
                    <Text style={styles.curriculumMetaText}>{week.duration}</Text>
                  </View>
                </View>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
              </View>
            ))}
            <View style={styles.curriculumNote}>
              <Ionicons name="information-circle-outline" size={14} color={colors.secondary} />
              <Text style={styles.curriculumNoteText}>Full curriculum available after course launch</Text>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.tabContent}>
            <View style={styles.instructorCard}>
              <View style={styles.instructorAvatar}>
                <Text style={styles.instructorEmoji}>👨‍🏫</Text>
              </View>
              <View style={styles.instructorInfo}>
                <Text style={styles.instructorName}>Expert Educator</Text>
                <Text style={styles.instructorTitle}>{categoryName} Specialist</Text>
                <View style={styles.instructorStats}>
                  <View style={styles.instructorStat}>
                    <Text style={styles.instructorStatValue}>0</Text>
                    <Text style={styles.instructorStatLabel}>Courses</Text>
                  </View>
                  <View style={styles.instructorStat}>
                    <Text style={styles.instructorStatValue}>0</Text>
                    <Text style={styles.instructorStatLabel}>Students</Text>
                  </View>
                  <View style={styles.instructorStat}>
                    <Text style={styles.instructorStatValue}>—</Text>
                    <Text style={styles.instructorStatLabel}>Rating</Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.instructorBio}>
              Our instructors are verified educators and subject matter experts. Instructor profiles and verification will be available when the marketplace launches.
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>All instructors are background-verified</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.tabContent}>
            <View style={styles.ratingOverview}>
              <Text style={styles.ratingBig}>—</Text>
              <Text style={styles.ratingLabel}>Course Rating</Text>
              <Text style={styles.ratingNote}>Available after launch</Text>
            </View>
            {MOCK_REVIEWS.map(r => (
              <View key={r.name} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAvatar}>{r.avatar}</Text>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewName}>{r.name}</Text>
                    <View style={styles.reviewStars}>{renderStars(r.rating)}</View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
                <View style={styles.reviewLock}>
                  <Ionicons name="lock-closed-outline" size={11} color={colors.textTertiary} />
                  <Text style={styles.reviewLockText}>Sample review — real reviews after launch</Text>
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Thumbnail Placeholder */}
          <View style={styles.thumbnail}>
            <View style={styles.thumbnailInner}>
              <Text style={styles.thumbnailEmoji}>
                {categoryName === 'Mathematics' ? '📐'
                  : categoryName === 'Science' ? '🔬'
                  : categoryName === 'English' ? '📖'
                  : categoryName === 'Coding' ? '💻'
                  : '🎓'}
              </Text>
              <Text style={styles.thumbnailTitle}>{categoryName}</Text>
              <Text style={styles.thumbnailSub}>Course Preview</Text>
            </View>
            <View style={styles.thumbnailPlayBtn}>
              <Ionicons name="play" size={22} color={colors.secondary} />
            </View>
          </View>

          {/* Course Info */}
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>{categoryName} — Complete Course</Text>
            <Text style={styles.courseSubtitle}>
              Comprehensive curriculum for students preparing for exams and beyond
            </Text>
            <View style={styles.courseMetaRow}>
              <View style={styles.courseMeta}>
                <Ionicons name="star" size={14} color={colors.accent} />
                <Text style={styles.courseMetaText}>—</Text>
              </View>
              <View style={styles.courseMeta}>
                <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.courseMetaText}>0 students</Text>
              </View>
              <View style={styles.courseMeta}>
                <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.courseMetaText}>12h total</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {TABS.map((tab, idx) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, activeTab === idx && styles.tabChipActive]}
                onPress={() => setActiveTab(idx)}
              >
                <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          <View style={styles.tabContentWrap}>{renderTabContent()}</View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Enroll Button — Fixed Bottom */}
      <View style={[styles.enrollBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        <View style={styles.enrollPriceWrap}>
          <Text style={styles.enrollPriceLabel}>Price</Text>
          <Text style={styles.enrollPrice}>Coming Soon</Text>
        </View>
        <TouchableOpacity style={styles.enrollBtn} activeOpacity={0.9} disabled>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textWhite} />
          <Text style={styles.enrollBtnText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.textWhite, marginHorizontal: 8 },
  shareBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  thumbnail: {
    backgroundColor: colors.secondary + '18', borderRadius: 20, height: 180,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    borderWidth: 1, borderColor: colors.secondary + '30',
  },
  thumbnailInner: { alignItems: 'center' },
  thumbnailEmoji: { fontSize: 44, marginBottom: 8 },
  thumbnailTitle: { fontSize: 18, fontWeight: '800', color: colors.secondary },
  thumbnailSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  thumbnailPlayBtn: {
    position: 'absolute', bottom: 12, right: 12,
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', ...shadows.sm,
  },

  courseInfo: { gap: 6 },
  courseTitle: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  courseSubtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  courseMetaRow: { flexDirection: 'row', gap: 16 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  courseMetaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  tabsRow: { gap: 8, paddingVertical: 4 },
  tabChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  tabChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.textWhite },

  tabContentWrap: { backgroundColor: colors.card, borderRadius: 20, ...shadows.card },
  tabContent: { padding: 16, gap: 12 },

  aboutTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  aboutText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  aboutHighlights: { gap: 8 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  highlightIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  highlightLabel: { fontSize: 13, fontWeight: '600', color: colors.text },

  curriculumItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  curriculumWeekBadge: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.secondary + '18', justifyContent: 'center', alignItems: 'center',
  },
  curriculumWeekText: { fontSize: 11, fontWeight: '800', color: colors.secondary },
  curriculumContent: { flex: 1 },
  curriculumTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 3 },
  curriculumMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  curriculumMetaText: { fontSize: 11, color: colors.textTertiary },
  curriculumNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.secondary + '12', padding: 10, borderRadius: 10, marginTop: 4,
  },
  curriculumNoteText: { fontSize: 12, color: colors.secondary, fontWeight: '500' },

  instructorCard: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  instructorAvatar: {
    width: 70, height: 70, borderRadius: 18,
    backgroundColor: colors.secondary + '15', justifyContent: 'center', alignItems: 'center',
  },
  instructorEmoji: { fontSize: 34 },
  instructorInfo: { flex: 1 },
  instructorName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  instructorTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  instructorStats: { flexDirection: 'row', gap: 20 },
  instructorStat: { alignItems: 'center' },
  instructorStatValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  instructorStatLabel: { fontSize: 10, color: colors.textTertiary },
  instructorBio: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.successLight, padding: 10, borderRadius: 10,
  },
  verifiedText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  ratingOverview: { alignItems: 'center', paddingVertical: 10 },
  ratingBig: { fontSize: 44, fontWeight: '900', color: colors.text },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  ratingNote: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  reviewCard: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 12,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { fontSize: 26 },
  reviewMeta: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewStars: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 6, opacity: 0.7 },
  reviewLock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewLockText: { fontSize: 10, color: colors.textTertiary },

  enrollBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card, paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: colors.border, ...shadows.lg,
  },
  enrollPriceWrap: { flex: 1 },
  enrollPriceLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  enrollPrice: { fontSize: 18, fontWeight: '900', color: colors.secondary },
  enrollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.textSecondary,
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14,
    opacity: 0.6,
  },
  enrollBtnText: { fontSize: 15, fontWeight: '800', color: colors.textWhite },
});

export default CourseDetailsScreen;
