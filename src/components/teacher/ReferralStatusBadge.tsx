import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { ReferralStatus } from '../../services/referralApi';

interface ReferralStatusBadgeProps {
  status: ReferralStatus;
}

const statusConfig: Record<ReferralStatus, { label: string; backgroundColor: string; textColor: string }> = {
  pending: {
    label: 'Pending',
    backgroundColor: colors.warningLight,
    textColor: colors.warning,
  },
  registered: {
    label: 'Registered',
    backgroundColor: colors.infoLight,
    textColor: colors.info,
  },
  first_purchase: {
    label: 'First Purchase',
    backgroundColor: colors.successLight,
    textColor: colors.success,
  },
  rewarded: {
    label: 'Rewarded',
    backgroundColor: colors.successLight,
    textColor: colors.success,
  },
  expired: {
    label: 'Expired',
    backgroundColor: colors.errorLight,
    textColor: colors.error,
  },
};

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
