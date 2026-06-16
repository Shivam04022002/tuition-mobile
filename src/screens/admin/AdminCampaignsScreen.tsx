import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  ScrollView, Alert, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useCampaigns } from '../../hooks/useCampaigns';
import {
  Campaign, CampaignType, CampaignAudience,
  campaignStatusColor, campaignStatusLabel,
  audienceLabel, campaignTypeLabel,
  CreateCampaignInput,
} from '../../services/adminCampaignApi';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: '',           label: 'All' },
  { key: 'draft',      label: 'Draft' },
  { key: 'scheduled',  label: 'Scheduled' },
  { key: 'sending',    label: 'Sending' },
  { key: 'sent',       label: 'Sent' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const CAMPAIGN_TYPES: { key: CampaignType; label: string }[] = [
  { key: 'broadcast',     label: 'Broadcast' },
  { key: 'scheduled',     label: 'Scheduled' },
  { key: 'triggered',     label: 'Triggered' },
  { key: 'promotional',   label: 'Promotional' },
  { key: 'system',        label: 'System' },
  { key: 'transactional', label: 'Transactional' },
];

const AUDIENCES: { key: CampaignAudience; label: string }[] = [
  { key: 'all_users',         label: 'All Users' },
  { key: 'all_teachers',      label: 'All Teachers' },
  { key: 'all_parents',       label: 'All Parents' },
  { key: 'verified_teachers', label: 'Verified Teachers' },
  { key: 'premium_teachers',  label: 'Premium Teachers' },
  { key: 'free_teachers',     label: 'Free Teachers' },
  { key: 'kyc_pending',       label: 'KYC Pending' },
  { key: 'active_parents',    label: 'Active Parents' },
  { key: 'inactive_users',    label: 'Inactive Users' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const CampaignSkeleton: React.FC = () => (
  <View style={styles.skeletonCard}>
    <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
    <View style={[styles.skeletonLine, { width: '90%', height: 11, marginTop: 8 }]} />
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      <View style={[styles.skeletonLine, { width: 64, height: 22, borderRadius: 11 }]} />
      <View style={[styles.skeletonLine, { width: 80, height: 22, borderRadius: 11 }]} />
    </View>
  </View>
);

interface CampaignCardProps {
  item:       Campaign;
  onPress:    () => void;
  onSend:     () => void;
  onDuplicate:() => void;
  onDelete:   () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = React.memo(
  ({ item, onPress, onSend, onDuplicate, onDelete }) => {
    const statusColor = campaignStatusColor(item.status);
    const canSend     = ['draft', 'scheduled'].includes(item.status);
    const canDelete   = !['sending', 'sent'].includes(item.status);

    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {campaignStatusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.campaignId}>{item.campaignId}</Text>
        </View>

        {/* Message preview */}
        <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>

        {/* Chips */}
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: colors.primary + '14' }]}>
            <Ionicons name="megaphone-outline" size={11} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {campaignTypeLabel(item.campaignType)}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.secondary + '14' }]}>
            <Ionicons name="people-outline" size={11} color={colors.secondary} />
            <Text style={[styles.chipText, { color: colors.secondary }]}>
              {audienceLabel(item.targetAudience)}
            </Text>
          </View>
        </View>

        {/* Stats row for sent campaigns */}
        {item.status === 'sent' && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.deliveryStats.sent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.deliveryStats.opened.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Opened</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {item.deliveryStats.openRate}%
              </Text>
              <Text style={styles.statLabel}>Open Rate</Text>
            </View>
          </View>
        )}

        {/* Scheduled date */}
        {item.scheduledAt && item.status === 'scheduled' && (
          <View style={styles.scheduleRow}>
            <Ionicons name="time-outline" size={13} color={colors.info} />
            <Text style={styles.scheduleText}>
              Scheduled: {new Date(item.scheduledAt).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.cardActions}>
          {canSend && (
            <TouchableOpacity style={[styles.actionBtn, styles.sendBtn]} onPress={onSend}>
              <Ionicons name="send-outline" size={13} color="#fff" />
              <Text style={styles.sendBtnText}>Send Now</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={onDuplicate}>
            <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {canDelete && (
            <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={onPress}>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Create Campaign Modal
// ─────────────────────────────────────────────────────────────────────────────
interface CreateModalProps {
  visible:  boolean;
  onClose:  () => void;
  onCreate: (input: CreateCampaignInput) => void;
  isSaving: boolean;
}

const CreateCampaignModal: React.FC<CreateModalProps> = ({ visible, onClose, onCreate, isSaving }) => {
  const [title,          setTitle]          = useState('');
  const [message,        setMessage]        = useState('');
  const [campaignType,   setCampaignType]   = useState<CampaignType>('broadcast');
  const [targetAudience, setTargetAudience] = useState<CampaignAudience>('all_users');
  const [deepLinkScreen, setDeepLinkScreen] = useState('');
  const [scheduledAt,    setScheduledAt]    = useState('');

  const reset = () => {
    setTitle(''); setMessage(''); setCampaignType('broadcast');
    setTargetAudience('all_users'); setDeepLinkScreen(''); setScheduledAt('');
  };

  const handleCreate = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation', 'Title and message are required.');
      return;
    }
    onCreate({
      title: title.trim(),
      message: message.trim(),
      campaignType,
      targetAudience,
      deepLinkScreen: deepLinkScreen.trim() || undefined,
      scheduledAt:    scheduledAt.trim()    || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          {/* Header */}
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>New Campaign</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={modalStyles.label}>Campaign Title *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g. Summer Promo for Teachers"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />

            {/* Message */}
            <Text style={modalStyles.label}>Message *</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea]}
              placeholder="Notification message body…"
              placeholderTextColor={colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <Text style={modalStyles.charCount}>{message.length}/500</Text>

            {/* Campaign Type */}
            <Text style={modalStyles.label}>Campaign Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.chipsScroll}>
              {CAMPAIGN_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[modalStyles.optionChip, campaignType === t.key && modalStyles.optionChipActive]}
                  onPress={() => setCampaignType(t.key)}
                >
                  <Text style={[modalStyles.optionChipText, campaignType === t.key && modalStyles.optionChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Target Audience */}
            <Text style={modalStyles.label}>Target Audience</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.chipsScroll}>
              {AUDIENCES.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[modalStyles.optionChip, targetAudience === a.key && modalStyles.optionChipActive]}
                  onPress={() => setTargetAudience(a.key)}
                >
                  <Text style={[modalStyles.optionChipText, targetAudience === a.key && modalStyles.optionChipTextActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Deep Link (optional) */}
            <Text style={modalStyles.label}>Deep Link Screen (optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g. TeacherCredits"
              placeholderTextColor={colors.textTertiary}
              value={deepLinkScreen}
              onChangeText={setDeepLinkScreen}
            />

            {/* Schedule (optional) */}
            <Text style={modalStyles.label}>Schedule Date/Time (optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="ISO date e.g. 2026-07-01T10:00:00"
              placeholderTextColor={colors.textTertiary}
              value={scheduledAt}
              onChangeText={setScheduledAt}
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          <TouchableOpacity
            style={[modalStyles.createBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={modalStyles.createBtnText}>Create Campaign</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const AdminCampaignsScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topPad     = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const {
    campaigns, summary, isLoading, isRefreshing, isLoadingMore, isSaving,
    hasMore, error, actionError,
    refresh, retry, loadMore,
    statusFilter, setStatusFilter,
    createCampaign: doCreate,
    sendCampaign:   doSend,
    deleteCampaign: doDelete,
    duplicateCampaign: doDuplicate,
    clearActionError,
  } = useCampaigns();

  const [showCreate, setShowCreate] = useState(false);

  const handleSend = useCallback((campaign: Campaign) => {
    Alert.alert(
      'Send Campaign',
      `Send "${campaign.title}" to ${audienceLabel(campaign.targetAudience)} now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: () => doSend(campaign._id),
        },
      ],
    );
  }, [doSend]);

  const handleDelete = useCallback((campaign: Campaign) => {
    Alert.alert(
      'Delete Campaign',
      `Delete "${campaign.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => doDelete(campaign._id) },
      ],
    );
  }, [doDelete]);

  const renderItem = useCallback(({ item }: { item: Campaign }) => (
    <CampaignCard
      item={item}
      onPress={() => navigation.navigate('AdminCampaignDetail', { campaignId: item._id })}
      onSend={() => handleSend(item)}
      onDuplicate={() => doDuplicate(item._id)}
      onDelete={() => handleDelete(item)}
    />
  ), [navigation, handleSend, doDuplicate, handleDelete]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />;
  }, [isLoadingMore]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ── Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Campaigns</Text>
          <Text style={styles.headerSub}>Push & In-App Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Summary Strip */}
      {summary && (
        <View style={styles.summaryStrip}>
          {[
            { label: 'Total',     value: summary.total,              color: colors.text },
            { label: 'Sent',      value: summary.byStatus.sent ?? 0, color: colors.success },
            { label: 'Scheduled', value: summary.byStatus.scheduled ?? 0, color: colors.info },
            { label: 'Draft',     value: summary.byStatus.draft ?? 0, color: colors.textSecondary },
          ].map((s) => (
            <View key={s.label} style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              {summary.totals.overallOpenRate}%
            </Text>
            <Text style={styles.summaryLabel}>Open Rate</Text>
          </View>
        </View>
      )}

      {/* ── Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContent}
        style={styles.filterTabs}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, statusFilter === f.key && styles.filterTabActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.filterTabText, statusFilter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Action error banner */}
      {actionError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={14} color={colors.error} />
          <Text style={styles.errorBannerText}>{actionError}</Text>
          <TouchableOpacity onPress={clearActionError}>
            <Ionicons name="close" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => <CampaignSkeleton key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : campaigns.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="megaphone-outline" size={56} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No campaigns yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first campaign</Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createFirstText}>Create Campaign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* ── Create Modal */}
      <CreateCampaignModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={doCreate}
        isSaving={isSaving}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.70)', marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'space-around',
  },
  summaryItem:  { alignItems: 'center' },
  summaryValue: { fontSize: 17, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Filter tabs
  filterTabs:        { backgroundColor: colors.card, maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterTabsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.background,
  },
  filterTabActive:     { backgroundColor: colors.primary },
  filterTabText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterTabTextActive: { color: '#fff', fontWeight: '600' },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.error + '14',
    marginHorizontal: 16, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: colors.error },

  // List
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },

  // Campaign card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader:   { marginBottom: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle:    { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: '600' },
  campaignId:   { fontSize: 11, color: colors.textTertiary },
  cardMessage:  { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  chipText: { fontSize: 11, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    marginBottom: 10,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 14, fontWeight: '700', color: colors.text },
  statLabel:   { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },

  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  scheduleText:{ fontSize: 12, color: colors.info },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  sendBtn:      { backgroundColor: colors.success, flex: 1 },
  sendBtnText:  { fontSize: 13, fontWeight: '600', color: '#fff' },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },

  // Center states
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:      { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn:       { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText:      { color: '#fff', fontWeight: '600' },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptySubtitle:  { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  createFirstBtn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  createFirstText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  // Skeleton
  skeletonCard: {
    backgroundColor: colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  skeletonLine: { backgroundColor: colors.border, borderRadius: 6 },
});

const modalStyles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle:  { fontSize: 18, fontWeight: '700', color: colors.text },
  label:       { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  textArea:    { height: 90, textAlignVertical: 'top' },
  charCount:   { fontSize: 11, color: colors.textTertiary, textAlign: 'right', marginTop: 4 },
  chipsScroll: { marginBottom: 2 },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  optionChipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  optionChipText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  optionChipTextActive: { color: '#fff', fontWeight: '600' },
  createBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default AdminCampaignsScreen;
