import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { ProfileAvatar } from '../ui';
import { 
  ContactRequest, 
  ContactStatus, 
  ContactType,
  getContactStatusColor,
  getContactStatusLabel,
  getContactTypeIcon,
  getContactTypeLabel,
} from '../../services/contactApi';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContactHistoryCardProps {
  request: ContactRequest;
  onPress?: (request: ContactRequest) => void;
  variant?: 'parent' | 'teacher';
}

// ── Component ─────────────────────────────────────────────────────────────────

const ContactHistoryCard: React.FC<ContactHistoryCardProps> = ({
  request,
  onPress,
  variant = 'parent',
}) => {
  const statusColor = useMemo(() => getContactStatusColor(request.status), [request.status]);
  const statusLabel = useMemo(() => getContactStatusLabel(request.status), [request.status]);
  const typeIcon = useMemo(() => getContactTypeIcon(request.contactType), [request.contactType]);
  const typeLabel = useMemo(() => getContactTypeLabel(request.contactType), [request.contactType]);

  const displayName = useMemo(() => {
    if (variant === 'parent') {
      return request.teacherProfile?.basicDetails?.fullName || 'Tutor';
    }
    return request.parent?.profile?.parentName || 'Parent';
  }, [request, variant]);

  const displayImage = useMemo(() => {
    if (variant === 'parent') {
      return request.teacherProfile?.basicDetails?.profilePhoto;
    }
    return undefined;
  }, [request, variant]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return '';
    const date = formatDate(dateString);
    return timeString ? `${date} at ${timeString}` : date;
  };

  const renderDemoBadge = () => {
    if (request.contactType !== 'demo' || !request.demoDate) return null;
    return (
      <View style={styles.demoBadge}>
        <Ionicons name="calendar-outline" size={12} color={colors.primary} />
        <Text style={styles.demoBadgeText}>
          {formatDateTime(request.demoDate, request.demoTime)}
        </Text>
      </View>
    );
  };

  const renderModeBadge = () => {
    if (!request.demoMode) return null;
    return (
      <View style={styles.modeBadge}>
        <Ionicons 
          name={request.demoMode === 'online' ? 'videocam-outline' : 'home-outline'} 
          size={12} 
          color={colors.info} 
        />
        <Text style={styles.modeBadgeText}>
          {request.demoMode === 'online' ? 'Online' : 'Home'}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(request)}
      activeOpacity={0.7}
    >
      {/* Left: Avatar */}
      <ProfileAvatar
        name={displayName}
        imageUri={displayImage}
        size={48}
      />

      {/* Middle: Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* Type & Status Row */}
        <View style={styles.typeRow}>
          <View style={styles.typeBadge}>
            <Ionicons name={typeIcon as any} size={12} color={colors.textSecondary} />
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Demo Info */}
        {renderDemoBadge()}
        {renderModeBadge()}

        {/* Message Preview */}
        {request.message && (
          <Text style={styles.message} numberOfLines={2}>
            "{request.message}"
          </Text>
        )}

        {/* Response Message */}
        {request.responseMessage && (
          <View style={styles.responseBox}>
            <Ionicons name="return-down-forward" size={14} color={colors.textTertiary} />
            <Text style={styles.responseText} numberOfLines={2}>
              {request.responseMessage}
            </Text>
          </View>
        )}

        {/* Date */}
        <Text style={styles.date}>
          {formatDate(request.createdAt)}
        </Text>
      </View>

      {/* Right: Arrow */}
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    ...shadows.card,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  demoBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  modeBadgeText: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  responseBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  responseText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  date: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 8,
  },
});

export default React.memo(ContactHistoryCard);
