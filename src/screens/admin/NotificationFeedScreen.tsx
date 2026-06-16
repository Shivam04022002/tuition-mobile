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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { AppNotification } from '../../services/notificationApi';
import { useNotifications } from '../../hooks/useNotifications';

const ADMIN_CATEGORIES = [
  { key: '',            label: 'All' },
  { key: 'admin',       label: 'Admin' },
  { key: 'payment',     label: 'Payments' },
  { key: 'application', label: 'Applications' },
  { key: 'system',      label: 'System' },
];

function iconForType(type: string): { name: string; color: string } {
  switch (type) {
    case 'REFUND_REQUEST':       return { name: 'return-down-back-outline', color: '#F59E0B' };
    case 'TEACHER_REGISTRATION': return { name: 'school-outline',            color: '#7B2FF7' };
    case 'IMPORT_COMPLETED':     return { name: 'cloud-upload-outline',      color: '#3B82F6' };
    case 'PAYMENT_SUCCESS':      return { name: 'checkmark-circle-outline', color: '#10B981' };
    case 'REFUND_APPROVED':      return { name: 'cash-outline',             color: '#10B981' };
    case 'REFUND_REJECTED':      return { name: 'close-circle-outline',     color: '#EF4444' };
    case 'TEACHER_APPLIED':      return { name: 'person-add-outline',       color: '#7B2FF7' };
    default:                     return { name: 'notifications-outline',    color: '#64748B' };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const NotificationFeedScreen: React.FC = () => {
  const theme = useTheme();

  const {
    notifications,
    unreadCount,
    isLoading: loading,
    isRefreshing: refreshing,
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
    Alert.alert('Remove', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
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
        style={[
          styles.card,
          {
            backgroundColor: unread ? theme.colors.secondary + '0A' : theme.colors.card,
            borderLeftColor: unread ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => handleRead(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '1A' }]}>
          <Ionicons name={iconName as any} size={20} color={iconColor} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text, fontWeight: unread ? '700' : '500' }]}
              numberOfLines={1}>
              {item.title}
            </Text>
            {unread && (
              <View style={[styles.dot, { backgroundColor: theme.colors.secondary }]} />
            )}
          </View>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
              {timeAgo(item.createdAt)}
            </Text>
            <View style={[styles.catChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.catText, { color: theme.colors.textTertiary }]}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="notifications-outline" size={52} color={theme.colors.textTertiary} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No notifications</Text>
    </View>
  );

  const renderFooter = () =>
    loadingMore
      ? <ActivityIndicator size="small" color={theme.colors.secondary} style={{ marginVertical: 12 }} />
      : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[styles.subTitle, { color: theme.colors.textSecondary }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { borderColor: theme.colors.secondary }]}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done-outline" size={14} color={theme.colors.secondary} />
            <Text style={[styles.markAllText, { color: theme.colors.secondary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <FlatList
        data={ADMIN_CATEGORIES}
        horizontal
        keyExtractor={(c) => c.key}
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: category === cat.key ? theme.colors.secondary : theme.colors.backgroundSecondary,
                borderColor: category === cat.key ? theme.colors.secondary : theme.colors.border,
              },
            ]}
            onPress={() => setCategory(cat.key)}
          >
            <Text style={[styles.chipText, { color: category === cat.key ? '#fff' : theme.colors.textSecondary }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Unable to load notifications</Text>
          <TouchableOpacity onPress={retry} style={[styles.retryBtn, { backgroundColor: theme.colors.secondary }]} activeOpacity={0.75}>
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
          contentContainerStyle={[styles.list, notifications.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.secondary}
              colors={[theme.colors.secondary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  subTitle:    { fontSize: 12, marginTop: 1 },
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  markAllText: { fontSize: 12, fontWeight: '600' },
  chipRow:     { maxHeight: 48, paddingVertical: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText:    { fontSize: 12, fontWeight: '600' },
  list:        { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24 },
  listEmpty:   { flex: 1 },
  card:        { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, marginBottom: 10, gap: 10 },
  iconWrap:    { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content:     { flex: 1 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  title:       { fontSize: 13, flex: 1 },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  body:        { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  meta:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time:        { fontSize: 11 },
  catChip:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  catText:     { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText:   { fontSize: 15, fontWeight: '500' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },
  errorText:   { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:    { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText:   { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default NotificationFeedScreen;
