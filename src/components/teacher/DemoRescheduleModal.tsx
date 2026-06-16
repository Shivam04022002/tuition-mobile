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
import { RescheduleDemoPayload } from '../../services/contactApi';

interface DemoRescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RescheduleDemoPayload) => Promise<void>;
  isSubmitting: boolean;
  currentDate?: string;
  currentTime?: string;
}

const DemoRescheduleModal: React.FC<DemoRescheduleModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  currentDate,
  currentTime,
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setNewDate('');
      setNewTime('');
      setReason('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!newDate.trim()) {
      Alert.alert('Missing Date', 'Please enter the new date (YYYY-MM-DD).');
      return;
    }
    if (!newTime.trim()) {
      Alert.alert('Missing Time', 'Please enter the new time (e.g. 04:00 PM).');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate.trim())) {
      Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format.');
      return;
    }
    await onSubmit({ newDate: newDate.trim(), newTime: newTime.trim(), reason: reason.trim() || undefined });
    setNewDate('');
    setNewTime('');
    setReason('');
  }, [newDate, newTime, reason, onSubmit]);

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
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Reschedule Demo</Text>
              {currentDate && (
                <Text style={styles.subtitle}>
                  Current: {currentDate}{currentTime ? ` · ${currentTime}` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* New Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>New Date *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  editable={!isSubmitting}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* New Time */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>New Time *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="e.g. 04:00 PM"
                  placeholderTextColor={colors.textSecondary}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Reason */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Reason (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Explain why you need to reschedule..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

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
                style={[styles.btn, styles.submitBtn]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Reschedule</Text>
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
    backgroundColor: colors.accent + '15',
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
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
  submitBtn: { backgroundColor: colors.accent },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DemoRescheduleModal;
