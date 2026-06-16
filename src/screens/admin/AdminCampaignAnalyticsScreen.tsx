import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import {
  getCampaignStats, CampaignStatsResult,
  campaignStatusColor, campaignStatusLabel, audienceLabel, campaignTypeLabel,
} from '../../services/adminCampaignApi';

// ─────────────────────────────────────────────────────────────────────────────
// Bar Chart (pure RN — no external lib)
// ─────────────────────────────────────────────────────────────────────────────
interface BarChartProps {
  data:   { label: string; value: number }[];
  color?: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, color = colors.primary, height = 120 }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={chartStyles.container}>
      <View style={[chartStyles.barsRow, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={chartStyles.barCol}>
            <Text style={chartStyles.barValue}>{d.value > 0 ? d.value : ''}</Text>
            <View style={chartStyles.barTrack}>
              <View
                style={[
                  chartStyles.barFill,
                  {
                    height: `${(d.value / max) * 100}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={chartStyles.labelsRow}>
        {data.map((d, i) => (
          <Text key={i} style={chartStyles.barLabel} numberOfLines={1}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container:  { width: '100%' },
  barsRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 4 },
  barCol:     { flex: 1, alignItems: 'center' },
  barValue:   { fontSize: 9, color: colors.textSecondary, marginBottom: 2 },
  barTrack:   { width: '100%', flex: 1, justifyContent: 'flex-end', backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill:    { width: '100%', borderRadius: 4 },
  labelsRow:  { flexDirection: 'row', gap: 6, paddingHorizontal: 4, marginTop: 6 },
  barLabel:   { flex: 1, textAlign: 'center', fontSize: 9, color: colors.textSecondary },
});

// ─────────────────────────────────────────────────────────────────────────────
// Metric Tile
// ─────────────────────────────────────────────────────────────────────────────
const MetricTile: React.FC<{
  label: string; value: number | string; icon: string; color: string; sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <View style={[analyticsStyles.tile, { borderLeftColor: color }]}>
    <View style={[analyticsStyles.tileIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <View style={analyticsStyles.tileContent}>
      <Text style={[analyticsStyles.tileValue, { color }]}>{value}</Text>
      <Text style={analyticsStyles.tileLabel}>{label}</Text>
      {sub ? <Text style={analyticsStyles.tileSub}>{sub}</Text> : null}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const AdminCampaignAnalyticsScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const token: string = useSelector((state: any) => state.auth?.token ?? '');
  const topPad     = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { campaignId } = route.params as { campaignId: string };

  const [data,      setData]      = useState<CampaignStatsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCampaignStats(token, campaignId);
      setData(res.data);
      if (__DEV__) console.log('[Analytics] Campaign Opened:', res.data.campaign.campaignId);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [token, campaignId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleShare = useCallback(async () => {
    if (!data) return;
    const { campaign, stats } = data;
    const text = [
      `📊 Campaign Analytics Report`,
      `Campaign: ${campaign.title} (${campaign.campaignId})`,
      `Status: ${campaignStatusLabel(campaign.status)}`,
      `Audience: ${audienceLabel(campaign.targetAudience)}`,
      ``,
      `📬 Delivery Stats:`,
      `Targeted:  ${stats.totalTargeted.toLocaleString()}`,
      `Sent:      ${stats.sent.toLocaleString()}`,
      `Delivered: ${stats.delivered.toLocaleString()}`,
      `Opened:    ${stats.opened.toLocaleString()}`,
      `Failed:    ${stats.failed.toLocaleString()}`,
      ``,
      `📈 Rates:`,
      `Open Rate: ${stats.openRate}%`,
      `CTR:       ${stats.ctr}%`,
    ].join('\n');
    await Share.share({ message: text, title: 'Campaign Analytics' });
  }, [data]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[analyticsStyles.container, { paddingTop: topPad }]}>
        <View style={analyticsStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={analyticsStyles.headerTitle}>Campaign Analytics</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={analyticsStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[analyticsStyles.container, { paddingTop: topPad }]}>
        <View style={analyticsStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={analyticsStyles.headerTitle}>Campaign Analytics</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={analyticsStyles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={analyticsStyles.errorText}>{error || 'No data available.'}</Text>
          <TouchableOpacity style={analyticsStyles.retryBtn} onPress={fetchData}>
            <Text style={analyticsStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { campaign, stats, dailyTrend } = data;
  const statusColor = campaignStatusColor(campaign.status);

  // Funnel data
  const funnelData = [
    { label: 'Targeted', value: stats.totalTargeted, color: colors.textSecondary },
    { label: 'Sent',     value: stats.sent,           color: colors.primary },
    { label: 'Delivered',value: stats.delivered,      color: colors.info },
    { label: 'Opened',   value: stats.opened,         color: colors.success },
    { label: 'Failed',   value: stats.failed,         color: colors.error },
  ];
  const maxFunnelVal = Math.max(stats.totalTargeted, 1);

  return (
    <View style={[analyticsStyles.container, { paddingTop: topPad }]}>
      {/* ── Header */}
      <View style={analyticsStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={analyticsStyles.headerTitle} numberOfLines={1}>{campaign.title}</Text>
          <Text style={analyticsStyles.headerSub}>{campaign.campaignId} · Analytics</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={analyticsStyles.shareBtn}>
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={analyticsStyles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Campaign Meta */}
        <View style={analyticsStyles.metaRow}>
          <View style={[analyticsStyles.statusPill, { backgroundColor: statusColor + '22' }]}>
            <Text style={[analyticsStyles.statusText, { color: statusColor }]}>
              {campaignStatusLabel(campaign.status)}
            </Text>
          </View>
          <Text style={analyticsStyles.metaChip}>{campaignTypeLabel(campaign.campaignType)}</Text>
          <Text style={analyticsStyles.metaChip}>{audienceLabel(campaign.targetAudience)}</Text>
        </View>

        {/* ── Key Metric Tiles */}
        <View style={analyticsStyles.tilesGrid}>
          <MetricTile
            label="Total Targeted"
            value={stats.totalTargeted.toLocaleString()}
            icon="people-outline"
            color={colors.textSecondary}
          />
          <MetricTile
            label="Sent"
            value={stats.sent.toLocaleString()}
            icon="send-outline"
            color={colors.primary}
          />
          <MetricTile
            label="Opened"
            value={stats.opened.toLocaleString()}
            icon="eye-outline"
            color={colors.success}
          />
          <MetricTile
            label="Open Rate"
            value={`${stats.openRate}%`}
            icon="trending-up-outline"
            color={colors.accent}
            sub="of sent"
          />
          <MetricTile
            label="CTR"
            value={`${stats.ctr}%`}
            icon="cursor-text"
            color={colors.info}
            sub="click-through"
          />
          <MetricTile
            label="Failed"
            value={stats.failed.toLocaleString()}
            icon="warning-outline"
            color={stats.failed > 0 ? colors.error : colors.textTertiary}
          />
        </View>

        {/* ── Delivery Funnel */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Delivery Funnel</Text>
          {funnelData.map((f, i) => (
            <View key={i} style={analyticsStyles.funnelRow}>
              <Text style={analyticsStyles.funnelLabel}>{f.label}</Text>
              <View style={analyticsStyles.funnelTrack}>
                <View
                  style={[
                    analyticsStyles.funnelFill,
                    {
                      width: `${(f.value / maxFunnelVal) * 100}%`,
                      backgroundColor: f.color,
                    },
                  ]}
                />
              </View>
              <Text style={[analyticsStyles.funnelCount, { color: f.color }]}>
                {f.value.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Rate Overview */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Rate Overview</Text>
          {[
            {
              label: 'Delivery Rate',
              rate:  stats.totalTargeted > 0 ? parseFloat(((stats.delivered / stats.totalTargeted) * 100).toFixed(1)) : 0,
              color: colors.primary,
            },
            {
              label: 'Open Rate',
              rate:  stats.openRate,
              color: colors.success,
            },
            {
              label: 'CTR',
              rate:  stats.ctr,
              color: colors.info,
            },
            {
              label: 'Failure Rate',
              rate:  stats.totalTargeted > 0 ? parseFloat(((stats.failed / stats.totalTargeted) * 100).toFixed(1)) : 0,
              color: colors.error,
            },
          ].map((r) => (
            <View key={r.label} style={analyticsStyles.rateRow}>
              <View style={analyticsStyles.rateLabelRow}>
                <Text style={analyticsStyles.rateLabel}>{r.label}</Text>
                <Text style={[analyticsStyles.rateValue, { color: r.color }]}>{r.rate}%</Text>
              </View>
              <View style={analyticsStyles.rateTrack}>
                <View
                  style={[
                    analyticsStyles.rateFill,
                    { width: `${Math.min(r.rate, 100)}%`, backgroundColor: r.color },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── Daily Open Trend */}
        {dailyTrend.length > 0 && (
          <View style={analyticsStyles.section}>
            <Text style={analyticsStyles.sectionTitle}>Daily Opens</Text>
            <BarChart
              data={dailyTrend.map((d) => ({ label: d.date.slice(5), value: d.opened }))}
              color={colors.success}
              height={110}
            />
          </View>
        )}

        {/* ── Campaign Timeline */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Timeline</Text>
          {[
            { label: 'Created',   date: campaign.createdAt,   icon: 'create-outline',    color: colors.textSecondary },
            ...(campaign.scheduledAt ? [{ label: 'Scheduled', date: campaign.scheduledAt, icon: 'time-outline', color: colors.info }] : []),
            ...(campaign.sentAt    ? [{ label: 'Sent',       date: campaign.sentAt,       icon: 'send-outline',  color: colors.success }] : []),
          ].map((t, i) => (
            <View key={i} style={analyticsStyles.timelineRow}>
              <View style={[analyticsStyles.timelineDot, { backgroundColor: t.color }]} />
              <View style={analyticsStyles.timelineContent}>
                <Text style={analyticsStyles.timelineLabel}>{t.label}</Text>
                <Text style={analyticsStyles.timelineDate}>
                  {new Date(t.date).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const analyticsStyles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn:   { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText:  { color: '#fff', fontWeight: '600' },

  header: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { padding: 16 },

  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  metaChip:   { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, color: colors.textSecondary },

  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  tile: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  tileIcon:    { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tileContent: { flex: 1 },
  tileValue:   { fontSize: 18, fontWeight: '800' },
  tileLabel:   { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tileSub:     { fontSize: 10, color: colors.textTertiary, marginTop: 1 },

  section: {
    backgroundColor: colors.card, borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },

  funnelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  funnelLabel:{ width: 70, fontSize: 12, color: colors.text, fontWeight: '500' },
  funnelTrack:{ flex: 1, height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  funnelFill: { height: '100%', borderRadius: 5 },
  funnelCount:{ width: 52, textAlign: 'right', fontSize: 12, fontWeight: '700' },

  rateRow:     { marginBottom: 12 },
  rateLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  rateLabel:   { fontSize: 12, color: colors.text },
  rateValue:   { fontSize: 13, fontWeight: '700' },
  rateTrack:   { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  rateFill:    { height: '100%', borderRadius: 4 },

  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineContent: {},
  timelineLabel:   { fontSize: 13, fontWeight: '600', color: colors.text },
  timelineDate:    { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

export default AdminCampaignAnalyticsScreen;
