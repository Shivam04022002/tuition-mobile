import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface DemoProposal {
  suggestedDate?: string;
  suggestedTime?: string;
  mode?: 'online' | 'offline';
}

interface DemoProposalCardProps {
  value: DemoProposal;
  onChange: (proposal: DemoProposal) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const MODE_OPTIONS: Array<{ value: 'online' | 'offline'; label: string; icon: string }> = [
  { value: 'online', label: 'Online', icon: 'videocam-outline' },
  { value: 'offline', label: 'In-Person', icon: 'location-outline' },
];

const timeOptions = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM',
];

const DemoProposalCard: React.FC<DemoProposalCardProps> = ({
  value,
  onChange,
  enabled,
  onToggle,
}) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <View style={styles.container}>
      {/* Toggle Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.title}>Propose a Demo Class</Text>
            <Text style={styles.subtitle}>Optional but increases your chances</Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.accent + '60' }}
          thumbColor={enabled ? colors.accent : colors.textTertiary}
        />
      </View>

      {enabled && (
        <View style={styles.form}>
          {/* Date Selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Suggested Date</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => {
                // Date picker would be triggered here
                // For now, set a default 2 days from now
                const date = new Date();
                date.setDate(date.getDate() + 2);
                onChange({ ...value, suggestedDate: date.toISOString().split('T')[0] });
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.inputText, !value.suggestedDate && styles.placeholder]}>
                {value.suggestedDate ? formatDate(value.suggestedDate) : 'Select a date'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Time Selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Suggested Time</Text>
            <View style={styles.timeGrid}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeChip,
                    value.suggestedTime === time && styles.timeChipActive,
                  ]}
                  onPress={() => onChange({ ...value, suggestedTime: time })}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      value.suggestedTime === time && styles.timeChipTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode Selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Demo Mode</Text>
            <View style={styles.modeRow}>
              {MODE_OPTIONS.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.modeButton,
                    value.mode === mode.value && styles.modeButtonActive,
                  ]}
                  onPress={() => onChange({ ...value, mode: mode.value })}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={18}
                    color={value.mode === mode.value ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeText,
                      value.mode === mode.value && styles.modeTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  form: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  timeChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  timeChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timeChipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  modeButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  modeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});

export default DemoProposalCard;
