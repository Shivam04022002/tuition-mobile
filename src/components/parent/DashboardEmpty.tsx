import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

export type DashboardEmptySection =
  | 'requirements'
  | 'applications'
  | 'recommended'
  | 'demos';

interface DashboardEmptyProps {
  section: DashboardEmptySection;
  ctaLabel?: string;
  onCta?: () => void;
}

const EMPTY_CONFIG: Record<
  DashboardEmptySection,
  { icon: string; title: string; description: string; defaultCta: string; iconColor: string }
> = {
  requirements: {
    icon: 'document-text-outline',
    title: 'No Requirements Yet',
    description: 'Post your first tuition requirement and get matched with qualified tutors instantly.',
    defaultCta: 'Post Requirement',
    iconColor: colors.primary,
  },
  applications: {
    icon: 'people-outline',
    title: 'No Applications Yet',
    description: 'Once you post a requirement, tutors will start applying. Check back soon!',
    defaultCta: 'Post Requirement',
    iconColor: colors.secondary,
  },
  recommended: {
    icon: 'star-outline',
    title: 'No Recommendations Yet',
    description: 'Complete your profile to unlock personalised tutor recommendations.',
    defaultCta: 'Complete Profile',
    iconColor: colors.accent,
  },
  demos: {
    icon: 'videocam-outline',
    title: 'No Demo Classes',
    description: 'Shortlist a tutor and schedule a free demo class to see if they are a great fit.',
    defaultCta: 'Find Tutors',
    iconColor: colors.info,
  },
};

const DashboardEmpty: React.FC<DashboardEmptyProps> = memo(({
  section,
  ctaLabel,
  onCta,
}) => {
  const config = EMPTY_CONFIG[section];
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [floatAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconWrap, { backgroundColor: config.iconColor + '12', transform: [{ translateY: floatAnim }] }]}
      >
        <Ionicons name={config.icon as any} size={36} color={config.iconColor} />
      </Animated.View>

      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.description}>{config.description}</Text>

      {onCta ? (
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: config.iconColor }]} onPress={onCta} activeOpacity={0.82}>
          <Text style={styles.ctaLabel}>{ctaLabel || config.defaultCta}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

DashboardEmpty.displayName = 'DashboardEmpty';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 12,
    ...shadows.card,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default DashboardEmpty;
