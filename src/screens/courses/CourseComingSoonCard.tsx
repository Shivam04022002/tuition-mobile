import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface CourseComingSoonCardProps {
  title: string;
  subtitle: string;
  features: string[];
  progress?: number;
  eta?: string;
  accentColor?: string;
}

const FEATURE_ICONS: Record<string, string> = {
  'Create Course': 'add-circle-outline',
  'Upload Lessons': 'cloud-upload-outline',
  'Student Analytics': 'bar-chart-outline',
  'Course Revenue': 'cash-outline',
  'Certificates': 'ribbon-outline',
  'Course Moderation': 'shield-checkmark-outline',
  'Instructor Verification': 'checkmark-badge-outline',
  'Revenue Sharing': 'git-branch-outline',
  'Certification Engine': 'trophy-outline',
  'HD Video Lessons': 'videocam-outline',
  'Live Q&A Sessions': 'chatbubbles-outline',
  'Progress Tracking': 'trending-up-outline',
  'Downloadable Notes': 'document-text-outline',
  'Mock Tests': 'clipboard-outline',
  'Doubt Resolution': 'help-circle-outline',
  'Course Recordings': 'recording-outline',
  'Peer Discussion': 'people-outline',
};

const CourseComingSoonCard: React.FC<CourseComingSoonCardProps> = ({
  title,
  subtitle,
  features,
  progress = 85,
  eta = 'Q2 2027',
  accentColor = colors.secondary,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 1800,
      delay: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={[styles.blob1, { backgroundColor: accentColor + '10' }]} />
      <View style={[styles.blob2, { backgroundColor: colors.accent + '08' }]} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Animated.View style={[
          styles.iconWrap,
          { backgroundColor: accentColor + '18', transform: [{ scale: pulseAnim }, { translateY: floatAnim }] },
        ]}>
          <Ionicons name="school-outline" size={30} color={accentColor} />
          <View style={[styles.iconBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.iconBadgeText}>Soon</Text>
          </View>
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusEmoji}>🚀</Text>
            <Text style={styles.statusText}>Marketplace Under Development</Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresHeader}>
        <Ionicons name="sparkles-outline" size={13} color={accentColor} />
        <Text style={[styles.featuresLabel, { color: accentColor }]}>Features arriving soon</Text>
      </View>
      <View style={styles.featuresGrid}>
        {features.map(feat => (
          <View key={feat} style={[styles.featureChip, { borderColor: accentColor + '30' }]}>
            <Ionicons
              name={(FEATURE_ICONS[feat] ?? 'checkmark-circle-outline') as any}
              size={13}
              color={accentColor}
            />
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Development Progress</Text>
          <Text style={[styles.progressValue, { color: accentColor }]}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[
            styles.progressFill,
            { width: fillWidth, backgroundColor: accentColor },
          ]} />
        </View>
        <View style={styles.etaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.etaText}>ETA: {eta}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 24, padding: 20,
    overflow: 'hidden', position: 'relative', ...shadows.card,
  },
  blob1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, top: -45, right: -35 },
  blob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, bottom: -25, left: -20 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  iconBadge: {
    position: 'absolute', bottom: -4, right: -4,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
  iconBadgeText: { fontSize: 8, fontWeight: '900', color: colors.textWhite },
  headerText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 3 },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusEmoji: { fontSize: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  featuresHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  featuresLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1,
  },
  featureText: { fontSize: 11, fontWeight: '500', color: colors.text },

  progressSection: {},
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  progressValue: { fontSize: 13, fontWeight: '800' },
  progressTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: colors.backgroundTertiary, overflow: 'hidden', marginBottom: 5,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etaText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
});

export default CourseComingSoonCard;
