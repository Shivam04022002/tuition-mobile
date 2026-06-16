import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { ContactRequest } from '../../services/contactApi';
import DemoStatusBadge from './DemoStatusBadge';

interface DemoAction {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  hidden?: boolean;
}

interface DemoActionSheetProps {
  visible: boolean;
  request: ContactRequest | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onReschedule: () => void;
  onComplete: () => void;
  onViewDetails: () => void;
  isResponding?: boolean;
}

const DemoActionSheet: React.FC<DemoActionSheetProps> = ({
  visible,
  request,
  onClose,
  onAccept,
  onReject,
  onReschedule,
  onComplete,
  onViewDetails,
  isResponding = false,
}) => {
  const parentName = (request as any)?.parentId?.profile?.parentName || 'Parent';
  const requirementId = (request as any)?.requirementId?.requirementId || '—';

  const status = request?.status;
  const canAccept = status === 'pending' || status === 'rescheduled';
  const canReject = status === 'pending' || status === 'accepted' || status === 'rescheduled';
  const canReschedule = status === 'pending' || status === 'accepted';
  const canComplete = status === 'accepted';

  const actions: DemoAction[] = [
    {
      icon: 'eye-outline',
      label: 'View Details',
      color: colors.primary,
      bg: colors.primary + '12',
      onPress: onViewDetails,
    },
    {
      icon: 'checkmark-circle-outline',
      label: 'Accept Demo',
      color: '#059669',
      bg: '#D1FAE5',
      onPress: onAccept,
      hidden: !canAccept,
    },
    {
      icon: 'checkmark-done-outline',
      label: 'Mark Completed',
      color: colors.primary,
      bg: colors.primary + '12',
      onPress: onComplete,
      hidden: !canComplete,
    },
    {
      icon: 'calendar-outline',
      label: 'Reschedule',
      color: colors.accent,
      bg: colors.accent + '12',
      onPress: onReschedule,
      hidden: !canReschedule,
    },
    {
      icon: 'close-circle-outline',
      label: 'Reject Demo',
      color: colors.error,
      bg: colors.error + '10',
      onPress: onReject,
      hidden: !canReject,
    },
  ];

  const visibleActions = actions.filter(a => !a.hidden);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          {/* Request Info */}
          {request && (
            <View style={styles.requestInfo}>
              <View style={styles.requestInfoLeft}>
                <Text style={styles.reqId}>{requirementId}</Text>
                <Text style={styles.parentName}>{parentName}</Text>
              </View>
              <DemoStatusBadge status={request.status} size="small" />
            </View>
          )}

          {/* Actions */}
          {isResponding ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              {visibleActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.actionItem, { backgroundColor: action.bg }]}
                  onPress={() => { action.onPress(); onClose(); }}
                  disabled={isResponding}
                >
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                  <Text style={[styles.actionLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isResponding}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  requestInfoLeft: { flex: 1 },
  reqId: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  parentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});

export default DemoActionSheet;
