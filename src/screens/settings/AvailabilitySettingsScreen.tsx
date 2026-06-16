import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
  'Early Morning (5–8 AM)',
  'Morning (8–12 PM)',
  'Afternoon (12–4 PM)',
  'Evening (4–8 PM)',
  'Night (8–11 PM)',
];

type TeachingMode = 'online' | 'offline' | 'hybrid';

const AvailabilitySettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['Evening (4–8 PM)']);
  const [vacationMode, setVacationMode] = useState(false);
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('hybrid');

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const modes: { key: TeachingMode; label: string; icon: string; color: string; desc: string }[] = [
    { key: 'online', label: 'Online', icon: 'videocam-outline', color: colors.info, desc: 'Video & live classes only' },
    { key: 'offline', label: 'Offline', icon: 'home-outline', color: colors.success, desc: 'In-person sessions only' },
    { key: 'hybrid', label: 'Hybrid', icon: 'git-merge-outline', color: colors.secondary, desc: 'Both online & offline' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Availability</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Vacation Mode */}
        <View style={[styles.vacationCard, vacationMode && styles.vacationCardActive]}>
          <View style={styles.vacationLeft}>
            <View style={[styles.vacIconWrap, { backgroundColor: vacationMode ? colors.accent + '25' : colors.primary + '15' }]}>
              <Ionicons name="sunny-outline" size={24} color={vacationMode ? colors.accent : colors.primary} />
            </View>
            <View>
              <Text style={styles.vacTitle}>Vacation Mode</Text>
              <Text style={styles.vacSubtitle}>
                {vacationMode ? 'You are on vacation — no new leads' : 'Enable to pause all incoming leads'}
              </Text>
            </View>
          </View>
          <Switch
            value={vacationMode}
            onValueChange={setVacationMode}
            trackColor={{ false: colors.border, true: colors.accent + '60' }}
            thumbColor={vacationMode ? colors.accent : colors.textTertiary}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Available Days */}
        <Text style={styles.sectionLabel}>AVAILABLE DAYS</Text>
        <View style={styles.card}>
          <View style={styles.daysGrid}>
            {DAYS.map(day => {
              const active = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.daySummaryRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.daySummary}>
              {selectedDays.length === 0
                ? 'No days selected'
                : `${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''} per week`}
            </Text>
          </View>
        </View>

        {/* Time Slots */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>AVAILABLE TIME SLOTS</Text>
        <View style={styles.card}>
          {TIME_SLOTS.map((slot, idx) => {
            const active = selectedSlots.includes(slot);
            return (
              <React.Fragment key={slot}>
                <TouchableOpacity
                  style={styles.slotRow}
                  onPress={() => toggleSlot(slot)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.slotCheck, active && styles.slotCheckActive]}>
                    {active && <Ionicons name="checkmark" size={14} color={colors.textWhite} />}
                  </View>
                  <View style={styles.slotText}>
                    <Text style={[styles.slotLabel, active && { color: colors.primary }]}>{slot}</Text>
                  </View>
                  {active && (
                    <View style={styles.slotBadge}>
                      <Text style={styles.slotBadgeText}>Active</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {idx < TIME_SLOTS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Teaching Mode */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PREFERRED TEACHING MODE</Text>
        <View style={styles.modesRow}>
          {modes.map(mode => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeCard,
                teachingMode === mode.key && { borderColor: mode.color, borderWidth: 2 },
              ]}
              onPress={() => setTeachingMode(mode.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.modeIcon, { backgroundColor: mode.color + '18' }]}>
                <Ionicons name={mode.icon as any} size={22} color={mode.color} />
              </View>
              <Text style={[styles.modeLabel, teachingMode === mode.key && { color: mode.color }]}>
                {mode.label}
              </Text>
              <Text style={styles.modeDesc}>{mode.desc}</Text>
              {teachingMode === mode.key && (
                <View style={[styles.modeTick, { backgroundColor: mode.color }]}>
                  <Ionicons name="checkmark" size={12} color={colors.textWhite} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Availability Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.summaryText}>
              <Text style={{ fontWeight: '700' }}>Days: </Text>
              {selectedDays.length ? selectedDays.join(', ') : 'None selected'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.summaryText}>
              <Text style={{ fontWeight: '700' }}>Slots: </Text>
              {selectedSlots.length ? selectedSlots.join('; ') : 'None selected'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="desktop-outline" size={15} color={colors.primary} />
            <Text style={styles.summaryText}>
              <Text style={{ fontWeight: '700' }}>Mode: </Text>
              {modes.find(m => m.key === teachingMode)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="sunny-outline" size={15} color={vacationMode ? colors.accent : colors.success} />
            <Text style={styles.summaryText}>
              <Text style={{ fontWeight: '700' }}>Vacation: </Text>
              <Text style={{ color: vacationMode ? colors.accent : colors.success }}>
                {vacationMode ? 'ON — leads paused' : 'OFF — accepting leads'}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noteText}>
            These preferences are saved locally. API integration will sync them to your tutor profile.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  vacationCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, ...shadows.card, borderWidth: 1, borderColor: colors.border,
  },
  vacationCardActive: { borderColor: colors.accent + '60', backgroundColor: colors.accent + '08' },
  vacationLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  vacIconWrap: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  vacTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  vacSubtitle: { fontSize: 12, color: colors.textSecondary },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', padding: 16, ...shadows.card },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dayChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  dayTextActive: { color: colors.textWhite },
  daySummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
  daySummary: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 2,
  },
  slotCheck: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  slotCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { flex: 1 },
  slotLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  slotBadge: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  slotBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border },

  modesRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 18, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    ...shadows.sm, position: 'relative',
  },
  modeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modeLabel: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 3 },
  modeDesc: { fontSize: 10, color: colors.textTertiary, textAlign: 'center', lineHeight: 13 },
  modeTick: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },

  summaryCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    marginTop: 24, ...shadows.card, gap: 10,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  summaryText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight, padding: 14, borderRadius: 14, marginTop: 16,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19, fontWeight: '500' },
});

export default AvailabilitySettingsScreen;
