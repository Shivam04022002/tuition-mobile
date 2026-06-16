import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { scheduleDemo, type ScheduleDemoPayload } from '../../services/applicationApi';
import { PrimaryButton } from '../../components/ui';

interface RouteParams {
  applicationId: string;
  tutorName: string;
  onComplete?: () => void;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM',
];

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
];

const DemoSchedulingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { applicationId, tutorName, onComplete } = route.params as RouteParams;
  const token = useAppSelector(selectAuthToken);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [mode, setMode] = useState<'online' | 'offline'>('online');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next 14 days
  const generateDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const dates = generateDates();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDateISO = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select both date and time');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ScheduleDemoPayload = {
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        duration: selectedDuration,
        mode,
        notes: notes.trim() || undefined,
      };

      await scheduleDemo(token, applicationId, payload);
      Alert.alert(
        'Demo Scheduled',
        `Demo has been scheduled with ${tutorName} on ${formatDate(new Date(selectedDate))} at ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onComplete?.();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to schedule demo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDate, selectedTime, selectedDuration, mode, notes, token, applicationId, tutorName, onComplete, navigation]);

  const isFormValid = selectedDate && selectedTime;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Demo</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Tutor Info */}
        <View style={styles.tutorCard}>
          <Ionicons name="person-circle" size={48} color={colors.primary} />
          <View style={styles.tutorInfo}>
            <Text style={styles.tutorName}>{tutorName}</Text>
            <Text style={styles.tutorLabel}>Schedule a demo class</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((date, index) => {
              const dateStr = formatDateISO(date);
              const isSelected = selectedDate === dateStr;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => setSelectedDate(dateStr)}
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
                >
                  <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((dur) => {
              const isSelected = selectedDuration === dur.value;
              return (
                <TouchableOpacity
                  key={dur.value}
                  style={[styles.durationItem, isSelected && styles.durationItemSelected]}
                  onPress={() => setSelectedDuration(dur.value)}
                >
                  <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                    {dur.label}
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
              style={[styles.modeItem, mode === 'online' && styles.modeItemSelected]}
              onPress={() => setMode('online')}
            >
              <Ionicons
                name="videocam-outline"
                size={24}
                color={mode === 'online' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.modeText, mode === 'online' && styles.modeTextSelected]}>
                Online
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeItem, mode === 'offline' && styles.modeItemSelected]}
              onPress={() => setMode('offline')}
            >
              <Ionicons
                name="home-outline"
                size={24}
                color={mode === 'offline' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.modeText, mode === 'offline' && styles.modeTextSelected]}>
                Home Visit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any specific topics or requirements..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        {isFormValid && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Demo Summary</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.summaryText}>
                {formatDate(new Date(selectedDate))}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.summaryText}>{selectedTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="timer-outline" size={18} color={colors.primary} />
              <Text style={styles.summaryText}>
                {DURATIONS.find(d => d.value === selectedDuration)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons
                name={mode === 'online' ? 'videocam-outline' : 'home-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.summaryText}>
                {mode === 'online' ? 'Online Class' : 'Home Visit'}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Scheduling demo...</Text>
            </View>
          ) : (
            <PrimaryButton
              label="Confirm & Schedule Demo"
              onPress={handleSubmit}
              variant="primary"
              disabled={!isFormValid}
              style={isFormValid ? undefined : styles.submitButtonDisabled}
            />
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...shadows.card,
  },
  tutorInfo: {
    marginLeft: 12,
  },
  tutorName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  tutorLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  dateScroll: {
    flexDirection: 'row',
  },
  dateItem: {
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginRight: 10,
    ...shadows.card,
  },
  dateItemSelected: {
    backgroundColor: colors.primary,
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
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeItem: {
    width: '22%',
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.card,
  },
  timeItemSelected: {
    backgroundColor: colors.primary,
  },
  timeText: {
    fontSize: 13,
    color: colors.text,
  },
  timeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationItem: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.card,
  },
  durationItemSelected: {
    backgroundColor: colors.primary,
  },
  durationText: {
    fontSize: 14,
    color: colors.text,
  },
  durationTextSelected: {
    color: '#FFFFFF',
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
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    gap: 8,
    ...shadows.card,
  },
  modeItemSelected: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  submitSection: {
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
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

export default DemoSchedulingScreen;
