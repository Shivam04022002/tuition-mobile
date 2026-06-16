import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
type TimelineEventType = ApplicationStatus | 'viewed' | 'demo_scheduled' | 'demo_completed';

interface TimelineEvent {
  status: TimelineEventType;
  label: string;
  date?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface DemoDetails {
  demoId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
  mode?: 'online' | 'offline';
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

interface ApplicationTimelineProps {
  currentStatus: ApplicationStatus;
  createdAt: string;
  shortlistedAt?: string;
  rejectedAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  viewedByParent?: boolean;
  viewedAt?: string;
  demoScheduled?: boolean;
  demoDetails?: DemoDetails;
}

const getEventConfig = (status: TimelineEventType) => {
  const configs: Record<TimelineEventType, { color: string; icon: string; label: string }> = {
    pending: { color: colors.warning, icon: 'time-outline', label: 'Applied' },
    shortlisted: { color: colors.info, icon: 'star-outline', label: 'Shortlisted' },
    rejected: { color: colors.error, icon: 'close-circle-outline', label: 'Not Selected' },
    accepted: { color: colors.success, icon: 'checkmark-circle-outline', label: 'Selected' },
    withdrawn: { color: colors.textSecondary, icon: 'remove-circle-outline', label: 'Withdrawn' },
    viewed: { color: '#6B7280', icon: 'eye-outline', label: 'Viewed by Parent' },
    demo_scheduled: { color: '#8B5CF6', icon: 'videocam-outline', label: 'Demo Scheduled' },
    demo_completed: { color: '#06B6D4', icon: 'checkmark-done-outline', label: 'Demo Completed' },
  };
  return configs[status];
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  currentStatus,
  createdAt,
  shortlistedAt,
  rejectedAt,
  acceptedAt,
  rejectionReason,
  viewedByParent,
  viewedAt,
  demoScheduled,
  demoDetails,
}) => {
  // Build timeline events based on current status and dates
  const events: TimelineEvent[] = [];

  // 1. Application Submitted (always present)
  events.push({
    status: 'pending',
    label: 'Application Submitted',
    date: createdAt,
    description: 'Your application has been received',
  });

  // 2. Viewed by Parent
  if (viewedByParent || viewedAt) {
    events.push({
      status: 'viewed',
      label: 'Viewed by Parent',
      date: viewedAt,
      description: 'Parent has reviewed your application',
    });
  }

  // 3. Shortlisted
  if (currentStatus === 'shortlisted' || shortlistedAt) {
    events.push({
      status: 'shortlisted',
      label: 'Shortlisted',
      date: shortlistedAt,
      description: 'Parent has shortlisted your application for demo',
    });
  }

  // 4. Demo Scheduled
  if (demoScheduled || demoDetails?.scheduledDate) {
    const isDemoCompleted = demoDetails?.status === 'completed';
    
    events.push({
      status: 'demo_scheduled',
      label: isDemoCompleted ? 'Demo Scheduled (Completed)' : 'Demo Scheduled',
      date: demoDetails?.scheduledDate,
      description: demoDetails?.scheduledTime 
        ? `Demo on ${formatDate(demoDetails.scheduledDate)} at ${demoDetails.scheduledTime}${demoDetails.mode ? ` (${demoDetails.mode})` : ''}`
        : 'A demo class has been scheduled',
    });

    // 5. Demo Completed (separate event if completed)
    if (isDemoCompleted) {
      events.push({
        status: 'demo_completed',
        label: 'Demo Completed',
        date: demoDetails?.scheduledDate,
        description: 'Demo class was successfully completed',
      });
    }
  }

  // 6. Selected/Accepted
  if (currentStatus === 'accepted' || acceptedAt) {
    if (!shortlistedAt && currentStatus !== 'shortlisted') {
      events.push({
        status: 'shortlisted',
        label: 'Shortlisted',
        date: acceptedAt,
        description: 'Parent has shortlisted your application',
      });
    }
    events.push({
      status: 'accepted',
      label: 'Selected!',
      date: acceptedAt,
      description: 'Congratulations! You have been selected for this tuition',
    });
  }

  // 7. Rejected
  if (currentStatus === 'rejected' || rejectedAt) {
    events.push({
      status: 'rejected',
      label: 'Not Selected',
      date: rejectedAt,
      description: rejectionReason || 'Parent has chosen another tutor',
    });
  }

  // 8. Withdrawn (if applicable)
  if (currentStatus === 'withdrawn') {
    events.push({
      status: 'withdrawn',
      label: 'Withdrawn',
      description: 'You withdrew this application',
    });
  }

  const getEventStatus = (eventStatus: TimelineEventType, index: number): 'completed' | 'current' | 'pending' => {
    // Determine if event is completed, current, or pending
    const isLastEvent = index === events.length - 1;
    
    // Current status determines what's "current"
    if (isLastEvent && currentStatus !== 'withdrawn') {
      return 'current';
    }
    
    // Check based on chronological position
    if (eventStatus === 'pending') return 'completed';
    if (eventStatus === 'withdrawn') return 'current';
    
    // For demo and shortlisted events, check dates
    if (eventStatus === 'shortlisted' && shortlistedAt) return 'completed';
    if (eventStatus === 'viewed' && viewedAt) return 'completed';
    if (eventStatus === 'demo_scheduled' && demoDetails?.status !== 'scheduled') return 'completed';
    if (eventStatus === 'demo_completed') return 'completed';
    
    // If matches current status
    if (eventStatus === currentStatus) return 'current';
    
    return 'pending';
  };

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const eventStatus = getEventStatus(event.status, index);
        const config = getEventConfig(event.status);
        const isLast = index === events.length - 1;

        return (
          <View key={event.status + index} style={styles.eventRow}>
            {/* Timeline Line */}
            <View style={styles.timelineColumn}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      eventStatus === 'completed' || eventStatus === 'current'
                        ? config.color
                        : colors.border,
                  },
                ]}
              />
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        eventStatus === 'completed' ? config.color : colors.border,
                    },
                  ]}
                />
              )}
            </View>

            {/* Event Content */}
            <View style={[styles.eventContent, isLast && styles.lastEvent]}>
              <View style={styles.eventHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: config.color + '15' },
                  ]}
                >
                  <Ionicons name={config.icon as any} size={16} color={config.color} />
                </View>
                <View style={styles.eventTitleContainer}>
                  <Text style={styles.eventLabel}>{event.label}</Text>
                  {event.date && (
                    <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                  )}
                </View>
              </View>
              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  eventRow: {
    flexDirection: 'row',
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  lastEvent: {
    paddingBottom: 0,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTitleContainer: {
    marginLeft: 10,
    flex: 1,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginLeft: 42,
    lineHeight: 18,
  },
});

export default ApplicationTimeline;
