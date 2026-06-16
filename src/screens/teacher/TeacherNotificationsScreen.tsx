import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { AppNotification } from '../../services/notificationApi';
import { useNotifications } from '../../hooks/useNotifications';

// ── Category filter chips ──────────────────────────────────────────────────────
const CATEGORIES = [
  { key: '',             label: 'All' },
  { key: 'application',  label: 'Applications' },
  { key: 'demo',         label: 'Demos' },
  { key: 'lead',         label: 'Leads' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'credits',      label: 'Credits' },
  { key: 'kyc',          label: 'KYC' },
  { key: 'promotions',   label: 'Promotions' },
  { key: 'system',       label: 'System' },
];

// ── Icon map by type ──────────────────────────────────────────────────────────
function iconForType(type: string): { name: string; color: string } {
  switch (type) {
    case 'NEW_LEAD_MATCH':           return { name: 'star-outline',           color: colors.accent };
    case 'APPLICATION_SHORTLISTED':  return { name: 'bookmark-outline',       color: colors.secondary };
    case 'APPLICATION_ACCEPTED':     return { name: 'checkmark-circle-outline',color: colors.success };
    case 'APPLICATION_REJECTED':     return { name: 'close-circle-outline',   color: colors.error };
    case 'DEMO_CONFIRMED':           return { name: 'videocam-outline',        color: colors.info };
    case 'DEMO_REQUEST_RECEIVED':    return { name: 'calendar-outline',        color: colors.info };
    case 'CONTACT_REQUEST_RECEIVED': return { name: 'call-outline',            color: colors.primary };
    case 'LEAD_UNLOCK_SUCCESS':      return { name: 'lock-open-outline',       color: colors.success };
    case 'SUBSCRIPTION_CHANGED':     return { name: 'card-outline',            color: colors.secondary };
    case 'CREDIT_CHANGED':           return { name: 'wallet-outline',          color: colors.accent };
    case 'KYC_APPROVED':             return { name: 'shield-checkmark-outline',color: colors.success };
    case 'KYC_REJECTED':             return { name: 'shield-outline',          color: colors.error };
    case 'KYC_SUBMITTED':            return { name: 'document-text-outline',   color: colors.info };
    case 'KYC_REUPLOAD_REQUIRED':    return { name: 'cloud-upload-outline',    color: colors.accent };
    case 'CAMPAIGN_BROADCAST':       return { name: 'megaphone-outline',       color: colors.primary };
    default:                         return { name: 'notifications-outline',   color: colors.textSecondary };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main screen ───────────────────────────────────────────────────────────────
const TeacherNotificationsScreen: React.FC = () => {
  const insets  = useSafeAreaInsets();
  const topPad  = insets.top;

  const {
    notifications,
    unreadCount,
    isLoading:     loading,
    isRefreshing:  refreshing,
    isLoadingMore: loadingMore,
    error,
    refresh,
    retry,
    loadMore,
    markRead,
    markAllRead,
    deleteNotification,
    setCategory,
    category,
  } = useNotifications();

  const handleRead = (item: AppNotification) => {
    if (!item.isRead) markRead(item._id);
  };

  const handleDelete = (item: AppNotification) => {
    Alert.alert('Delete', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNotification(item._id),
      },
    ]);
  };

  const handleMarkAllRead = () => {
    markAllRead().catch((err: any) =>
      Alert.alert('Error', err?.message || 'Failed to mark all as read'),
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const { name: iconName, color: iconColor } = iconForType(item.type);
    const unread = !item.isRead;

    return (
      <TouchableOpacity
        style={[styles.card, unread && styles.cardUnread]}
        onPress={() => handleRead(item)}
        activeOpacity={0.80}
      >
        {unread && <View style={styles.unreadBar} />}

        <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={iconName as any} size={22} color={iconColor} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontWeight: unread ? '700' : '500' }]} numberOfLines={1}>
              {item.title}
            </Text>
            {unread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteBtn}
        >
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="notifications-outline" size={44} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptyBody}>No notifications here. Check back later.</Text>
    </View>
  );

  const renderFooter = () =>
    loadingMore
      ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
      : null;

  return (
    <View style={styles.safe}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <View style={styles.headerBadgeDot} />
              <Text style={styles.headerBadgeText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn} activeOpacity={0.75}>
            <Ionicons name="checkmark-done-outline" size={15} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category chips ── */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={(c) => c.key}
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipContent}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.chip, category === cat.key && styles.chipActive]}
            onPress={() => setCategory(cat.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, category === cat.key && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
          <Text style={styles.errorText}>Unable to load notifications</Text>
          <TouchableOpacity onPress={retry} style={styles.retryBtn} activeOpacity={0.75}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[
            styles.list,
            notifications.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle:    { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  headerBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  headerBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pink },
  headerBadgeText:{ fontSize: 12, color: 'rgba(255,255,255,0.80)', fontWeight: '600' },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    ...shadows.sm,
  },
  markAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  chipRow:     { maxHeight: 52, marginTop: 14 },
  chipContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  list:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardUnread: {
    backgroundColor: colors.primary + '07',
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  unreadBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0, width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
  },
  iconWrap:  { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content:   { flex: 1 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  title:     { fontSize: 14, color: colors.text, flex: 1, marginRight: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, flexShrink: 0 },
  body:      { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 5 },
  time:      { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary + '14', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyBody:     { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingSpinner:{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '14', justifyContent: 'center', alignItems: 'center' },
  loadingText:   { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  errorText:     { fontSize: 15, color: colors.text, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:      { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary },
  retryText:     { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default TeacherNotificationsScreen;
