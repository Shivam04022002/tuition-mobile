import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import {
  getCampaignStats, sendCampaign, cancelCampaign, duplicateCampaign,
  Campaign, CampaignStatsResult,
  campaignStatusColor, campaignStatusLabel,
  audienceLabel, campaignTypeLabel,
} from '../../services/adminCampaignApi';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; label: string; value: string; color?: string }> = ({
  icon, label, value, color,
}) => (
  <View style={detailStyles.infoRow}>
    <View style={detailStyles.infoIconBox}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <View style={detailStyles.infoContent}>
      <Text style={detailStyles.infoLabel}>{label}</Text>
      <Text style={[detailStyles.infoValue, color ? { color } : {}]}>{value}</Text>
    </View>
  </View>
);

const StatCard: React.FC<{ label: string; value: number | string; color?: string; sub?: string }> = ({
  label, value, color, sub,
}) => (
  <View style={detailStyles.statCard}>
    <Text style={[detailStyles.statValue, { color: color || colors.text }]}>{value}</Text>
    <Text style={detailStyles.statLabel}>{label}</Text>
    {sub ? <Text style={detailStyles.statSub}>{sub}</Text> : null}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const AdminCampaignDetailScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const token: string = useSelector((state: any) => state.auth?.token ?? '');
  const topPad     = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { campaignId } = route.params as { campaignId: string };

  const [data,          setData]          = useState<CampaignStatsResult | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [isActioning,   setIsActioning]   = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelReason,  setCancelReason]  = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCampaignStats(token, campaignId);
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaign.');
    } finally {
      setIsLoading(false);
    }
  }, [token, campaignId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const campaign = data?.campaign;
  const stats    = data?.stats;

  const handleSend = useCallback(() => {
    if (!campaign) return;
    Alert.alert(
      'Send Campaign',
      `Send "${campaign.title}" to ${audienceLabel(campaign.targetAudience)} now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          style: 'destructive',
          onPress: async () => {
            setIsActioning(true);
            try {
              const res = await sendCampaign(token, campaign._id);
              setData((prev) => prev ? { ...prev, campaign: res.data } : prev);
              Alert.alert('Sent', 'Campaign is being delivered.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to send.');
            } finally {
              setIsActioning(false);
            }
          },
        },
      ],
    );
  }, [campaign, token]);

  const handleCancel = useCallback(async () => {
    if (!campaign) return;
    setIsActioning(true);
    try {
      const res = await cancelCampaign(token, campaign._id, cancelReason);
      setData((prev) => prev ? { ...prev, campaign: res.data } : prev);
      setCancelVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to cancel.');
    } finally {
      setIsActioning(false);
    }
  }, [campaign, token, cancelReason]);

  const handleDuplicate = useCallback(async () => {
    if (!campaign) return;
    setIsActioning(true);
    try {
      await duplicateCampaign(token, campaign._id);
      Alert.alert('Duplicated', 'Campaign copied as a new draft.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to duplicate.');
    } finally {
      setIsActioning(false);
    }
  }, [campaign, token, navigation]);

  const handleViewAnalytics = useCallback(() => {
    navigation.navigate('AdminCampaignAnalytics', { campaignId });
  }, [navigation, campaignId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[detailStyles.container, { paddingTop: topPad }]}>
        <View style={detailStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={detailStyles.headerTitle}>Campaign Detail</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={detailStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !campaign) {
    return (
      <View style={[detailStyles.container, { paddingTop: topPad }]}>
        <View style={detailStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={detailStyles.headerTitle}>Campaign Detail</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={detailStyles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={detailStyles.errorText}>{error || 'Campaign not found.'}</Text>
          <TouchableOpacity style={detailStyles.retryBtn} onPress={fetchData}>
            <Text style={detailStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusColor = campaignStatusColor(campaign.status);
  const canSend     = ['draft', 'scheduled'].includes(campaign.status);
  const canCancel   = !['sent', 'cancelled'].includes(campaign.status);

  return (
    <View style={[detailStyles.container, { paddingTop: topPad }]}>
      {/* ── Header */}
      <View style={detailStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={detailStyles.headerTitle} numberOfLines={1}>{campaign.title}</Text>
          <Text style={detailStyles.headerSub}>{campaign.campaignId}</Text>
        </View>
        <View style={[detailStyles.statusPill, { backgroundColor: statusColor + '30' }]}>
          <Text style={[detailStyles.statusPillText, { color: statusColor }]}>
            {campaignStatusLabel(campaign.status)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={detailStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Campaign Info */}
        <View style={detailStyles.section}>
          <Text style={detailStyles.sectionTitle}>Campaign Info</Text>
          <InfoRow icon="megaphone-outline"   label="Type"     value={campaignTypeLabel(campaign.campaignType)} />
          <InfoRow icon="people-outline"      label="Audience" value={audienceLabel(campaign.targetAudience)} />
          <InfoRow icon="calendar-outline"    label="Created"  value={new Date(campaign.createdAt).toLocaleString('en-IN')} />
          {campaign.sentAt && (
            <InfoRow icon="send-outline"      label="Sent At"  value={new Date(campaign.sentAt).toLocaleString('en-IN')} color={colors.success} />
          )}
          {campaign.scheduledAt && campaign.status === 'scheduled' && (
            <InfoRow icon="time-outline"      label="Scheduled" value={new Date(campaign.scheduledAt).toLocaleString('en-IN')} color={colors.info} />
          )}
          {campaign.deepLinkScreen && (
            <InfoRow icon="link-outline"      label="Deep Link" value={campaign.deepLinkScreen} />
          )}
        </View>

        {/* ── Message */}
        <View style={detailStyles.section}>
          <Text style={detailStyles.sectionTitle}>Message</Text>
          <View style={detailStyles.messageBox}>
            <Text style={detailStyles.messageText}>{campaign.message}</Text>
          </View>
        </View>

        {/* ── Delivery Stats */}
        {campaign.status === 'sent' && stats && (
          <View style={detailStyles.section}>
            <Text style={detailStyles.sectionTitle}>Delivery Stats</Text>
            <View style={detailStyles.statsGrid}>
              <StatCard label="Targeted"  value={stats.totalTargeted.toLocaleString()} color={colors.text} />
              <StatCard label="Sent"      value={stats.sent.toLocaleString()}      color={colors.primary} />
              <StatCard label="Delivered" value={stats.delivered.toLocaleString()} color={colors.success} />
              <StatCard label="Opened"    value={stats.opened.toLocaleString()}    color={colors.info} />
              <StatCard label="Failed"    value={stats.failed.toLocaleString()}    color={stats.failed > 0 ? colors.error : colors.textSecondary} />
              <StatCard label="Open Rate" value={`${stats.openRate}%`}             color={colors.accent} sub="CTR" />
            </View>

            {/* Open Rate bar */}
            <View style={detailStyles.rateBar}>
              <View style={detailStyles.rateBarLabel}>
                <Text style={detailStyles.rateLabel}>Open Rate</Text>
                <Text style={[detailStyles.rateValue, { color: colors.success }]}>{stats.openRate}%</Text>
              </View>
              <View style={detailStyles.rateTrack}>
                <View style={[detailStyles.rateFill, { width: `${Math.min(stats.openRate, 100)}%`, backgroundColor: colors.success }]} />
              </View>
            </View>
          </View>
        )}

        {/* ── Daily Trend */}
        {data?.dailyTrend && data.dailyTrend.length > 0 && (
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionRow}>
              <Text style={detailStyles.sectionTitle}>Open Trend</Text>
              <TouchableOpacity onPress={handleViewAnalytics}>
                <Text style={detailStyles.viewAll}>Full Analytics →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={detailStyles.trendRow}>
                {data.dailyTrend.map((d) => (
                  <View key={d.date} style={detailStyles.trendItem}>
                    <Text style={detailStyles.trendCount}>{d.opened}</Text>
                    <Text style={detailStyles.trendDate}>{d.date.slice(5)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Cancel reason */}
        {campaign.cancelReason && (
          <View style={detailStyles.section}>
            <Text style={detailStyles.sectionTitle}>Cancellation</Text>
            <View style={[detailStyles.messageBox, { backgroundColor: colors.error + '10' }]}>
              <Text style={[detailStyles.messageText, { color: colors.error }]}>{campaign.cancelReason}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky action bar */}
      <View style={detailStyles.actionBar}>
        <TouchableOpacity style={detailStyles.secondaryBtn} onPress={handleDuplicate} disabled={isActioning}>
          <Ionicons name="copy-outline" size={16} color={colors.text} />
          <Text style={detailStyles.secondaryBtnText}>Duplicate</Text>
        </TouchableOpacity>
        {canCancel && (
          <TouchableOpacity style={detailStyles.cancelBtn} onPress={() => setCancelVisible(true)} disabled={isActioning}>
            <Ionicons name="ban-outline" size={16} color={colors.error} />
            <Text style={detailStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
        {canSend && (
          <TouchableOpacity style={detailStyles.sendBtn} onPress={handleSend} disabled={isActioning}>
            {isActioning
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={detailStyles.sendBtnText}>Send Now</Text>
                </>
            }
          </TouchableOpacity>
        )}
        {campaign.status === 'sent' && (
          <TouchableOpacity style={detailStyles.sendBtn} onPress={handleViewAnalytics}>
            <Ionicons name="bar-chart-outline" size={16} color="#fff" />
            <Text style={detailStyles.sendBtnText}>Analytics</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Cancel Modal */}
      <Modal visible={cancelVisible} transparent animationType="fade" onRequestClose={() => setCancelVisible(false)}>
        <View style={detailStyles.modalOverlay}>
          <View style={detailStyles.modalBox}>
            <Text style={detailStyles.modalTitle}>Cancel Campaign</Text>
            <Text style={detailStyles.modalSub}>Provide a reason (optional)</Text>
            <TextInput
              style={detailStyles.modalInput}
              placeholder="Reason for cancellation…"
              placeholderTextColor={colors.textTertiary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={detailStyles.modalActions}>
              <TouchableOpacity style={detailStyles.modalCancel} onPress={() => setCancelVisible(false)}>
                <Text style={detailStyles.modalCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={detailStyles.modalConfirm} onPress={handleCancel} disabled={isActioning}>
                {isActioning
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={detailStyles.modalConfirmText}>Confirm Cancel</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:   { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn:    { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText:   { color: '#fff', fontWeight: '600' },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  scroll: { padding: 16 },

  section: {
    backgroundColor: colors.card,
    borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll:      { fontSize: 13, color: colors.primary, fontWeight: '600' },

  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primary + '14',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, color: colors.textSecondary },
  infoValue:   { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 },

  messageBox:  { backgroundColor: colors.background, borderRadius: 10, padding: 12 },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '28%',
    backgroundColor: colors.background,
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  statSub:   { fontSize: 10, color: colors.textTertiary, marginTop: 2 },

  rateBar:      { marginTop: 4 },
  rateBarLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rateLabel:    { fontSize: 12, color: colors.textSecondary },
  rateValue:    { fontSize: 13, fontWeight: '700' },
  rateTrack:    { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  rateFill:     { height: '100%', borderRadius: 4 },

  trendRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  trendItem: { alignItems: 'center', minWidth: 44 },
  trendCount:{ fontSize: 14, fontWeight: '700', color: colors.primary },
  trendDate: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },

  actionBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
    ...shadows.sm,
  },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.error + '14', borderWidth: 1, borderColor: colors.error + '40',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.error },
  sendBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.success,
  },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modalBox: {
    backgroundColor: colors.card, borderRadius: 20,
    padding: 24,
  },
  modalTitle:       { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  modalSub:         { fontSize: 13, color: colors.textSecondary, marginBottom: 14 },
  modalInput: {
    backgroundColor: colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
    height: 80, textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions:      { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText:   { fontSize: 14, fontWeight: '600', color: colors.text },
  modalConfirm: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.error, alignItems: 'center',
  },
  modalConfirmText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default AdminCampaignDetailScreen;
