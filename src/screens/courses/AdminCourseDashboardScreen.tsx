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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import CourseComingSoonCard from './CourseComingSoonCard';

const { width } = Dimensions.get('window');
const CARD_W = (width - 32 - 10) / 2;

const AdminCourseDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const heroStats = [
    { label: 'Total Courses', value: '0', icon: 'book-outline', color: colors.secondary },
    { label: 'Published', value: '0', icon: 'checkmark-circle-outline', color: colors.success },
    { label: 'Students Enrolled', value: '0', icon: 'people-outline', color: colors.primary },
    { label: 'Revenue', value: '₹0', icon: 'cash-outline', color: colors.accent },
  ];

  const detailRows = [
    { label: 'Pending Moderation', value: '0', icon: 'time-outline', color: colors.warning, note: 'Awaiting review' },
    { label: 'Draft Courses', value: '0', icon: 'create-outline', color: colors.info, note: 'Not published' },
    { label: 'Verified Instructors', value: '0', icon: 'shield-checkmark-outline', color: colors.success, note: 'Background checked' },
    { label: 'Certificates Issued', value: '0', icon: 'ribbon-outline', color: colors.secondary, note: 'All time' },
    { label: 'Avg. Course Rating', value: '—', icon: 'star-outline', color: colors.accent, note: 'Platform average' },
    { label: 'Monthly Revenue', value: '₹0', icon: 'trending-up-outline', color: colors.primary, note: 'This month' },
  ];

  const categoryStats = [
    { name: 'Mathematics', courses: 0, color: colors.primary },
    { name: 'Science', courses: 0, color: colors.info },
    { name: 'English', courses: 0, color: colors.success },
    { name: 'Coding', courses: 0, color: colors.secondary },
    { name: 'Olympiad', courses: 0, color: colors.accent },
  ];

  const mockTrendBars = [
    { label: 'Jan', height: 18 },
    { label: 'Feb', height: 30 },
    { label: 'Mar', height: 22 },
    { label: 'Apr', height: 48 },
    { label: 'May', height: 36 },
    { label: 'Jun', height: 60 },
  ];

  const futureFeatures = [
    { icon: 'shield-checkmark-outline', label: 'Course Moderation', color: colors.primary },
    { icon: 'person-add-outline', label: 'Instructor Verification', color: colors.info },
    { icon: 'git-branch-outline', label: 'Revenue Sharing', color: colors.success },
    { icon: 'trophy-outline', label: 'Certification Engine', color: colors.accent },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Course Dashboard</Text>
          <Text style={styles.headerSubtitle}>Demo Data — No Backend</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>DEMO</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Ionicons name="flask-outline" size={16} color={colors.accent} />
            <Text style={styles.demoNoticeText}>
              All values are mock/demo data. Real metrics will populate after the LMS backend integration.
            </Text>
          </View>

          {/* Hero Stats */}
          <Text style={styles.sectionLabel}>MARKETPLACE OVERVIEW</Text>
          <View style={styles.statsGrid}>
            {heroStats.map(stat => (
              <View key={stat.label} style={[styles.statCard, { width: CARD_W }]}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Detail Breakdown */}
          <Text style={styles.sectionLabel}>DETAILED BREAKDOWN</Text>
          <View style={styles.detailCard}>
            {detailRows.map((row, idx) => (
              <React.Fragment key={row.label}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: row.color + '18' }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.color} />
                  </View>
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailNote}>{row.note}</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: row.color }]}>{row.value}</Text>
                </View>
                {idx < detailRows.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Category Distribution */}
          <Text style={styles.sectionLabel}>CATEGORY DISTRIBUTION</Text>
          <View style={styles.categoryCard}>
            {categoryStats.map((cat, idx, arr) => (
              <React.Fragment key={cat.name}>
                <View style={styles.categoryRow}>
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catName}>{cat.name}</Text>
                  <View style={styles.catBarTrack}>
                    <View style={[styles.catBarFill, { width: '0%', backgroundColor: cat.color }]} />
                  </View>
                  <Text style={[styles.catValue, { color: cat.color }]}>{cat.courses}</Text>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Mock Chart */}
          <Text style={styles.sectionLabel}>ENROLLMENT TREND (MOCK)</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Monthly Enrollments</Text>
              <View style={styles.mockBadge}>
                <Text style={styles.mockBadgeText}>MOCK</Text>
              </View>
            </View>
            <View style={styles.chartBars}>
              {mockTrendBars.map(bar => (
                <View key={bar.label} style={styles.barGroup}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: bar.height, backgroundColor: colors.secondary }]} />
                  </View>
                  <Text style={styles.barLabel}>{bar.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartFooter}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.chartFooterText}>Real data after LMS integration</Text>
            </View>
          </View>

          {/* Coming Soon Card */}
          <CourseComingSoonCard
            title="Admin Course Dashboard"
            subtitle="Full LMS admin panel with course moderation, instructor verification, revenue sharing and certification engine."
            features={['Course Moderation', 'Instructor Verification', 'Revenue Sharing', 'Certification Engine']}
            progress={85}
            eta="Q2 2027"
            accentColor={colors.secondary}
          />

          {/* Future Features — Disabled */}
          <Text style={styles.sectionLabel}>FUTURE FEATURES (DISABLED)</Text>
          <View style={styles.futureCard}>
            {futureFeatures.map((feat, idx, arr) => (
              <React.Fragment key={feat.label}>
                <View style={styles.futureRow}>
                  <View style={[styles.futureIcon, { backgroundColor: feat.color + '18' }]}>
                    <Ionicons name={feat.icon as any} size={18} color={feat.color} />
                  </View>
                  <Text style={styles.futureLabel}>{feat.label}</Text>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed-outline" size={11} color={colors.textTertiary} />
                    <Text style={styles.lockedText}>Soon</Text>
                  </View>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 1 },
  demoBadge: {
    backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  demoBadgeText: { fontSize: 10, fontWeight: '900', color: colors.textWhite, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  demoNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.accent + '15', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colors.accent + '30',
  },
  demoNoticeText: { flex: 1, fontSize: 13, color: colors.accent, lineHeight: 19, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, paddingHorizontal: 4,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16, ...shadows.card,
  },
  statIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, lineHeight: 17 },

  detailCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  detailIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  detailNote: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  detailValue: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },

  categoryCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { width: 110, fontSize: 13, fontWeight: '600', color: colors.text },
  catBarTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: colors.backgroundTertiary, overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  catValue: { width: 24, textAlign: 'right', fontSize: 13, fontWeight: '700' },

  chartCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, ...shadows.card },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  mockBadge: { backgroundColor: colors.accent + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mockBadgeText: { fontSize: 10, fontWeight: '800', color: colors.accent },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 80, marginBottom: 8 },
  barGroup: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  barFill: { borderRadius: 4, width: '100%', minHeight: 4 },
  barLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '600' },
  chartFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chartFooterText: { fontSize: 11, color: colors.textTertiary },

  futureCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  futureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, opacity: 0.7,
  },
  futureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  futureLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  lockedText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
});

export default AdminCourseDashboardScreen;
