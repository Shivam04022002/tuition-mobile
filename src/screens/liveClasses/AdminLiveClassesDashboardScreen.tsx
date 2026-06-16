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
import LiveClassComingSoonCard from './LiveClassComingSoonCard';

const { width } = Dimensions.get('window');
const CARD_W = (width - 32 - 10) / 2;

const AdminLiveClassesDashboardScreen: React.FC = () => {
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
    { label: 'Total Classes', value: '0', icon: 'videocam-outline', color: colors.info },
    { label: 'Active Teachers', value: '0', icon: 'school-outline', color: colors.primary },
    { label: 'Total Students', value: '0', icon: 'people-outline', color: colors.success },
    { label: 'Recorded Sessions', value: '0', icon: 'recording-outline', color: colors.accent },
  ];

  const detailRows = [
    { label: 'Classes This Week', value: '0', icon: 'calendar-outline', color: colors.info, note: 'Rolling 7 days' },
    { label: 'Average Duration', value: '0 min', icon: 'hourglass-outline', color: colors.secondary, note: 'Per session' },
    { label: 'Attendance Rate', value: '0%', icon: 'checkmark-done-outline', color: colors.success, note: 'vs scheduled' },
    { label: 'Recording Storage', value: '0 GB', icon: 'cloud-outline', color: colors.accent, note: 'Used storage' },
    { label: 'Missed Classes', value: '0', icon: 'close-circle-outline', color: colors.error, note: 'Student no-shows' },
    { label: 'Upcoming Scheduled', value: '0', icon: 'time-outline', color: colors.primary, note: 'Next 7 days' },
  ];

  const mockTrendBars = [
    { label: 'Jan', height: 15 },
    { label: 'Feb', height: 28 },
    { label: 'Mar', height: 20 },
    { label: 'Apr', height: 45 },
    { label: 'May', height: 38 },
    { label: 'Jun', height: 55 },
  ];

  const subjectMockData = [
    { subject: 'Mathematics', sessions: 0, color: colors.primary },
    { subject: 'Science', sessions: 0, color: colors.info },
    { subject: 'English', sessions: 0, color: colors.success },
    { subject: 'Hindi', sessions: 0, color: colors.accent },
    { subject: 'Social Studies', sessions: 0, color: colors.secondary },
  ];

  const adminActions = [
    { icon: 'settings-outline', label: 'Platform Settings', color: colors.primary },
    { icon: 'cloud-download-outline', label: 'Export Report', color: colors.info },
    { icon: 'pricetag-outline', label: 'Manage Subscriptions', color: colors.accent },
    { icon: 'shield-checkmark-outline', label: 'Moderation Queue', color: colors.success },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Classes Analytics</Text>
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
              All values are mock/demo data. Real metrics will populate after WebRTC live classes integration.
            </Text>
          </View>

          {/* Hero Stats Grid */}
          <Text style={styles.sectionLabel}>PLATFORM OVERVIEW</Text>
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

          {/* Mock Chart */}
          <Text style={styles.sectionLabel}>MONTHLY TREND (MOCK)</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Sessions per Month</Text>
              <View style={styles.mockBadge}>
                <Text style={styles.mockBadgeText}>MOCK</Text>
              </View>
            </View>
            <View style={styles.chartBars}>
              {mockTrendBars.map(bar => (
                <View key={bar.label} style={styles.barGroup}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: bar.height, backgroundColor: colors.info }]} />
                  </View>
                  <Text style={styles.barLabel}>{bar.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartFooter}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.chartFooterText}>Real data after WebRTC integration</Text>
            </View>
          </View>

          {/* Subject Distribution */}
          <Text style={styles.sectionLabel}>SUBJECT DISTRIBUTION</Text>
          <View style={styles.subjectCard}>
            {subjectMockData.map((item, idx, arr) => (
              <React.Fragment key={item.subject}>
                <View style={styles.subjectRow}>
                  <View style={[styles.subjectDot, { backgroundColor: item.color }]} />
                  <Text style={styles.subjectLabel}>{item.subject}</Text>
                  <View style={styles.subjectBarTrack}>
                    <View style={[styles.subjectBarFill, { width: '0%', backgroundColor: item.color }]} />
                  </View>
                  <Text style={[styles.subjectValue, { color: item.color }]}>{item.sessions}</Text>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Coming Soon Card */}
          <LiveClassComingSoonCard
            title="Live Classes Admin Dashboard"
            description="Complete analytics with real-time session monitoring, attendance reports, recording management, and teacher performance metrics."
            features={['Attendance Management', 'Recording Library', 'Student Engagement']}
            eta="Q1 2027"
            progress={80}
            iconColor={colors.info}
          />

          {/* Admin Actions (Disabled) */}
          <Text style={styles.sectionLabel}>ADMIN ACTIONS (DISABLED)</Text>
          <View style={styles.actionsCard}>
            {adminActions.map((action, idx, arr) => (
              <React.Fragment key={action.label}>
                <View style={styles.actionRow}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                    <Ionicons name={action.icon as any} size={18} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
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
    backgroundColor: colors.info, paddingHorizontal: 16, paddingBottom: 20,
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

  subjectCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  subjectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  subjectDot: { width: 10, height: 10, borderRadius: 5 },
  subjectLabel: { width: 120, fontSize: 13, fontWeight: '600', color: colors.text },
  subjectBarTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: colors.backgroundTertiary, overflow: 'hidden',
  },
  subjectBarFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  subjectValue: { width: 24, textAlign: 'right', fontSize: 13, fontWeight: '700' },

  actionsCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, opacity: 0.7,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  lockedText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
});

export default AdminLiveClassesDashboardScreen;
