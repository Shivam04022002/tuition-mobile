import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

type VerificationStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

interface VerificationStatusCardProps {
  status: VerificationStatus;
  rejectionReason?: string;
}

interface StatusConfig {
  icon: string;
  color: string;
  bg: string;
  title: string;
  description: string;
  steps: Array<{ label: string; done: boolean }>;
}

const STATUS_CONFIG: Record<VerificationStatus, StatusConfig> = {
  pending: {
    icon: 'time-outline',
    color: colors.accent,
    bg: colors.accent + '15',
    title: 'Verification Pending',
    description: 'Complete your profile and upload required documents to begin verification.',
    steps: [
      { label: 'Profile Submitted', done: false },
      { label: 'Documents Reviewed', done: false },
      { label: 'Background Check', done: false },
      { label: 'Verified ✓', done: false },
    ],
  },
  submitted: {
    icon: 'hourglass-outline',
    color: colors.info,
    bg: colors.info + '15',
    title: 'Under Review',
    description: 'Your documents are being reviewed by our team. This usually takes 24-48 hours.',
    steps: [
      { label: 'Profile Submitted', done: true },
      { label: 'Documents Reviewed', done: false },
      { label: 'Background Check', done: false },
      { label: 'Verified ✓', done: false },
    ],
  },
  verified: {
    icon: 'shield-checkmark',
    color: colors.success,
    bg: colors.success + '15',
    title: 'Verified Teacher',
    description: 'Your profile is verified. You can now apply to parent requirements and get matched.',
    steps: [
      { label: 'Profile Submitted', done: true },
      { label: 'Documents Reviewed', done: true },
      { label: 'Background Check', done: true },
      { label: 'Verified ✓', done: true },
    ],
  },
  rejected: {
    icon: 'close-circle-outline',
    color: colors.error,
    bg: colors.error + '15',
    title: 'Verification Rejected',
    description: 'Your verification was not approved. Please review the reason and resubmit.',
    steps: [
      { label: 'Profile Submitted', done: true },
      { label: 'Documents Reviewed', done: true },
      { label: 'Verification Failed', done: false },
      { label: 'Resubmit Required', done: false },
    ],
  },
};

const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  status,
  rejectionReason,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  useEffect(() => {
    if (status === 'submitted') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [status, pulseAnim]);

  const completedSteps = config.steps.filter(s => s.done).length;

  return (
    <View style={[styles.card, shadows.sm]}>
      {/* Icon + title */}
      <View style={styles.headerRow}>
        <Animated.View
          style={[
            styles.iconBox,
            { backgroundColor: config.bg, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Ionicons name={config.icon as any} size={28} color={config.color} />
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>Verification Status</Text>
          <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.color }]}>
          <Text style={[styles.statusBadgeText, { color: config.color }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{config.description}</Text>

      {/* Rejection reason */}
      {status === 'rejected' && rejectionReason && (
        <View style={[styles.rejectionBox, { backgroundColor: colors.error + '10', borderColor: colors.error + '40' }]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={[styles.rejectionText, { color: colors.error }]}>
            Reason: {rejectionReason}
          </Text>
        </View>
      )}

      {/* Progress steps */}
      <View style={styles.stepsRow}>
        {config.steps.map((step, index) => {
          const isActive = index === completedSteps && completedSteps < config.steps.length;
          return (
            <View key={step.label} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                {
                  backgroundColor: step.done
                    ? config.color
                    : isActive
                      ? config.color + '40'
                      : colors.border,
                  borderColor: step.done || isActive ? config.color : colors.border,
                },
              ]}>
                {step.done && (
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                )}
              </View>
              {index < config.steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  { backgroundColor: step.done ? config.color : colors.border },
                ]} />
              )}
              <Text style={[
                styles.stepLabel,
                {
                  color: step.done ? config.color : isActive ? colors.textSecondary : colors.textTertiary,
                  fontWeight: step.done || isActive ? '600' : '400',
                },
              ]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ETA hint for submitted */}
      {status === 'submitted' && (
        <View style={styles.etaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.etaText}>Expected: 24-48 hours</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  rejectionText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    zIndex: 1,
  },
  stepLine: {
    position: 'absolute',
    top: 10,
    left: '60%',
    right: '-60%',
    height: 2,
    zIndex: 0,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  etaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default VerificationStatusCard;
