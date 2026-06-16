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
import LiveClassComingSoonCard from './LiveClassComingSoonCard';

const FILTER_TABS = ['All', 'Attended', 'Missed', 'Recordings'];

const ClassHistoryScreen: React.FC = () => {
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
        Animated.timing(floatAnim, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const summaryItems = [
    { label: 'Attended', value: '0', icon: 'checkmark-circle-outline', color: colors.success },
    { label: 'Missed', value: '0', icon: 'close-circle-outline', color: colors.error },
    { label: 'Recordings', value: '0', icon: 'recording-outline', color: colors.info },
  ];

  const mockHistoryItems = [
    { subject: 'Mathematics', date: 'Jun 6, 2026', duration: '60 min', status: 'attended' },
    { subject: 'Science', date: 'Jun 5, 2026', duration: '45 min', status: 'missed' },
    { subject: 'English', date: 'Jun 4, 2026', duration: '60 min', status: 'recorded' },
  ];

  const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
    attended: { color: colors.success, label: 'Attended', icon: 'checkmark-circle-outline' },
    missed: { color: colors.error, label: 'Missed', icon: 'close-circle-outline' },
    recorded: { color: colors.info, label: 'Recorded', icon: 'recording-outline' },
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class History</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            {summaryItems.map(item => (
              <View key={item.label} style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
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
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="film-outline" size={52} color={colors.info} />
              </View>
              <Text style={styles.emptyEmoji}>📚</Text>
            </Animated.View>

            <Text style={styles.emptyTitle}>No Classes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Live Classes are under development.{'\n'}
              Your attendance history and recordings{'\n'}will appear here after launch.
            </Text>
          </View>

          {/* Skeleton History */}
          <Text style={styles.sectionLabel}>PREVIEW — SAMPLE HISTORY</Text>
          <View style={styles.historyCard}>
            {mockHistoryItems.map((item, idx, arr) => {
              const cfg = statusConfig[item.status];
              return (
                <React.Fragment key={item.subject}>
                  <View style={styles.historyRow}>
                    <View style={[styles.historySubjectDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.historyContent}>
                      <View style={styles.historyBarLong} />
                      <View style={styles.historyBarShort} />
                      <View style={styles.historyMeta}>
                        <View style={[styles.historyMetaChip, { backgroundColor: cfg.color + '15' }]}>
                          <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                          <Text style={[styles.historyMetaText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={styles.historyDate}>{item.date}</Text>
                        <Text style={styles.historyDuration}>{item.duration}</Text>
                      </View>
                    </View>
                  </View>
                  {idx < arr.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
            <View style={styles.previewOverlay}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.previewOverlayText}>Available after live classes launch</Text>
            </View>
          </View>

          {/* Coming Soon card */}
          <LiveClassComingSoonCard
            title="Class History & Recordings"
            description="All your attended classes, missed sessions, and downloadable recordings in one place with attendance analytics."
            features={['Class Recordings', 'Attendance Tracking', 'Study Materials']}
            eta="Q1 2027"
            progress={80}
            iconColor={colors.accent}
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
    backgroundColor: colors.info, paddingHorizontal: 16, paddingBottom: 20,
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
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6, ...shadows.sm,
  },
  summaryIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textAlign: 'center' },

  tabsRow: { gap: 8, paddingVertical: 4 },
  tabChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  tabChipActive: { backgroundColor: colors.info, borderColor: colors.info },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.textWhite },

  emptyContainer: { alignItems: 'center', paddingVertical: 16 },
  emptyIconWrap: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: colors.info + '12', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: { position: 'absolute', bottom: 12, right: -8, fontSize: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, paddingHorizontal: 4,
  },

  historyCard: {
    backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden',
    ...shadows.card, position: 'relative',
  },
  historyRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, opacity: 0.6 },
  historySubjectDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  historyContent: { flex: 1, gap: 6 },
  historyBarLong: { height: 10, borderRadius: 5, backgroundColor: colors.border, width: '70%' },
  historyBarShort: { height: 8, borderRadius: 4, backgroundColor: colors.borderLight, width: '40%' },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyMetaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  historyMetaText: { fontSize: 10, fontWeight: '700' },
  historyDate: { fontSize: 10, color: colors.textTertiary },
  historyDuration: { fontSize: 10, color: colors.textTertiary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 38 },
  previewOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  previewOverlayText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
});

export default ClassHistoryScreen;
