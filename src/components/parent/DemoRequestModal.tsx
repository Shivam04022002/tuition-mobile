import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { PrimaryButton } from '../ui';

// ── Props ─────────────────────────────────────────────────────────────────────

interface DemoRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    demoDate: string;
    demoTime: string;
    demoMode: 'online' | 'offline';
    demoNotes?: string;
    message?: string;
    requirementId?: string;
  }) => Promise<void>;
  tutorName: string;
  requirements?: Array<{
    _id: string;
    requirementId?: string;
    studentDetails?: {
      studentName?: string;
      grade?: string;
    };
    subjects?: string[];
  }>;
  isSubmitting?: boolean;
  error?: string | null;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM',
];

// ── Component ─────────────────────────────────────────────────────────────────

const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  visible,
  onClose,
  onSubmit,
  tutorName,
  requirements = [],
  isSubmitting = false,
  error = null,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<'online' | 'offline'>('online');
  const [demoNotes, setDemoNotes] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | undefined>();

  // Generate next 14 days
  const dates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, []);

  const formatDateISO = useCallback((date: Date): string => {
    return date.toISOString().split('T')[0];
  }, []);

  const getDayName = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  }, []);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSelectedDate(null);
      setSelectedTime(null);
      setDemoMode('online');
      setDemoNotes('');
      setMessage('');
      setSelectedRequirementId(undefined);
      onClose();
    }
  }, [onClose, isSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (!selectedDate || !selectedTime) return;

    await onSubmit({
      demoDate: selectedDate,
      demoTime: selectedTime,
      demoMode,
      demoNotes: demoNotes.trim() || undefined,
      message: message.trim() || undefined,
      requirementId: selectedRequirementId,
    });

    // Reset form on success
    setSelectedDate(null);
    setSelectedTime(null);
    setDemoMode('online');
    setDemoNotes('');
    setMessage('');
    setSelectedRequirementId(undefined);
  }, [onSubmit, selectedDate, selectedTime, demoMode, demoNotes, message, selectedRequirementId]);

  const isFormValid = selectedDate && selectedTime;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop} onTouchEnd={handleClose} />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="videocam-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Request Demo Class</Text>
            <Text style={styles.subtitle}>
              Schedule a demo with {tutorName}
            </Text>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Requirements Selection */}
            {requirements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Requirement (Optional)</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.requirementScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.requirementChip,
                      !selectedRequirementId && styles.requirementChipSelected,
                    ]}
                    onPress={() => setSelectedRequirementId(undefined)}
                  >
                    <Text style={[
                      styles.requirementChipText,
                      !selectedRequirementId && styles.requirementChipTextSelected,
                    ]}>
                      General Inquiry
                    </Text>
                  </TouchableOpacity>
                  {requirements.map((req) => (
                    <TouchableOpacity
                      key={req._id}
                      style={[
                        styles.requirementChip,
                        selectedRequirementId === req._id && styles.requirementChipSelected,
                      ]}
                      onPress={() => setSelectedRequirementId(req._id)}
                    >
                      <Text style={[
                        styles.requirementChipText,
                        selectedRequirementId === req._id && styles.requirementChipTextSelected,
                      ]}>
                        {req.studentDetails?.studentName || 'Student'} - {req.studentDetails?.grade || 'N/A'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
              >
                {dates.map((date, index) => {
                  const dateStr = formatDateISO(date);
                  const isSelected = selectedDate === dateStr;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                      onPress={() => setSelectedDate(dateStr)}
                      disabled={isSubmitting}
                    >
                      <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                        {getDayName(date)}
                      </Text>
                      <Text style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.timeItem, isSelected && styles.timeItemSelected]}
                      onPress={() => setSelectedTime(time)}
                      disabled={isSubmitting}
                    >
                      <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Mode Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mode</Text>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeItem, demoMode === 'online' && styles.modeItemSelected]}
                  onPress={() => setDemoMode('online')}
                  disabled={isSubmitting}
                >
                  <Ionicons
                    name="videocam-outline"
                    size={22}
                    color={demoMode === 'online' ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.modeText, demoMode === 'online' && styles.modeTextSelected]}>
                    Online
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeItem, demoMode === 'offline' && styles.modeItemSelected]}
                  onPress={() => setDemoMode('offline')}
                  disabled={isSubmitting}
                >
                  <Ionicons
                    name="home-outline"
                    size={22}
                    color={demoMode === 'offline' ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.modeText, demoMode === 'offline' && styles.modeTextSelected]}>
                    Home Visit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes for Tutor (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={demoNotes}
                onChangeText={setDemoNotes}
                placeholder="Add specific topics or requirements for the demo..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
                editable={!isSubmitting}
              />
            </View>

            {/* Message Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Message (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Any additional information..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                maxLength={500}
                editable={!isSubmitting}
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Summary */}
            {isFormValid && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Demo Summary</Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.summaryText}>
                    {formatDate(new Date(selectedDate))}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.summaryText}>{selectedTime}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons
                    name={demoMode === 'online' ? 'videocam-outline' : 'home-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.summaryText}>
                    {demoMode === 'online' ? 'Online Class' : 'Home Visit'}
                  </Text>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <View style={styles.submitSection}>
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Sending demo request...</Text>
                </View>
              ) : (
                <PrimaryButton
                  label="Send Demo Request"
                  onPress={handleSubmit}
                  variant="primary"
                  disabled={!isFormValid || isSubmitting}
                />
              )}
            </View>

            <View style={styles.bottomSpace} />
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
    maxHeight: '90%',
    ...shadows.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  requirementScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  requirementChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  requirementChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  requirementChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  requirementChipTextSelected: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  dateScroll: {
    paddingRight: 10,
    gap: 10,
  },
  dateItem: {
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  dateTextSelected: {
    color: colors.textWhite,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeItem: {
    width: '22%',
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 13,
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  modeTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  submitSection: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomSpace: {
    height: 32,
  },
});

export default React.memo(DemoRequestModal);
