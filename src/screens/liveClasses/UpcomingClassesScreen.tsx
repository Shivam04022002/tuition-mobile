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

const DAY_TABS = ['Today', 'Tomorrow', 'This Week', 'This Month'];

const UpcomingClassesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);
  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const bellAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 1400, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const bellRotate = bellAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '15deg', '0deg', '-15deg', '0deg'],
  });

  const mockClassSlots = [
    { time: '9:00 AM', subject: 'Mathematics', duration: '60 min' },
    { time: '11:00 AM', subject: 'Science', duration: '45 min' },
    { time: '3:00 PM', subject: 'English', duration: '60 min' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upcoming Classes</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Day Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {DAY_TABS.map((tab, idx) => (
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
            <Animated.View style={[styles.emptyIconOuter, { transform: [{ translateY: bounceAnim }] }]}>
              <View style={styles.emptyIconInner}>
                <Ionicons name="calendar-outline" size={52} color={colors.info} />
              </View>
              <Animated.View style={[styles.bellOverlay, { transform: [{ rotate: bellRotate }] }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.accent} />
              </Animated.View>
            </Animated.View>

            <Text style={styles.emptyTitle}>No Upcoming Classes</Text>
            <Text style={styles.emptySubtitle}>
              Live Classes are under development.{'\n'}
              Your scheduled sessions will appear here once the feature launches.
            </Text>

            <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.82}>
              <Ionicons name="notifications-outline" size={18} color={colors.textWhite} />
              <Text style={styles.notifyBtnText}>Notify Me When Available</Text>
            </TouchableOpacity>
          </View>

          {/* Preview Schedule Skeleton */}
          <Text style={styles.sectionLabel}>PREVIEW — SAMPLE SCHEDULE</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewDateRow}>
              <View style={styles.previewDateBadge}>
                <Text style={styles.previewDateDay}>7</Text>
                <Text style={styles.previewDateMonth}>Jun</Text>
              </View>
              <View>
                <Text style={styles.previewDateLabel}>Saturday</Text>
                <Text style={styles.previewDateSub}>3 scheduled sessions</Text>
              </View>
            </View>
            {mockClassSlots.map((slot, idx) => (
              <React.Fragment key={slot.time}>
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonTimeDot}>
                    <View style={[styles.timeDotInner, { backgroundColor: colors.info }]} />
                    {idx < mockClassSlots.length - 1 && <View style={styles.timeLine} />}
                  </View>
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonBar} />
                    <View style={styles.skeletonBarShort} />
                    <View style={styles.skeletonMeta}>
                      <View style={[styles.skeletonMetaChip, { backgroundColor: colors.info + '15' }]}>
                        <Ionicons name="time-outline" size={11} color={colors.info} />
                        <Text style={[styles.skeletonMetaText, { color: colors.info }]}>{slot.time}</Text>
                      </View>
                      <View style={[styles.skeletonMetaChip, { backgroundColor: colors.success + '15' }]}>
                        <Ionicons name="hourglass-outline" size={11} color={colors.success} />
                        <Text style={[styles.skeletonMetaText, { color: colors.success }]}>{slot.duration}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
            <View style={styles.skeletonOverlay}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.skeletonOverlayText}>Available after live classes launch</Text>
            </View>
          </View>

          {/* How it works preview */}
          <Text style={styles.sectionLabel}>HOW IT WILL WORK</Text>
          <View style={styles.stepsCard}>
            {[
              { step: '1', label: 'Teacher schedules a class', icon: 'create-outline', color: colors.primary },
              { step: '2', label: 'You receive a notification', icon: 'notifications-outline', color: colors.accent },
              { step: '3', label: 'Tap "Join" at class time', icon: 'videocam-outline', color: colors.info },
              { step: '4', label: 'Attend live or watch recording', icon: 'recording-outline', color: colors.success },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.step}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.stepNum}>{item.step}</Text>
                  </View>
                  <View style={[styles.stepIconWrap, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.stepLabel}>{item.label}</Text>
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

  tabsRow: { gap: 8, paddingVertical: 4 },
  tabChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  tabChipActive: { backgroundColor: colors.info, borderColor: colors.info },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.textWhite },

  emptyContainer: { alignItems: 'center', paddingVertical: 16 },
  emptyIconOuter: { position: 'relative', marginBottom: 20 },
  emptyIconInner: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: colors.info + '12', justifyContent: 'center', alignItems: 'center',
  },
  bellOverlay: {
    position: 'absolute', top: -6, right: -6,
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  emptySubtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  notifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.info, paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 16, ...shadows.md,
  },
  notifyBtnText: { fontSize: 15, fontWeight: '700', color: colors.textWhite },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, paddingHorizontal: 4,
  },

  previewCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    ...shadows.card, position: 'relative', overflow: 'hidden',
  },
  previewDateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  previewDateBadge: {
    width: 48, height: 56, borderRadius: 14, backgroundColor: colors.info,
    justifyContent: 'center', alignItems: 'center',
  },
  previewDateDay: { fontSize: 22, fontWeight: '900', color: colors.textWhite },
  previewDateMonth: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  previewDateLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  previewDateSub: { fontSize: 12, color: colors.textSecondary },
  skeletonRow: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  skeletonTimeDot: { alignItems: 'center', width: 16 },
  timeDotInner: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timeLine: { flex: 1, width: 1.5, backgroundColor: colors.border, marginTop: 4, minHeight: 30 },
  skeletonContent: { flex: 1, gap: 6, opacity: 0.55 },
  skeletonBar: { height: 10, borderRadius: 5, backgroundColor: colors.border, width: '75%' },
  skeletonBarShort: { height: 8, borderRadius: 4, backgroundColor: colors.borderLight, width: '45%' },
  skeletonMeta: { flexDirection: 'row', gap: 6 },
  skeletonMetaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  skeletonMetaText: { fontSize: 10, fontWeight: '600' },
  skeletonOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  skeletonOverlayText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },

  stepsCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  stepBadge: {
    width: 22, height: 22, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: 11, fontWeight: '900', color: colors.textWhite },
  stepIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
});

export default UpcomingClassesScreen;
