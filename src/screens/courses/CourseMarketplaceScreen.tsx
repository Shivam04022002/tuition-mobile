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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import CourseComingSoonCard from './CourseComingSoonCard';

const { width } = Dimensions.get('window');
const CATEGORY_W = (width - 32 - 10) / 2;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  emoji: string;
}

const CATEGORIES: Category[] = [
  { id: 'math', name: 'Mathematics', icon: 'calculator-outline', color: colors.primary, emoji: '📐' },
  { id: 'science', name: 'Science', icon: 'flask-outline', color: colors.info, emoji: '🔬' },
  { id: 'english', name: 'English', icon: 'book-outline', color: colors.success, emoji: '📖' },
  { id: 'coding', name: 'Coding', icon: 'code-slash-outline', color: colors.secondary, emoji: '💻' },
  { id: 'olympiad', name: 'Olympiad Prep', icon: 'trophy-outline', color: colors.accent, emoji: '🏆' },
  { id: 'competitive', name: 'Competitive Exams', icon: 'school-outline', color: colors.pink, emoji: '🎯' },
  { id: 'spoken', name: 'Spoken English', icon: 'mic-outline', color: colors.success, emoji: '🎤' },
  { id: 'personality', name: 'Personality Dev.', icon: 'person-outline', color: colors.secondary, emoji: '🌟' },
];

const PARENT_FEATURES = [
  'HD Video Lessons',
  'Live Q&A Sessions',
  'Progress Tracking',
  'Downloadable Notes',
  'Mock Tests',
  'Doubt Resolution',
];

const TEACHER_FEATURES = [
  'Create Course',
  'Upload Lessons',
  'Student Analytics',
  'Course Revenue',
  'Certificates',
  'Course Recordings',
  'Peer Discussion',
];

const CourseMarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);
  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Marketplace</Text>
        <TouchableOpacity
          style={styles.myCoursesBtn}
          onPress={() => navigation.navigate('MyCourses', { role })}
        >
          <Ionicons name="library-outline" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBlob1} />
            <View style={styles.heroBlob2} />
            <View style={styles.heroLeft}>
              <Text style={styles.heroEmoji}>🎓</Text>
              <Text style={styles.heroTitle}>Learn Beyond{'\n'}Tuition</Text>
              <Text style={styles.heroSubtitle}>Premium Courses Coming Soon</Text>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="time-outline" size={12} color={colors.accent} />
                  <Text style={styles.heroBadgeText}>Q2 2027</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={[styles.heroBadgeText, { color: colors.textWhite }]}>85% Done</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.heroIconStack}>
                {['📐', '🔬', '💻', '🏆'].map((em, i) => (
                  <View key={i} style={[styles.heroIconItem, { top: i * 20, right: i % 2 === 0 ? 0 : 18 }]}>
                    <Text style={styles.heroIconEmoji}>{em}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Quick Nav */}
          <View style={styles.quickNav}>
            <TouchableOpacity
              style={styles.quickNavCard}
              onPress={() => navigation.navigate('CourseCategories', { role })}
              activeOpacity={0.8}
            >
              <View style={[styles.quickNavIcon, { backgroundColor: colors.secondary + '18' }]}>
                <Ionicons name="grid-outline" size={22} color={colors.secondary} />
              </View>
              <Text style={styles.quickNavLabel}>Categories</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickNavCard}
              onPress={() => navigation.navigate('MyCourses', { role })}
              activeOpacity={0.8}
            >
              <View style={[styles.quickNavIcon, { backgroundColor: colors.accent + '18' }]}>
                <Ionicons name="library-outline" size={22} color={colors.accent} />
              </View>
              <Text style={styles.quickNavLabel}>My Courses</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Categories Grid */}
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { width: CATEGORY_W }]}
                onPress={() => navigation.navigate('CourseDetails', { categoryId: cat.id, categoryName: cat.name })}
                activeOpacity={0.82}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '18' }]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCourseCount}>0 Courses</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>Coming Soon</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Coming Soon Card */}
          <CourseComingSoonCard
            title="Course Marketplace"
            subtitle="A full-featured LMS with video lessons, live Q&A, mock tests, and certifications — built directly into the Tuition app."
            features={role === 'teacher' ? TEACHER_FEATURES : PARENT_FEATURES}
            progress={85}
            eta="Q2 2027"
            accentColor={colors.secondary}
          />

          {/* Teacher Create CTA */}
          {role === 'teacher' && (
            <View style={styles.teacherCta}>
              <View style={styles.teacherCtaLeft}>
                <Text style={styles.teacherCtaTitle}>Become an Instructor</Text>
                <Text style={styles.teacherCtaSubtitle}>
                  Create and sell your own courses — coming soon.
                </Text>
              </View>
              <View style={styles.teacherCtaBadge}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.secondary} />
              </View>
            </View>
          )}

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
            <Text style={styles.noteText}>
              Course Marketplace is built on a dedicated LMS backend. All courses are peer-reviewed before publication.
            </Text>
          </View>

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
  myCoursesBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  heroBanner: {
    borderRadius: 24, padding: 20, backgroundColor: colors.secondary,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    position: 'relative', ...shadows.lg, minHeight: 160,
  },
  heroBlob1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    top: -50, right: -40, backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroBlob2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    bottom: -30, left: 80, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroLeft: { flex: 1 },
  heroEmoji: { fontSize: 28, marginBottom: 6 },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: colors.textWhite,
    letterSpacing: -0.5, marginBottom: 6, lineHeight: 28,
  },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.70)', marginBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent + '28',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  heroRight: { width: 80, position: 'relative', height: 120 },
  heroIconStack: { position: 'absolute', width: 80, height: 120 },
  heroIconItem: {
    position: 'absolute',
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroIconEmoji: { fontSize: 20 },

  quickNav: { flexDirection: 'row', gap: 10 },
  quickNavCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10, ...shadows.sm,
  },
  quickNavIcon: { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  quickNavLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, paddingHorizontal: 4,
  },

  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 14,
    alignItems: 'center', gap: 6, ...shadows.card,
  },
  categoryIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  categoryEmoji: { fontSize: 26 },
  categoryName: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  categoryCourseCount: { fontSize: 11, color: colors.textTertiary },
  categoryBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', color: colors.accent },

  teacherCta: {
    backgroundColor: colors.secondary + '12', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.secondary + '30',
  },
  teacherCtaLeft: { flex: 1 },
  teacherCtaTitle: { fontSize: 15, fontWeight: '800', color: colors.secondary, marginBottom: 3 },
  teacherCtaSubtitle: { fontSize: 12, color: colors.textSecondary },
  teacherCtaBadge: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: colors.secondary + '18',
    justifyContent: 'center', alignItems: 'center',
  },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight, padding: 14, borderRadius: 14,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19, fontWeight: '500' },
});

export default CourseMarketplaceScreen;
