import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTicketDetail } from '../../hooks/useTickets';
import {
  TicketStatus,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
  STATUS_DISPLAY,
  PRIORITY_DISPLAY,
  CATEGORY_DISPLAY,
} from '../../services/ticketApi';

const TicketDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  const ticketId: string = route.params?.ticketId;
  const [replyText, setReplyText] = useState('');

  const { ticket, isLoading, isRefreshing, isSubmitting, error, refresh, reply, assign, resolve, close } = useTicketDetail(ticketId);

  const statusColor = ticket ? TICKET_STATUS_COLORS[ticket.status] : colors.textSecondary;
  const priorityColor = ticket ? TICKET_PRIORITY_COLORS[ticket.priority] : colors.textSecondary;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await reply(replyText.trim());
      setReplyText('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send reply');
    }
  };

  const handleAction = (action: 'Assign' | 'Resolve' | 'Close') => {
    Alert.alert(
      `${action} Ticket`,
      `Are you sure you want to ${action.toLowerCase()} this ticket?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: action === 'Close' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (action === 'Assign') await assign();
              else if (action === 'Resolve') await resolve();
              else if (action === 'Close') await close();
            } catch (e: any) {
              Alert.alert('Error', e?.message || `Failed to ${action.toLowerCase()} ticket`);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>{ticket?.ticketId || 'Loading...'}</Text>
          {ticket && (
            <View style={[styles.statusPill, { backgroundColor: statusColor + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{STATUS_DISPLAY[ticket.status]}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading ticket...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to load ticket</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && ticket && (<>
        {/* ── Ticket Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>TICKET INFO</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Subject</Text>
            <Text style={styles.infoValue}>{ticket.subject}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Category</Text>
            <Text style={styles.infoValue}>{CATEGORY_DISPLAY[ticket.category]}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Priority</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '14', borderColor: priorityColor + '50' }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>{PRIORITY_DISPLAY[ticket.priority]}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '14' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{STATUS_DISPLAY[ticket.status]}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Created</Text>
            <Text style={styles.infoValue}>{formatDate(ticket.createdAt)}</Text>
          </View>
          {ticket.assignedToName && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Assigned To</Text>
                <Text style={styles.infoValue}>{ticket.assignedToName}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── User Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>USER INFO</Text>
          <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {ticket.userName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </Text>
            </View>
            <View style={styles.userNameBox}>
              <Text style={styles.userName}>{ticket.userName}</Text>
              <View style={[styles.roleBadge, { backgroundColor: ticket.userRole === 'teacher' ? colors.secondary + '14' : colors.info + '14' }]}>
                <Text style={[styles.roleText, { color: ticket.userRole === 'teacher' ? colors.secondary : colors.info }]}>
                  {ticket.userRole}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Email</Text>
            <Text style={styles.infoValue}>{ticket.userEmail}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Phone</Text>
            <Text style={styles.infoValue}>{ticket.userPhone || 'Not provided'}</Text>
          </View>
        </View>

        {/* ── Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.descriptionText}>{ticket.description}</Text>
        </View>

        {/* ── Conversation Timeline */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CONVERSATION</Text>
          <View style={styles.timeline}>
            {(ticket.messages || []).map((msg, idx, arr) => {
              const isStaff = msg.sender === 'admin' || msg.sender === 'staff';
              return (
                <View key={msg._id || idx} style={styles.messageWrap}>
                  {/* Connector line */}
                  {idx < arr.length - 1 && <View style={styles.timelineConnector} />}
                  <View style={[styles.messageBubble, isStaff ? styles.adminBubble : styles.userBubble]}>
                    <View style={styles.messageHeader}>
                      <View style={[styles.senderDot, { backgroundColor: isStaff ? colors.primary : colors.accent }]} />
                      <Text style={[styles.senderName, { color: isStaff ? colors.primary : colors.accentDark }]}>
                        {isStaff ? '🛡 ' + msg.senderName : '👤 ' + msg.senderName}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Reply Box */}
          {ticket.status !== 'closed' && (
            <View style={styles.replyBox}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.replyBtn, !replyText.trim() && styles.replyBtnDisabled]}
                onPress={handleReply}
                disabled={!replyText.trim() || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>ACTIONS</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.info + '14', borderColor: colors.info + '50' }]}
              onPress={() => handleAction('Assign')}
              activeOpacity={0.8}
              disabled={ticket.status === 'in_progress' || ticket.status === 'resolved' || ticket.status === 'closed' || isSubmitting}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.info} />
              <Text style={[styles.actionBtnText, { color: colors.info }]}>Assign</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success + '14', borderColor: colors.success + '50' }]}
              onPress={() => handleAction('Resolve')}
              activeOpacity={0.8}
              disabled={ticket.status === 'resolved' || ticket.status === 'closed' || isSubmitting}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              <Text style={[styles.actionBtnText, { color: colors.success }]}>Resolve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error + '14', borderColor: colors.error + '50' }]}
              onPress={() => handleAction('Close')}
              activeOpacity={0.8}
              disabled={ticket.status === 'closed' || isSubmitting}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
        </>)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBox: { flex: 1, gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: 16 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  infoKey: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', flexShrink: 0 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '600', textAlign: 'right', flex: 1 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityBadgeText: { fontSize: 12, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: { fontSize: 16, fontWeight: '800', color: colors.primary },
  userNameBox: { flex: 1, gap: 6 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700' },
  descriptionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  timeline: { gap: 0 },
  messageWrap: { position: 'relative' },
  timelineConnector: {
    position: 'absolute',
    left: 18,
    top: 44,
    bottom: -8,
    width: 2,
    backgroundColor: colors.borderLight,
    zIndex: 0,
  },
  messageBubble: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
  },
  adminBubble: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '30',
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  senderDot: { width: 8, height: 8, borderRadius: 4 },
  senderName: { flex: 1, fontSize: 13, fontWeight: '700' },
  messageTime: { fontSize: 11, color: colors.textTertiary },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  actionsSection: { marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  errorSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  replyBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  replyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyBtnDisabled: {
    backgroundColor: colors.border,
  },
});

export default TicketDetailScreen;
