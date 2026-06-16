import React, { useEffect, useState, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getUnreadCount } from '../../services/notificationApi';

interface NotificationBellProps {
  token: string;
  onPress: () => void;
  color?: string;
  size?: number;
  pollIntervalMs?: number; // default 30 s
  externalCount?: number;  // if provided, overrides the polled count immediately
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  token,
  onPress,
  color,
  size = 26,
  pollIntervalMs = 30000,
  externalCount,
}) => {
  const theme = useTheme();
  const bellColor = color ?? theme.colors.text;
  const [polledCount, setPolledCount] = useState(0);

  // Use externalCount when caller provides it (e.g. after mark-read / delete),
  // otherwise fall back to the last polled value.
  const count = externalCount !== undefined ? externalCount : polledCount;

  const refresh = useCallback(async () => {
    try {
      const n = await getUnreadCount(token);
      setPolledCount(n);
    } catch {
      // silently ignore — bell should never crash the UI
    }
  }, [token]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  const badge = count > 99 ? '99+' : count > 0 ? String(count) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.wrapper}
      accessibilityLabel={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
    >
      <Ionicons name="notifications" size={size} color={bellColor} />
      {badge !== null && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error ?? '#E53E3E' }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});

export default NotificationBell;
