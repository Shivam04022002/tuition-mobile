import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface WalletComingSoonCardProps {
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  progress?: number;
  eta?: string;
}

const WalletComingSoonCard: React.FC<WalletComingSoonCardProps> = ({
  title,
  description,
  icon,
  iconColor = colors.primary,
  progress = 75,
  eta = 'Q4 2026',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2200, useNativeDriver: false })
    ).start();
  }, []);

  const shimmerWidth = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${progress}%`],
  });

  return (
    <View style={styles.card}>
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blob1, { backgroundColor: iconColor + '12' }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: colors.accent + '10' }]} />

      {/* Icon + Title */}
      <View style={styles.topRow}>
        <Animated.View style={[
          styles.iconWrap,
          { backgroundColor: iconColor + '18', transform: [{ scale: pulseAnim }] },
        ]}>
          <Ionicons name={icon as any} size={28} color={iconColor} />
        </Animated.View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>🚀 Coming Soon</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Wallet Development</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: shimmerWidth, backgroundColor: iconColor },
            ]}
          />
        </View>
        <View style={styles.etaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.etaText}>ETA: {eta}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  blob: { position: 'absolute', borderRadius: 100 },
  blob1: { width: 140, height: 140, top: -40, right: -30 },
  blob2: { width: 100, height: 100, bottom: -20, left: -20 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 6 },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  comingSoonText: { fontSize: 12, fontWeight: '700', color: colors.accent },

  description: {
    fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 18,
  },

  progressSection: {},
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  progressValue: { fontSize: 13, fontWeight: '800', color: colors.primary },
  progressTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: colors.backgroundTertiary, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etaText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
});

export default WalletComingSoonCard;
