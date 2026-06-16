import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

type ErrorType = 'network' | 'server' | 'timeout' | 'auth' | 'generic';

interface DashboardErrorProps {
  error?: string | null;
  onRetry: () => void;
}

function resolveErrorType(error?: string | null): ErrorType {
  if (!error) return 'generic';
  const lower = error.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('internet')) return 'network';
  if (lower.includes('timeout') || lower.includes('timed out')) return 'timeout';
  if (lower.includes('server') || lower.includes('500') || lower.includes('503')) return 'server';
  if (lower.includes('session') || lower.includes('auth') || lower.includes('login')) return 'auth';
  return 'generic';
}

const ERROR_CONFIG: Record<ErrorType, { icon: string; title: string; description: string; iconColor: string }> = {
  network: {
    icon: 'wifi-outline',
    title: 'No Internet Connection',
    description: 'Please check your network connection and try again.',
    iconColor: colors.error,
  },
  server: {
    icon: 'server-outline',
    title: 'Server Error',
    description: 'Our servers are temporarily unavailable. Please try again in a moment.',
    iconColor: colors.accent,
  },
  timeout: {
    icon: 'time-outline',
    title: 'Request Timed Out',
    description: 'The request took too long. Please check your connection and retry.',
    iconColor: colors.accent,
  },
  auth: {
    icon: 'lock-closed-outline',
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again.',
    iconColor: colors.secondary,
  },
  generic: {
    icon: 'alert-circle-outline',
    title: 'Unable to Load Dashboard',
    description: 'Something went wrong while loading your dashboard.',
    iconColor: colors.error,
  },
};

const DashboardError: React.FC<DashboardErrorProps> = memo(({ error, onRetry }) => {
  const type = resolveErrorType(error);
  const config = ERROR_CONFIG[type];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: config.iconColor + '15' }]}>
          <Ionicons name={config.icon as any} size={40} color={config.iconColor} />
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.description}>
          {error && type === 'generic' ? error : config.description}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.82}
        >
          <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
          <Text style={styles.retryLabel}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

DashboardError.displayName = 'DashboardError';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    ...shadows.card,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default DashboardError;
