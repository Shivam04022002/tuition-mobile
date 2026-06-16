import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface RouteParams {
  title?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  eta?: string;
}

const ComingSoonScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const params: RouteParams = route.params ?? {};
  const title = params.title ?? 'Coming Soon';
  const subtitle = params.subtitle ?? 'This feature is currently under development.';
  const icon = params.icon ?? 'rocket-outline';
  const iconColor = params.iconColor ?? colors.primary;
  const eta = params.eta ?? 'Q3 2025';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const features = [
    { icon: 'shield-checkmark-outline', label: 'Secure & Private' },
    { icon: 'flash-outline', label: 'Lightning Fast' },
    { icon: 'star-outline', label: 'Premium Quality' },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Illustration Card */}
        <View style={styles.illustrationCard}>
          {/* Background blobs */}
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />

          {/* Floating icon */}
          <Animated.View style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] },
          ]}>
            <View style={[styles.iconRing, { borderColor: iconColor + '30' }]}>
              <View style={[styles.iconInner, { backgroundColor: iconColor + '18' }]}>
                <Ionicons name={icon as any} size={56} color={iconColor} />
              </View>
            </View>
          </Animated.View>

          {/* Emoji rocket */}
          <Text style={styles.rocket}>🚀</Text>
        </View>

        {/* Text Content */}
        <View style={styles.textBlock}>
          <Text style={styles.mainTitle}>{title}</Text>
          <Text style={styles.mainSubtitle}>{subtitle}</Text>

          {/* ETA Badge */}
          <View style={styles.etaRow}>
            <View style={styles.etaBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent} />
              <Text style={styles.etaText}>Expected: {eta}</Text>
            </View>
          </View>
        </View>

        {/* Feature Preview Cards */}
        <View style={styles.featureRow}>
          {features.map(feat => (
            <View key={feat.label} style={styles.featureCard}>
              <Ionicons name={feat.icon as any} size={22} color={colors.primary} />
              <Text style={styles.featureLabel}>{feat.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Development Progress</Text>
            <Text style={styles.progressValue}>65%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressDesc}>Core features in development</Text>
        </View>

        {/* Notify Me */}
        <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.82}>
          <Ionicons name="notifications-outline" size={18} color={colors.textWhite} />
          <Text style={styles.notifyBtnText}>Notify Me When Available</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Go Back</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
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

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  illustrationCard: {
    backgroundColor: colors.card, borderRadius: 28, height: 200,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 24, ...shadows.card,
    position: 'relative',
  },
  blob: {
    position: 'absolute', borderRadius: 100,
  },
  blob1: {
    width: 160, height: 160, top: -40, right: -40,
    backgroundColor: colors.primary + '10',
  },
  blob2: {
    width: 120, height: 120, bottom: -30, left: -20,
    backgroundColor: colors.accent + '10',
  },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  iconRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  iconInner: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  rocket: {
    position: 'absolute', bottom: 16, right: 20, fontSize: 28,
  },

  textBlock: { alignItems: 'center', marginBottom: 24 },
  mainTitle: {
    fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5, marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 14,
  },
  etaRow: { alignItems: 'center' },
  etaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent + '18',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  etaText: { fontSize: 13, fontWeight: '700', color: colors.accent },

  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  featureCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 8, ...shadows.sm,
  },
  featureLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },

  progressCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    marginBottom: 20, ...shadows.card,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  progressValue: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.backgroundTertiary, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', borderRadius: 4, backgroundColor: colors.primary,
  },
  progressDesc: { fontSize: 12, color: colors.textTertiary },

  notifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16,
    marginBottom: 14, ...shadows.md,
  },
  notifyBtnText: { fontSize: 16, fontWeight: '700', color: colors.textWhite },

  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
});

export default ComingSoonScreen;
