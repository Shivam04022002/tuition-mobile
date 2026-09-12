import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { PrimaryButton } from '../ui';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SubscriptionRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
// Paywall shown when a parent without an active subscription taps a locked
// "Contact" action. Mirrors ContactRequestModal's construction (bottom sheet
// via RN's built-in Modal, theme colors/shadows, PrimaryButton).

const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = ({
  visible,
  onClose,
  onUpgrade,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop} onTouchEnd={onClose} />

        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Subscription Required</Text>
            <Text style={styles.subtitle}>
              Contact tutors directly with an active subscription. Unlock tutor
              communication and start your learning journey.
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="View Subscription Plans"
              onPress={onUpgrade}
              variant="primary"
              size="lg"
              fullWidth
            />
            <PrimaryButton
              label="Maybe Later"
              onPress={onClose}
              variant="ghost"
              size="md"
              fullWidth
              style={styles.laterButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 4,
    gap: 8,
  },
  laterButton: {
    marginTop: 0,
  },
});

export default SubscriptionRequiredModal;
