import React, { useEffect, useRef } from 'react';
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
import CourseComingSoonCard from './CourseComingSoonCard';

const FILTER_TABS = ['All', 'In Progress', 'Completed', 'Saved'];

const MyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);
  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const summaryCards = [
    { label: 'Enrolled', value: '0', icon: 'book-outline', color: colors.secondary },
    { label: 'Completed', value: '0', icon: 'ribbon-outline', color: colors.success },
    { label: 'Certificates', value: '0', icon: 'trophy-outline', color: colors.accent },
  ];

  const mockSkeletonCourses = [
    { emoji: '📐', subject: 'Mathematics', progress: 0, color: colors.primary },
    { emoji: '🔬', subject: 'Science', progress: 0, color: colors.info },
    { emoji: '💻', subject: 'Coding', progress: 0, color: colors.secondary },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Courses</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Summary */}
          <View style={styles.summaryRow}>
            {summaryCards.map(s => (
              <View key={s.label} style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {FILTER_TABS.map((tab, idx) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, idx === 0 && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, idx === 0 && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <Animated.View style={[styles.emptyIconOuter, { transform: [{ translateY: floatAnim }] }]}>
              <View style={styles.emptyIconInner}>
                <Ionicons name="school-outline" size={52} color={colors.secondary} />
              </View>
              <Text style={styles.emptyEmoji}>🎓</Text>
            </Animated.View>
            <Text style={styles.emptyTitle}>No Courses Yet</Text>
            <Text style={styles.emptySubtitle}>
              Marketplace launches soon.{'\n'}
              Your enrolled courses will appear here.
            </Text>
            <TouchableOpacity
              style={styles.browseCta}
              onPress={() => navigation.navigate('CourseMarketplace', { role })}
              activeOpacity={0.82}
            >
              <Ionicons name="storefront-outline" size={16} color={colors.textWhite} />
              <Text style={styles.browseCtaText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>

          {/* Skeleton Courses Preview */}
          <Text style={styles.sectionLabel}>PREVIEW — SAMPLE COURSES</Text>
          <View style={styles.skeletonList}>
            {mockSkeletonCourses.map((course, idx, arr) => (
              <React.Fragment key={course.subject}>
                <View style={styles.skeletonRow}>
                  <View style={[styles.skeletonEmoji, { backgroundColor: course.color + '15' }]}>
                    <Text style={styles.skeletonEmojiText}>{course.emoji}</Text>
                  </View>
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonBar} />
                    <View style={styles.skeletonBarShort} />
                    <View style={styles.skeletonProgressTrack}>
                      <View style={[styles.skeletonProgressFill, { width: '0%', backgroundColor: course.color }]} />
                    </View>
                    <Text style={styles.skeletonProgressText}>0% Complete</Text>
                  </View>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
            <View style={styles.skeletonOverlay}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.skeletonOverlayText}>Available after marketplace launch</Text>
            </View>
          </View>

          {/* Coming Soon Card */}
          <CourseComingSoonCard
            title="My Learning Library"
            subtitle="All your enrolled courses, progress tracking, certificates and bookmarks in one place."
            features={['Progress Tracking', 'Downloadable Notes', 'Mock Tests', 'Certificates']}
            progress={85}
            eta="Q2 2027"
            accentColor={colors.secondary}
          />

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 5, ...shadows.sm,
  },
  summaryIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary, textAlign: 'center' },

  tabsRow: { gap: 8, paddingVertical: 4 },
  tabChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  tabChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.textWhite },

  emptyContainer: { alignItems: 'center', paddingVertical: 16 },
  emptyIconOuter: { position: 'relative', marginBottom: 20 },
  emptyIconInner: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: colors.secondary + '12', justifyContent: 'center', alignItems: 'center',
  },
  emptyEmoji: { position: 'absolute', bottom: -4, right: -8, fontSize: 28 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  browseCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.secondary, paddingVertical: 13, paddingHorizontal: 22,
    borderRadius: 14, ...shadows.md,
  },
  browseCtaText: { fontSize: 15, fontWeight: '700', color: colors.textWhite },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, paddingHorizontal: 4,
  },

  skeletonList: {
    backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden',
    ...shadows.card, position: 'relative',
  },
  skeletonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, opacity: 0.55 },
  skeletonEmoji: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  skeletonEmojiText: { fontSize: 24 },
  skeletonContent: { flex: 1, gap: 5 },
  skeletonBar: { height: 10, borderRadius: 5, backgroundColor: colors.border, width: '72%' },
  skeletonBarShort: { height: 8, borderRadius: 4, backgroundColor: colors.borderLight, width: '44%' },
  skeletonProgressTrack: {
    height: 5, borderRadius: 3,
    backgroundColor: colors.backgroundTertiary, overflow: 'hidden',
  },
  skeletonProgressFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  skeletonProgressText: { fontSize: 10, color: colors.textTertiary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 76 },
  skeletonOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  skeletonOverlayText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
});

export default MyCoursesScreen;
