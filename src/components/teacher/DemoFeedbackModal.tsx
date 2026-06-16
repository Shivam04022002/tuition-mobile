import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { CompleteDemoPayload } from '../../services/contactApi';

type OutcomeType = 'interested' | 'not_interested' | 'need_follow_up';

interface DemoFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CompleteDemoPayload) => Promise<void>;
  isSubmitting: boolean;
}

const OUTCOMES: Array<{ value: OutcomeType; label: string; icon: string; color: string; bg: string }> = [
  { value: 'interested',     label: 'Interested',     icon: 'checkmark-circle-outline', color: '#059669', bg: '#D1FAE5' },
  { value: 'not_interested', label: 'Not Interested',  icon: 'close-circle-outline',    color: '#DC2626', bg: '#FEE2E2' },
  { value: 'need_follow_up', label: 'Need Follow-up',  icon: 'time-outline',            color: '#7C3AED', bg: '#EDE9FE' },
];

const DemoFeedbackModal: React.FC<DemoFeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [outcome, setOutcome] = useState<OutcomeType | null>(null);
  const [notes, setNotes] = useState('');

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setOutcome(null);
      setNotes('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!outcome) {
      Alert.alert('Select Outcome', 'Please select the demo outcome before submitting.');
      return;
    }
    await onSubmit({ outcome, feedbackNotes: notes.trim() || undefined });
    setOutcome(null);
    setNotes('');
  }, [outcome, notes, onSubmit]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Complete Demo</Text>
              <Text style={styles.subtitle}>Select the outcome and add notes</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Outcome Selection */}
            <Text style={styles.sectionLabel}>Demo Outcome *</Text>
            <View style={styles.outcomeGrid}>
              {OUTCOMES.map((o) => {
                const selected = outcome === o.value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      styles.outcomeCard,
                      { borderColor: selected ? o.color : colors.border },
                      selected && { backgroundColor: o.bg },
                    ]}
                    onPress={() => setOutcome(o.value)}
                    disabled={isSubmitting}
                  >
                    <Ionicons
                      name={o.icon as any}
                      size={24}
                      color={selected ? o.color : colors.textSecondary}
                    />
                    <Text style={[
                      styles.outcomeLabel,
                      { color: selected ? o.color : colors.textSecondary },
                    ]}>
                      {o.label}
                    </Text>
                    {selected && (
                      <View style={[styles.selectedDot, { backgroundColor: o.color }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={styles.sectionLabel}>Feedback Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes about this demo session..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
              maxLength={500}
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.submitBtn, !outcome && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting || !outcome}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Mark Complete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    ...shadows.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  outcomeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  outcomeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.background,
    gap: 6,
    position: 'relative',
  },
  outcomeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  selectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 90,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submitBtn: { backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DemoFeedbackModal;
