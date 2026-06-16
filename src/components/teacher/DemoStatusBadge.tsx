import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ContactStatus } from '../../services/contactApi';

interface DemoStatusBadgeProps {
  status: ContactStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: 'Pending',     bg: '#FEF3C7', text: '#92400E' },
  accepted:    { label: 'Accepted',    bg: '#D1FAE5', text: '#065F46' },
  rejected:    { label: 'Rejected',    bg: '#FEE2E2', text: '#991B1B' },
  completed:   { label: 'Completed',   bg: '#DBEAFE', text: '#1E40AF' },
  rescheduled: { label: 'Rescheduled', bg: '#EDE9FE', text: '#5B21B6' },
};

const DemoStatusBadge: React.FC<DemoStatusBadgeProps> = React.memo(({ status, size = 'medium' }) => {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#F3F4F6', text: '#374151' };
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg },
      isSmall && styles.badgeSmall,
    ]}>
      <Text style={[
        styles.label,
        { color: config.text },
        isSmall && styles.labelSmall,
      ]}>
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 10,
  },
});

export default DemoStatusBadge;
