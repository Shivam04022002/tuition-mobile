import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { ContactRequest } from '../../services/contactApi';
import DemoStatusBadge from './DemoStatusBadge';

interface DemoRequestCardProps {
  request: ContactRequest;
  onAccept: (r: ContactRequest) => void;
  onReject: (r: ContactRequest) => void;
  onReschedule: (r: ContactRequest) => void;
  onComplete: (r: ContactRequest) => void;
  onViewDetails: (r: ContactRequest) => void;
  isResponding?: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const DemoRequestCard: React.FC<DemoRequestCardProps> = React.memo(({
  request,
  onAccept,
  onReject,
  onReschedule,
  onComplete,
  onViewDetails,
  isResponding = false,
}) => {
  const parentName = useMemo(() =>
    (request as any).parentId?.profile?.parentName || 'Parent',
    [request]
  );
  const studentName = useMemo(() =>
    (request as any).requirementId?.studentDetails?.studentName || '—',
    [request]
  );
  const grade = useMemo(() =>
    (request as any).requirementId?.studentDetails?.grade || '—',
    [request]
  );
  const subjects = useMemo(() =>
    ((request as any).requirementId?.subjects || []) as string[],
    [request]
  );
  const city = useMemo(() =>
    (request as any).requirementId?.location?.city || '—',
    [request]
  );
  const requirementId = useMemo(() =>
    (request as any).requirementId?.requirementId || '—',
    [request]
  );

  const canAccept = request.status === 'pending' || request.status === 'rescheduled';
  const canReject = request.status === 'pending' || request.status === 'accepted' || request.status === 'rescheduled';
  const canReschedule = request.status === 'pending' || request.status === 'accepted';
  const canComplete = request.status === 'accepted';

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="videocam-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.reqId}>{requirementId}</Text>
          <Text style={styles.timeAgo}>{timeAgo(request.createdAt)}</Text>
        </View>
        <DemoStatusBadge status={request.status} size="small" />
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Student</Text>
          <Text style={styles.infoValue}>{studentName} · Class {grade}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Parent</Text>
          <Text style={styles.infoValue}>{parentName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Demo Date</Text>
          <Text style={styles.infoValue}>{formatDate(request.demoDate)} {request.demoTime ? `· ${request.demoTime}` : ''}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name={request.demoMode === 'offline' ? 'location-outline' : 'videocam-outline'} size={13} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Mode</Text>
          <Text style={styles.infoValue}>{request.demoMode === 'offline' ? 'Offline' : 'Online'} · {city}</Text>
        </View>
        {subjects.length > 0 && (
          <View style={styles.subjectsRow}>
            {subjects.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{s}</Text>
              </View>
            ))}
            {subjects.length > 3 && (
              <View style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>+{subjects.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.detailBtn]}
          onPress={() => onViewDetails(request)}
          disabled={isResponding}
        >
          <Ionicons name="eye-outline" size={14} color={colors.primary} />
          <Text style={styles.detailBtnText}>Details</Text>
        </TouchableOpacity>

        {canAccept && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => onAccept(request)}
            disabled={isResponding}
          >
            <Ionicons name="checkmark-outline" size={14} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        )}

        {canReschedule && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.rescheduleBtn]}
            onPress={() => onReschedule(request)}
            disabled={isResponding}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.accent} />
            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
          </TouchableOpacity>
        )}

        {canComplete && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => onComplete(request)}
            disabled={isResponding}
          >
            <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
            <Text style={styles.completeBtnText}>Complete</Text>
          </TouchableOpacity>
        )}

        {canReject && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => onReject(request)}
            disabled={isResponding}
          >
            <Ionicons name="close-outline" size={14} color={colors.error} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerMeta: {
    flex: 1,
  },
  reqId: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  infoGrid: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 72,
  },
  infoValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    paddingLeft: 19,
  },
  subjectChip: {
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subjectChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  detailBtn: {
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  detailBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  acceptBtn: { backgroundColor: colors.success },
  acceptBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  rescheduleBtn: {
    backgroundColor: colors.accent + '12',
    borderWidth: 1,
    borderColor: colors.accent + '25',
  },
  rescheduleBtnText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  completeBtn: { backgroundColor: colors.primary },
  completeBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  rejectBtn: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '25',
  },
  rejectBtnText: { fontSize: 12, fontWeight: '600', color: colors.error },
});

export default DemoRequestCard;
