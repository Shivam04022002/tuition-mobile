import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface LiveClassComingSoonCardProps {
  title: string;
  description: string;
  features: string[];
  eta?: string;
  progress?: number;
  iconColor?: string;
}

const FEATURE_ICONS: Record<string, string> = {
  'HD Video Classes': 'videocam-outline',
  'Interactive Whiteboard': 'color-palette-outline',
  'Attendance Tracking': 'checkmark-done-outline',
  'Class Recordings': 'recording-outline',
  'Study Materials': 'document-text-outline',
  'Homework Sharing': 'share-outline',
  'Create Class': 'add-circle-outline',
  'Upload Materials': 'cloud-upload-outline',
  'Attendance Management': 'people-outline',
  'Recording Library': 'library-outline',
  'Student Engagement': 'star-outline',
};

const LiveClassComingSoonCard: React.FC<LiveClassComingSoonCardProps> = ({
  title,
  description,
  features,
  eta = 'Q1 2027',
  progress = 80,
  iconColor = colors.info,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1300, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 1600,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* BG blobs */}
      <View style={[styles.blob, styles.blob1, { backgroundColor: iconColor + '10' }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: colors.accent + '08' }]} />

      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={[
          styles.iconWrap,
          { backgroundColor: iconColor + '18', transform: [{ scale: pulseAnim }] },
        ]}>
          <Ionicons name="videocam-outline" size={30} color={iconColor} />
          <View style={[styles.iconBadge, { backgroundColor: iconColor }]}>
            <Text style={styles.iconBadgeText}>Soon</Text>
          </View>
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusEmoji}>🚀</Text>
            <Text style={styles.statusText}>Under Development</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Features grid */}
      <View style={styles.featuresLabel}>
        <Ionicons name="sparkles-outline" size={13} color={iconColor} />
        <Text style={[styles.featuresSectionLabel, { color: iconColor }]}>Features arriving soon</Text>
      </View>
      <View style={styles.featuresGrid}>
        {features.map(feat => (
          <View key={feat} style={[styles.featureChip, { borderColor: iconColor + '30' }]}>
            <Ionicons
              name={(FEATURE_ICONS[feat] ?? 'checkmark-circle-outline') as any}
              size={14}
              color={iconColor}
            />
            <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Development Progress</Text>
          <Text style={[styles.progressValue, { color: iconColor }]}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: fillWidth, backgroundColor: iconColor }]}
          />
        </View>
        <View style={styles.etaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.etaText}>Estimated Release: {eta}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24, padding: 20,
    overflow: 'hidden', position: 'relative',
    ...shadows.card,
  },
  blob: { position: 'absolute', borderRadius: 100 },
  blob1: { width: 160, height: 160, top: -50, right: -40 },
  blob2: { width: 110, height: 110, bottom: -30, left: -20 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  iconWrap: {
    width: 62, height: 62, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute', bottom: -4, right: -4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  iconBadgeText: { fontSize: 8, fontWeight: '900', color: colors.textWhite },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusEmoji: { fontSize: 13 },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  description: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },

  featuresLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  featuresSectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
  },
  featureText: { fontSize: 12, fontWeight: '500' },

  progressSection: {},
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  progressValue: { fontSize: 13, fontWeight: '800' },
  progressTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: colors.backgroundTertiary, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etaText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
});

export default LiveClassComingSoonCard;
