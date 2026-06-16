import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface TutorAvailabilityProps {
  availableDays: string[];
  availableTimeSlots: string[];
  city: string;
  area?: string;
  teachingModes: string[];
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOT_MAP: Record<string, { label: string; icon: string }> = {
  morning: { label: 'Morning', icon: 'sunny-outline' },
  afternoon: { label: 'Afternoon', icon: 'partly-sunny-outline' },
  evening: { label: 'Evening', icon: 'moon-outline' },
};

const MODE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  online: { label: 'Online', icon: 'videocam-outline', color: colors.info },
  student_home: { label: 'Home Visit', icon: 'home-outline', color: colors.success },
  own_home: { label: 'At Institute', icon: 'business-outline', color: colors.accent },
  group: { label: 'Group', icon: 'people-outline', color: colors.secondary },
};

const TutorAvailability: React.FC<TutorAvailabilityProps> = ({
  availableDays,
  availableTimeSlots,
  city,
  area,
  teachingModes,
}) => {
  const daysNormalized = availableDays.map((d) => d.toLowerCase());

  return (
    <View style={styles.container}>
      {/* Teaching Modes */}
      <Text style={styles.sectionTitle}>Teaching Modes</Text>
      <View style={styles.modesRow}>
        {teachingModes.map((mode) => {
          const config = MODE_MAP[mode] || { label: mode, icon: 'school-outline', color: colors.textSecondary };
          return (
            <View key={mode} style={[styles.modeChip, { borderColor: config.color + '40' }]}>
              <Ionicons name={config.icon as any} size={16} color={config.color} />
              <Text style={[styles.modeText, { color: config.color }]}>{config.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Availability Schedule */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Availability</Text>
      <View style={styles.daysGrid}>
        {ALL_DAYS.map((day) => {
          const isAvailable = daysNormalized.includes(day.toLowerCase());
          return (
            <View
              key={day}
              style={[
                styles.dayChip,
                isAvailable ? styles.dayActive : styles.dayInactive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isAvailable ? styles.dayTextActive : styles.dayTextInactive,
                ]}
              >
                {day.substring(0, 3)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Time Slots */}
      {availableTimeSlots.length > 0 && (
        <View style={styles.timeSlotsRow}>
          {availableTimeSlots.map((slot) => {
            const config = TIME_SLOT_MAP[slot.toLowerCase()] || { label: slot, icon: 'time-outline' };
            return (
              <View key={slot} style={styles.timeSlot}>
                <Ionicons name={config.icon as any} size={14} color={colors.primary} />
                <Text style={styles.timeText}>{config.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Location */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Location</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text style={styles.locationText}>
          {area ? `${area}, ${city}` : city}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: colors.background,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  dayActive: {
    backgroundColor: colors.primary,
  },
  dayInactive: {
    backgroundColor: colors.backgroundSecondary,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayTextActive: {
    color: colors.textWhite,
  },
  dayTextInactive: {
    color: colors.textTertiary,
  },
  timeSlotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});

export default memo(TutorAvailability);
