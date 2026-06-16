import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../../services/contactApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

// ── Types ────────────────────────────────────────────────────────────────────

interface CalendarEventCardProps {
  event: CalendarEvent;
  onPress?: (event: CalendarEvent) => void;
  onJoinMeeting?: (event: CalendarEvent) => void;
  onUnblock?: (event: CalendarEvent) => void;
  compact?: boolean;
}

// ── Helper Functions ───────────────────────────────────────────────────────

const getEventIcon = (event: CalendarEvent): string => {
  if (event.type === 'blocked') return 'ban-outline';
  if (event.mode === 'online') return 'videocam-outline';
  return 'people-outline';
};

const getEventColor = (event: CalendarEvent): string => {
  if (event.type === 'blocked') return '#EF4444';
  if (event.backgroundColor) return event.backgroundColor;
  return event.status === 'accepted' ? colors.success : colors.primary;
};

const formatTime = (time?: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getReasonTypeLabel = (reasonType?: string): string => {
  const labels: Record<string, string> = {
    vacation: 'Vacation',
    exam: 'Exam',
    personal: 'Personal',
    medical: 'Medical',
    other: 'Other',
  };
  return labels[reasonType || 'other'] || 'Other';
};

// ── Component ────────────────────────────────────────────────────────────────

export const CalendarEventCard: React.FC<CalendarEventCardProps> = React.memo(({
  event,
  onPress,
  onJoinMeeting,
  onUnblock,
  compact = false,
}) => {
  const eventColor = useMemo(() => getEventColor(event), [event]);
  const iconName = useMemo(() => getEventIcon(event), [event]);

  const handlePress = () => onPress?.(event);
  const handleJoinMeeting = () => onJoinMeeting?.(event);
  const handleUnblock = () => onUnblock?.(event);

  if (compact) {
    return (
      <TouchableOpacity
        style={[compactStyles.container, { borderLeftColor: eventColor }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={compactStyles.iconContainer}>
          <Ionicons name={iconName as any} size={16} color={eventColor} />
        </View>
        <View style={compactStyles.content}>
          <Text style={compactStyles.title} numberOfLines={1}>
            {event.title}
          </Text>
          {event.time && (
            <Text style={compactStyles.time}>{formatTime(event.time)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: eventColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: eventColor + '15' }]}>
          <Ionicons name={iconName as any} size={20} color={eventColor} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          {event.type === 'demo' ? (
            <Text style={styles.subtitle}>
              {event.studentName} • {event.parentName}
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: '#EF4444' }]}>
              {getReasonTypeLabel(event.reasonType)}
            </Text>
          )}
        </View>
        {event.type === 'demo' && event.status && (
          <View style={[styles.statusBadge, { backgroundColor: eventColor + '15' }]}>
            <Text style={[styles.statusText, { color: eventColor }]}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Time */}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {event.type === 'blocked' && event.isFullDay
              ? 'Full Day'
              : event.time || event.startTime
                ? formatTime(event.time || event.startTime)
                : 'No time set'}
            {event.endTime && !event.isFullDay && ` - ${formatTime(event.endTime)}`}
          </Text>
        </View>

        {/* Demo-specific details */}
        {event.type === 'demo' && (
          <>
            {/* Mode */}
            <View style={styles.detailRow}>
              <Ionicons name={event.mode === 'online' ? 'videocam-outline' : 'location-outline'} size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {event.mode === 'online' ? 'Online Demo' : 'Offline Demo'}
              </Text>
            </View>

            {/* Requirement ID */}
            {event.requirementId && (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{event.requirementId}</Text>
              </View>
            )}

            {/* Subjects */}
            {event.subjects && event.subjects.length > 0 && (
              <View style={styles.subjectsRow}>
                {event.subjects.slice(0, 3).map((subject, index) => (
                  <View key={index} style={styles.subjectChip}>
                    <Text style={styles.subjectText}>{subject}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Blocked time details */}
        {event.type === 'blocked' && (
          <>
            {event.isRecurring && (
              <View style={styles.detailRow}>
                <Ionicons name="repeat-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  Recurring: {event.recurringDays?.join(', ')}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {event.type === 'demo' && event.mode === 'online' && event.meetingLink && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryActionBtn]}
            onPress={handleJoinMeeting}
          >
            <Ionicons name="videocam-outline" size={14} color="#fff" />
            <Text style={styles.primaryActionText}>Join Meeting</Text>
          </TouchableOpacity>
        )}
        
        {event.type === 'demo' && event.contactRequestId && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryActionBtn]}
            onPress={handlePress}
          >
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <Text style={styles.secondaryActionText}>View Details</Text>
          </TouchableOpacity>
        )}

        {event.type === 'blocked' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerActionBtn]}
            onPress={handleUnblock}
          >
            <Ionicons name="trash-outline" size={14} color="#fff" />
            <Text style={styles.dangerActionText}>Unblock</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  subjectChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  primaryActionBtn: {
    backgroundColor: colors.success,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryActionBtn: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  dangerActionBtn: {
    backgroundColor: '#EF4444',
  },
  dangerActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

const compactStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  iconContainer: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  time: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

export default CalendarEventCard;
