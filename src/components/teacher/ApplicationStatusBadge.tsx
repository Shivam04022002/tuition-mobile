import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type ApplicationStatus = 
  | 'pending' 
  | 'shortlisted' 
  | 'rejected' 
  | 'accepted' 
  | 'withdrawn'
  | 'demo_scheduled'
  | 'demo_completed';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  demoScheduled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const getStatusConfig = (status: ApplicationStatus, demoScheduled?: boolean) => {
  // If demo is scheduled but status is still pending/shortlisted, show purple
  if (demoScheduled && (status === 'pending' || status === 'shortlisted')) {
    return {
      color: '#8B5CF6', // Purple
      icon: 'videocam-outline',
      label: 'Demo Scheduled',
      bgColor: '#8B5CF620',
    };
  }

  const configs: Record<ApplicationStatus, { color: string; icon: string; label: string; bgColor: string }> = {
    pending: {
      color: '#F59E0B', // Orange
      icon: 'time-outline',
      label: 'Pending',
      bgColor: '#F59E0B20',
    },
    shortlisted: {
      color: '#3B82F6', // Blue
      icon: 'star-outline',
      label: 'Shortlisted',
      bgColor: '#3B82F620',
    },
    rejected: {
      color: '#EF4444', // Red
      icon: 'close-circle-outline',
      label: 'Rejected',
      bgColor: '#EF444420',
    },
    accepted: {
      color: '#10B981', // Green
      icon: 'checkmark-circle-outline',
      label: 'Selected',
      bgColor: '#10B98120',
    },
    withdrawn: {
      color: '#6B7280', // Grey
      icon: 'remove-circle-outline',
      label: 'Withdrawn',
      bgColor: '#6B728020',
    },
    demo_scheduled: {
      color: '#8B5CF6', // Purple
      icon: 'videocam-outline',
      label: 'Demo Scheduled',
      bgColor: '#8B5CF620',
    },
    demo_completed: {
      color: '#06B6D4', // Cyan
      icon: 'checkmark-done-outline',
      label: 'Demo Completed',
      bgColor: '#06B6D420',
    },
  };

  return configs[status] || configs.pending;
};

const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  demoScheduled,
  size = 'medium',
  showIcon = true,
}) => {
  const theme = useTheme();
  const config = getStatusConfig(status, demoScheduled);

  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 11,
      iconSize: 12,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 12,
      iconSize: 14,
    },
    large: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      fontSize: 13,
      iconSize: 16,
    },
  };

  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
        },
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon as any}
          size={s.iconSize}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: s.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});

export default React.memo(ApplicationStatusBadge);
