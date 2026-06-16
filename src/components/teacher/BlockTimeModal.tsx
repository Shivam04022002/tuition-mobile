import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

// ── Types ────────────────────────────────────────────────────────────────────

interface BlockTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    startTime?: string;
    endTime?: string;
    isFullDay: boolean;
    reason: string;
    reasonType: 'vacation' | 'exam' | 'personal' | 'medical' | 'other';
    isRecurring: boolean;
    recurringDays?: string[];
  }) => Promise<void>;
  isSubmitting: boolean;
  initialDate?: string;
}

type ReasonType = 'vacation' | 'exam' | 'personal' | 'medical' | 'other';

const REASON_TYPES: Array<{ value: ReasonType; label: string; icon: string }> = [
  { value: 'vacation', label: 'Vacation', icon: 'airplane-outline' },
  { value: 'exam', label: 'Exam', icon: 'school-outline' },
  { value: 'personal', label: 'Personal Work', icon: 'person-outline' },
  { value: 'medical', label: 'Medical', icon: 'medical-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Helper Functions ───────────────────────────────────────────────────────

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isValidTime = (time: string): boolean => {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

// ── Component ────────────────────────────────────────────────────────────────

export const BlockTimeModal: React.FC<BlockTimeModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  initialDate,
}) => {
  const [date, setDate] = useState(initialDate || formatDateForInput(new Date()));
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');
  const [reasonType, setReasonType] = useState<ReasonType>('other');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setDate(initialDate || formatDateForInput(new Date()));
    setIsFullDay(true);
    setStartTime('09:00');
    setEndTime('17:00');
    setReason('');
    setReasonType('other');
    setIsRecurring(false);
    setRecurringDays([]);
    setErrors({});
  }, [initialDate]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  }, [isSubmitting, onClose, resetForm]);

  const toggleRecurringDay = useCallback((day: string) => {
    setRecurringDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!isFullDay) {
      if (!startTime || !isValidTime(startTime)) {
        newErrors.startTime = 'Valid start time required (HH:MM)';
      }
      if (!endTime || !isValidTime(endTime)) {
        newErrors.endTime = 'Valid end time required (HH:MM)';
      }
      if (startTime && endTime && isValidTime(startTime) && isValidTime(endTime)) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        if (eh * 60 + em <= sh * 60 + sm) {
          newErrors.endTime = 'End time must be after start time';
        }
      }
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (isRecurring && recurringDays.length === 0) {
      newErrors.recurringDays = 'Select at least one day for recurring block';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [date, isFullDay, startTime, endTime, reason, isRecurring, recurringDays]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      await onSubmit({
        date,
        startTime: isFullDay ? undefined : startTime,
        endTime: isFullDay ? undefined : endTime,
        isFullDay,
        reason: reason.trim(),
        reasonType,
        isRecurring,
        recurringDays: isRecurring ? recurringDays : undefined,
      });
      
      resetForm();
    } catch (err) {
      Alert.alert('Error', 'Failed to block time. Please try again.');
    }
  }, [date, isFullDay, startTime, endTime, reason, reasonType, isRecurring, recurringDays, onSubmit, validate, resetForm]);

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
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Block Time</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Reason Type Selection */}
            <Text style={styles.sectionLabel}>Reason Type</Text>
            <View style={styles.reasonTypeGrid}>
              {REASON_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.reasonTypeBtn,
                    reasonType === type.value && styles.reasonTypeBtnActive,
                  ]}
                  onPress={() => setReasonType(type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={reasonType === type.value ? '#fff' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.reasonTypeText,
                      reasonType === type.value && styles.reasonTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Input */}
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={[styles.inputRow, errors.date && styles.inputError]}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
              />
            </View>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

            {/* Full Day Toggle */}
            <View style={styles.fullDayRow}>
              <View style={styles.fullDayInfo}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.fullDayLabel}>Full Day</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, isFullDay && styles.toggleActive]}
                onPress={() => setIsFullDay(!isFullDay)}
              >
                <View style={[styles.toggleThumb, isFullDay && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            {/* Time Range (only if not full day) */}
            {!isFullDay && (
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <View style={[styles.timeInput, errors.startTime && styles.inputError]}>
                    <TextInput
                      style={styles.timeInputText}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="09:00"
                      placeholderTextColor={colors.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                  {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
                </View>

                <View style={styles.timeSeparator}>
                  <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                </View>

                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <View style={[styles.timeInput, errors.endTime && styles.inputError]}>
                    <TextInput
                      style={styles.timeInputText}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="17:00"
                      placeholderTextColor={colors.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                  {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
                </View>
              </View>
            )}

            {/* Recurring Toggle */}
            <View style={styles.fullDayRow}>
              <View style={styles.fullDayInfo}>
                <Ionicons name="repeat-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.fullDayLabel}>Recurring Weekly</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, isRecurring && styles.toggleActive]}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            {/* Recurring Days (only if recurring) */}
            {isRecurring && (
              <View style={styles.daysContainer}>
                <Text style={styles.daysLabel}>Select Days</Text>
                <View style={styles.daysGrid}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        recurringDays.includes(day) && styles.dayChipActive,
                      ]}
                      onPress={() => toggleRecurringDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          recurringDays.includes(day) && styles.dayChipTextActive,
                        ]}
                      >
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.recurringDays && <Text style={styles.errorText}>{errors.recurringDays}</Text>}
              </View>
            )}

            {/* Reason Input */}
            <Text style={styles.sectionLabel}>Reason (optional)</Text>
            <View style={[styles.textAreaContainer, errors.reason && styles.inputError]}>
              <TextInput
                style={styles.textArea}
                value={reason}
                onChangeText={setReason}
                placeholder="Add a reason or note..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
            {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitBtnText}>Blocking...</Text>
              ) : (
                <>
                  <Ionicons name="ban-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Block Time</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  reasonTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  reasonTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reasonTypeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reasonTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginLeft: 10,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 12,
  },
  fullDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  fullDayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullDayLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...shadows.xs,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  timeInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeInputText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  timeSeparator: {
    paddingTop: 26,
  },
  daysContainer: {
    marginBottom: 16,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dayChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  textAreaContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 4,
  },
  textArea: {
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BlockTimeModal;
