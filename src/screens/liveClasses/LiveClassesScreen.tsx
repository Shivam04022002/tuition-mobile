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
import LiveClassComingSoonCard from './LiveClassComingSoonCard';

const { width } = Dimensions.get('window');

interface RouteParams {
  role?: 'parent' | 'teacher';
}

const PARENT_FEATURES = [
  'HD Video Classes',
  'Interactive Whiteboard',
  'Attendance Tracking',
  'Class Recordings',
  'Study Materials',
  'Homework Sharing',
];

const TEACHER_FEATURES = [
  'HD Video Classes',
  'Interactive Whiteboard',
  'Create Class',
  'Upload Materials',
  'Attendance Management',
  'Recording Library',
  'Class Recordings',
  'Student Engagement',
];

const PLATFORM_HIGHLIGHTS = [
  { icon: 'videocam-outline', label: 'HD Video', color: colors.info, desc: '1080p live streaming' },
  { icon: 'color-palette-outline', label: 'Whiteboard', color: colors.secondary, desc: 'Real-time collaboration' },
  { icon: 'recording-outline', label: 'Recordings', color: colors.accent, desc: 'Re-watch anytime' },
  { icon: 'shield-checkmark-outline', label: 'Secure', color: colors.success, desc: 'End-to-end encrypted' },
  { icon: 'people-outline', label: 'Groups', color: colors.primary, desc: 'Up to 50 students' },
  { icon: 'document-text-outline', label: 'Materials', color: colors.pink, desc: 'Share files instantly' },
];

const LiveClassesScreen: React.FC = () => {
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

  const features = role === 'teacher' ? TEACHER_FEATURES : PARENT_FEATURES;

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Classes</Text>
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => navigation.navigate('UpcomingClasses', { role })}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBannerBlob1} />
            <View style={styles.heroBannerBlob2} />
            <View style={styles.heroBannerLeft}>
              <Text style={styles.heroBannerLabel}>Coming Soon</Text>
              <Text style={styles.heroBannerTitle}>Attend Classes{'\n'}Directly In-App</Text>
              <Text style={styles.heroBannerDesc}>
                Live, interactive, and recorded classes — no third-party apps needed.
              </Text>
              <TouchableOpacity
                style={styles.heroCta}
                onPress={() => navigation.navigate('UpcomingClasses', { role })}
              >
                <Text style={styles.heroCtaText}>View Schedule</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroBannerRight}>
              <View style={styles.heroVideoCard}>
                <Ionicons name="videocam" size={32} color={colors.textWhite} />
                <View style={styles.heroLiveDot} />
              </View>
            </View>
          </View>

          {/* Coming Soon Feature Card */}
          <LiveClassComingSoonCard
            title="Live Classes"
            description="Attend classes directly from the Tuition app. No Zoom. No Google Meet. A fully integrated classroom experience built for tutors and students."
            features={features}
            eta="Q1 2027"
            progress={80}
            iconColor={colors.info}
          />

          {/* Platform Highlights */}
          <Text style={styles.sectionLabel}>PLATFORM HIGHLIGHTS</Text>
          <View style={styles.highlightsGrid}>
            {PLATFORM_HIGHLIGHTS.map(h => (
              <View key={h.label} style={[styles.highlightCard, { width: (width - 32 - 10) / 3 }]}>
                <View style={[styles.highlightIcon, { backgroundColor: h.color + '18' }]}>
                  <Ionicons name={h.icon as any} size={22} color={h.color} />
                </View>
                <Text style={styles.highlightLabel}>{h.label}</Text>
                <Text style={styles.highlightDesc}>{h.desc}</Text>
              </View>
            ))}
          </View>

          {/* Quick nav cards */}
          <Text style={styles.sectionLabel}>EXPLORE</Text>
          <View style={styles.navCards}>
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => navigation.navigate('UpcomingClasses', { role })}
              activeOpacity={0.8}
            >
              <View style={[styles.navCardIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>Upcoming Classes</Text>
                <Text style={styles.navCardSubtitle}>Your scheduled sessions</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => navigation.navigate('ClassHistory', { role })}
              activeOpacity={0.8}
            >
              <View style={[styles.navCardIcon, { backgroundColor: colors.accent + '18' }]}>
                <Ionicons name="time-outline" size={24} color={colors.accent} />
              </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>Class History</Text>
                <Text style={styles.navCardSubtitle}>Past recordings & sessions</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Integration note */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
            <Text style={styles.noteText}>
              Live classes will use WebRTC-based peer-to-peer video. No external meeting platforms required.
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
    backgroundColor: colors.info,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  calendarBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  // Hero Banner
  heroBanner: {
    borderRadius: 24, padding: 20,
    backgroundColor: colors.info,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', position: 'relative',
    ...shadows.lg,
  },
  heroBannerBlob1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    top: -40, right: -30, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBannerBlob2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    bottom: -20, left: 60, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroBannerLeft: { flex: 1 },
  heroBannerLabel: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.70)',
    letterSpacing: 1.4, marginBottom: 6, textTransform: 'uppercase',
  },
  heroBannerTitle: {
    fontSize: 20, fontWeight: '900', color: colors.textWhite,
    letterSpacing: -0.4, marginBottom: 8, lineHeight: 26,
  },
  heroBannerDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.70)', lineHeight: 17, marginBottom: 14,
  },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: colors.textWhite, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  heroCtaText: { fontSize: 12, fontWeight: '800', color: colors.info },
  heroBannerRight: { marginLeft: 16 },
  heroVideoCard: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  heroLiveDot: {
    position: 'absolute', top: 8, right: 8,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5, borderColor: colors.textWhite,
  },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, paddingHorizontal: 4,
  },

  highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlightCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 6, ...shadows.sm,
  },
  highlightIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  highlightLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  highlightDesc: { fontSize: 10, color: colors.textTertiary, textAlign: 'center' },

  navCards: { gap: 10 },
  navCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, ...shadows.card,
  },
  navCardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  navCardText: { flex: 1 },
  navCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  navCardSubtitle: { fontSize: 12, color: colors.textSecondary },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight, padding: 14, borderRadius: 14,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19, fontWeight: '500' },
});

export default LiveClassesScreen;
