import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { TimelineEvent } from '../../services/documentApi';

interface VerificationTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
  maxItems?: number;
}

const VerificationTimeline: React.FC<VerificationTimelineProps> = ({
  events,
  currentStatus,
  maxItems = 10,
}) => {
  const displayEvents = events.slice(0, maxItems);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'DOCUMENT_UPLOADED':
        return 'cloud-upload';
      case 'DOCUMENT_VERIFIED':
        return 'checkmark-circle';
      case 'DOCUMENT_REJECTED':
        return 'close-circle';
      case 'VERIFICATION_SUBMITTED':
        return 'send';
      case 'PROFILE_VERIFIED':
        return 'shield-checkmark';
      case 'PROFILE_REJECTED':
        return 'alert-circle';
      default:
        return 'time';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'DOCUMENT_UPLOADED':
      case 'VERIFICATION_SUBMITTED':
        return colors.info;
      case 'DOCUMENT_VERIFIED':
      case 'PROFILE_VERIFIED':
        return colors.success;
      case 'DOCUMENT_REJECTED':
      case 'PROFILE_REJECTED':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStatusStep = () => {
    const steps = [
      { key: 'draft', label: 'Draft', icon: 'document-outline' },
      { key: 'pending', label: 'Pending Review', icon: 'time-outline' },
      { key: 'verified', label: 'Verified', icon: 'checkmark-circle-outline' },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStatus);

    return (
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <View key={step.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor: isActive ? colors.primary + '15' : colors.backgroundSecondary,
                    borderColor: isCurrent ? colors.primary : isActive ? colors.primary + '30' : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={18}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: isActive ? colors.text : colors.textTertiary },
                ]}
              >
                {step.label}
              </Text>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    { backgroundColor: index < currentIndex ? colors.primary : colors.border },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Timeline</Text>

      {getStatusStep()}

      {displayEvents.length > 0 && (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Recent Activity</Text>
          <ScrollView
            style={styles.eventsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {displayEvents.map((event, index) => {
              const eventColor = getEventColor(event.event);
              const isLast = index === displayEvents.length - 1;

              return (
                <View key={index} style={styles.eventItem}>
                  <View style={styles.timelineColumn}>
                    <View
                      style={[
                        styles.eventIcon,
                        { backgroundColor: eventColor + '15' },
                      ]}
                    >
                      <Ionicons
                        name={getEventIcon(event.event) as any}
                        size={14}
                        color={eventColor}
                      />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.eventContent}>
                    <Text style={styles.eventDescription}>{event.description}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                    {event.reason && (
                      <View style={styles.reasonBox}>
                        <Text style={styles.reasonText}>{event.reason}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepConnector: {
    position: 'absolute',
    top: 19,
    right: -30,
    width: 60,
    height: 2,
  },
  eventsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  eventsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  eventsList: {
    maxHeight: 300,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  eventIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
    paddingBottom: 12,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  reasonBox: {
    backgroundColor: colors.error + '10',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  reasonText: {
    fontSize: 12,
    color: colors.error,
  },
});

export default VerificationTimeline;
