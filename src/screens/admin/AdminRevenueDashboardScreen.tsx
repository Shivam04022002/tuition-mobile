import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useAdminRevenue } from '../../hooks/useAdminRevenue';
import { RevenueFilters, RevenueRange } from '../../services/adminRevenueApi';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) => `₹${n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0)}`;
const fmtNum      = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
const growthColor = (g: number) => g > 0 ? colors.success : g < 0 ? colors.error : colors.textSecondary;
const growthIcon  = (g: number): any => g > 0 ? 'trending-up-outline' : g < 0 ? 'trending-down-outline' : 'remove-outline';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonBox: React.FC<{ w?: number | string; h?: number; r?: number; style?: any }> = ({ w = '100%', h = 16, r = 6, style }) => (
  <View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: colors.border + '80' }, style]} />
);

// ── Filter Bar
const RANGES: Array<{ label: string; value: RevenueRange }> = [
  { label: 'Today',  value: 'today' },
  { label: '7 Days', value: '7d'    },
  { label: '30 Days', value: '30d'  },
  { label: '90 Days', value: '90d'  },
  { label: 'This Year', value: 'year' },
];

const RevenueFiltersBar: React.FC<{
  filters: RevenueFilters;
  onFilter: (f: RevenueFilters) => void;
}> = ({ filters, onFilter }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.filtersScroll}
    contentContainerStyle={styles.filtersContent}
  >
    {RANGES.map(r => {
      const active = filters.range === r.value;
      return (
        <TouchableOpacity
          key={r.value}
          style={[styles.filterChip, active && styles.filterChipActive]}
          onPress={() => {
            if (__DEV__) console.log('[RevenueFilters] Revenue Filter Applied:', r.value);
            onFilter({ range: r.value });
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{r.label}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ── Summary Metric Card
const MetricCard: React.FC<{
  icon:      string;
  iconColor: string;
  label:     string;
  value:     string;
  sub?:      string;
  growth?:   number;
  half?:     boolean;
}> = ({ icon, iconColor, label, value, sub, growth, half }) => (
  <View style={[styles.metricCard, half && { width: (width - 48) / 2 }]}>
    <View style={[styles.metricIcon, { backgroundColor: iconColor + '18' }]}>
      <Ionicons name={icon as any} size={20} color={iconColor} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
    {growth !== undefined && (
      <View style={styles.metricGrowth}>
        <Ionicons name={growthIcon(growth)} size={12} color={growthColor(growth)} />
        <Text style={[styles.metricGrowthText, { color: growthColor(growth) }]}>
          {growth > 0 ? '+' : ''}{growth}%
        </Text>
      </View>
    )}
    {sub && <Text style={styles.metricSub}>{sub}</Text>}
  </View>
);

// ── Section Header
const SectionHdr: React.FC<{ title: string; icon: string; color?: string }> = ({ title, icon, color = colors.text }) => (
  <View style={styles.sectionHdr}>
    <Ionicons name={icon as any} size={18} color={color} />
    <Text style={[styles.sectionHdrText, { color }]}>{title}</Text>
  </View>
);

// ── Simple Bar Chart (pure RN, no libs)
const SimpleBarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
}> = ({ data, title }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const chartW = width - 64;
  const barW = data.length > 0 ? Math.max(Math.floor(chartW / data.length) - 6, 8) : 20;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartBars}>
        {data.map((d, i) => (
          <View key={i} style={styles.chartBarCol}>
            <View style={styles.chartBarTrack}>
              <View style={[
                styles.chartBarFill,
                {
                  width:  barW,
                  height: Math.max((d.value / max) * 100, 2),
                  backgroundColor: d.color ?? colors.primary,
                },
              ]} />
            </View>
            <Text style={styles.chartBarLabel} numberOfLines={1}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Plan Distribution Row
const PlanRow: React.FC<{ name: string; count: number; total: number; color: string }> = ({ name, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.planRow}>
      <View style={[styles.planDot, { backgroundColor: color }]} />
      <Text style={styles.planName}>{name}</Text>
      <View style={styles.planBarTrack}>
        <View style={[styles.planBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.planCount}>{count}</Text>
      <Text style={styles.planPct}>{pct}%</Text>
    </View>
  );
};

// ── Payment Row
const PaymentRow: React.FC<{
  type:          string;
  amount:        number;
  status:        string;
  method:        string;
  date:          string | null;
  invoiceNum?:   string;
}> = ({ type, amount, status, method, date, invoiceNum }) => {
  const statusColor = status === 'completed' ? colors.success : status === 'failed' ? colors.error : status === 'refunded' ? colors.warning : colors.textSecondary;
  const typeLabel   = type === 'subscription' ? 'Subscription' : type === 'lead_unlock' ? 'Credit Pack' : type === 'featured_profile' ? 'Featured' : type;
  return (
    <View style={styles.paymentRow}>
      <View style={[styles.paymentTypeDot, { backgroundColor: statusColor + '22' }]}>
        <Ionicons
          name={type === 'subscription' ? 'diamond-outline' : type === 'lead_unlock' ? 'wallet-outline' : 'card-outline'}
          size={16}
          color={statusColor}
        />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentType}>{typeLabel}</Text>
        <Text style={styles.paymentMeta}>
          {method.toUpperCase()}{invoiceNum ? ` · ${invoiceNum}` : ''}
        </Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{fmtCurrency(amount)}</Text>
        <View style={[styles.paymentStatusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.paymentStatusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

const AdminRevenueDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const topPad     = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const {
    overview, subscriptions, credits, payments, invoices, charts,
    filters, isLoading, isRefreshing, error,
    setFilters, refresh, retry,
  } = useAdminRevenue();

  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'credits' | 'payments' | 'invoices'>('overview');

  // Analytics: Revenue Dashboard Viewed
  React.useEffect(() => {
    if (__DEV__) console.log('[AdminRevenue] Revenue Dashboard Viewed');
  }, []);

  // ── Export handler
  const handleExport = useCallback(() => {
    if (!overview) return;
    Alert.alert(
      'Export Revenue Data',
      'Choose export format',
      [
        {
          text: 'CSV',
          onPress: () => {
            if (__DEV__) console.log('[AdminRevenue] Revenue Exported: CSV', filters.range);
            const csv = [
              'Metric,Value',
              `Total Revenue,${overview.revenue.total}`,
              `Monthly Revenue,${overview.revenue.monthly}`,
              `Today Revenue,${overview.revenue.today}`,
              `Revenue Growth %,${overview.revenue.growth}`,
              `Total Transactions,${overview.transactions.total}`,
              `Successful,${overview.transactions.successful}`,
              `Failed,${overview.transactions.failed}`,
              `Refunded,${overview.transactions.refunded}`,
            ].join('\n');
            Share.share({ message: csv, title: 'Revenue Export' });
          },
        },
        {
          text: 'Share Report',
          onPress: () => {
            if (__DEV__) console.log('[AdminRevenue] Revenue Exported: Share', filters.range);
            Share.share({
              message: `📊 Revenue Report (${filters.range})\n\nTotal Revenue: ${fmtCurrency(overview.revenue.total)}\nMonthly Revenue: ${fmtCurrency(overview.revenue.monthly)}\nGrowth: ${overview.revenue.growth}%\nTransactions: ${overview.transactions.total}\nSuccess Rate: ${overview.transactions.total > 0 ? ((overview.transactions.successful / overview.transactions.total) * 100).toFixed(1) : 0}%`,
              title: 'Revenue Report',
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [overview, filters.range]);

  const TABS: Array<{ key: typeof activeTab; label: string; icon: string }> = [
    { key: 'overview',       label: 'Overview',  icon: 'home-outline'       },
    { key: 'subscriptions',  label: 'Plans',     icon: 'diamond-outline'    },
    { key: 'credits',        label: 'Credits',   icon: 'wallet-outline'     },
    { key: 'payments',       label: 'Payments',  icon: 'card-outline'       },
    { key: 'invoices',       label: 'Invoices',  icon: 'document-text-outline' },
  ];

  // ── Plan chart data
  const planChartData = useMemo(() => {
    if (!subscriptions) return [];
    return [
      { label: 'Free',  value: subscriptions.plans.free,         color: colors.textSecondary },
      { label: 'Start', value: subscriptions.plans.starter,      color: colors.info          },
      { label: 'Pro',   value: subscriptions.plans.professional, color: colors.secondary     },
      { label: 'Prem',  value: subscriptions.plans.premium,      color: '#F59E0B'            },
    ];
  }, [subscriptions]);

  // ── Daily revenue chart data (last 7 points)
  const dailyChartData = useMemo(() => {
    if (!charts?.daily?.length) return [];
    const slice = charts.daily.slice(-7);
    return slice.map(d => ({
      label: d.date.slice(5),
      value: d.revenue,
      color: colors.primary,
    }));
  }, [charts]);

  // ─────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────

  const renderLoading = () => (
    <View style={styles.skeletonSection}>
      <SkeletonBox h={24} w="60%" r={8} style={{ marginBottom: 8 }} />
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.skeletonCard, { width: (width - 48) / 2 }]}>
            <SkeletonBox h={40} w={40} r={12} style={{ marginBottom: 10 }} />
            <SkeletonBox h={22} w="70%" r={6} style={{ marginBottom: 6 }} />
            <SkeletonBox h={14} w="50%" r={5} />
          </View>
        ))}
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      </View>
      <Text style={styles.errorTitle}>Unable To Load Revenue</Text>
      <Text style={styles.errorSub}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
        <Ionicons name="refresh-outline" size={16} color={colors.textWhite} />
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoData = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bar-chart-outline" size={56} color={colors.border} />
      <Text style={styles.emptyTitle}>No Revenue Data</Text>
      <Text style={styles.emptySub}>No transactions found for the selected period.</Text>
    </View>
  );

  // ─────────────────────────────────────────────
  // Tab content
  // ─────────────────────────────────────────────

  const renderOverview = () => {
    if (!overview) return isLoading ? renderLoading() : renderNoData();
    const ov = overview;
    return (
      <View>
        {/* Revenue Summary Cards */}
        <SectionHdr title="Revenue Summary" icon="cash-outline" color={colors.success} />
        <View style={styles.metricGrid}>
          <MetricCard icon="cash-outline"        iconColor={colors.success}   label="Total Revenue"    value={fmtCurrency(ov.revenue.total)}   growth={ov.revenue.growth} />
          <MetricCard icon="calendar-outline"    iconColor={colors.primary}   label="Monthly Revenue"  value={fmtCurrency(ov.revenue.monthly)}  half />
          <MetricCard icon="today-outline"       iconColor={colors.info}      label="Today's Revenue"  value={fmtCurrency(ov.revenue.today)}    half />
        </View>

        {/* Transaction Summary Cards */}
        <SectionHdr title="Transactions" icon="swap-horizontal-outline" color={colors.primary} />
        <View style={styles.metricGrid}>
          <MetricCard icon="receipt-outline"     iconColor={colors.primary}   label="Total"       value={fmtNum(ov.transactions.total)}      growth={ov.transactions.growth} />
          <MetricCard icon="checkmark-circle-outline" iconColor={colors.success} label="Successful" value={fmtNum(ov.transactions.successful)} half />
          <MetricCard icon="close-circle-outline" iconColor={colors.error}    label="Failed"      value={fmtNum(ov.transactions.failed)}      half />
          <MetricCard icon="return-down-back-outline" iconColor={colors.warning} label="Refunded"  value={fmtNum(ov.transactions.refunded)}   half />
          <MetricCard icon="time-outline"        iconColor={colors.textSecondary} label="Pending"  value={fmtNum(ov.transactions.pending)}    half />
        </View>

        {/* Daily Trend Chart */}
        {dailyChartData.length > 0 && (
          <>
            <SectionHdr title="Revenue Trend" icon="trending-up-outline" color={colors.primary} />
            <SimpleBarChart data={dailyChartData} title="Daily Revenue (Last 7 Days)" />
          </>
        )}

        {/* Revenue by Type */}
        {charts?.byType && charts.byType.length > 0 && (
          <>
            <SectionHdr title="Revenue By Type" icon="pie-chart-outline" color={colors.secondary} />
            <View style={styles.typeBreakdownCard}>
              {charts.byType.map((t, i) => {
                const totalRev = charts.byType.reduce((a, b) => a + b.revenue, 0);
                const pct = totalRev > 0 ? Math.round((t.revenue / totalRev) * 100) : 0;
                const col = i === 0 ? colors.primary : i === 1 ? colors.secondary : i === 2 ? colors.success : colors.accent;
                return (
                  <View key={t.type} style={styles.typeRow}>
                    <View style={[styles.typeDot, { backgroundColor: col }]} />
                    <Text style={styles.typeName}>{t.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    <View style={styles.typeBarTrack}>
                      <View style={[styles.typeBarFill, { width: `${pct}%`, backgroundColor: col }]} />
                    </View>
                    <Text style={styles.typeAmount}>{fmtCurrency(t.revenue)}</Text>
                    <Text style={styles.typePct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderSubscriptions = () => {
    if (!subscriptions) return isLoading ? renderLoading() : renderNoData();
    const sub = subscriptions;
    return (
      <View>
        <SectionHdr title="Plan Distribution" icon="diamond-outline" color={colors.secondary} />
        <View style={styles.metricGrid}>
          <MetricCard icon="people-outline"   iconColor={colors.textSecondary} label="Free Users"         value={fmtNum(sub.plans.free)}         half />
          <MetricCard icon="flash-outline"    iconColor={colors.info}          label="Starter Users"      value={fmtNum(sub.plans.starter)}       half />
          <MetricCard icon="star-outline"     iconColor={colors.secondary}     label="Professional Users" value={fmtNum(sub.plans.professional)}  half />
          <MetricCard icon="diamond-outline"  iconColor={'#F59E0B'}            label="Premium Users"      value={fmtNum(sub.plans.premium)}       half />
        </View>

        <SectionHdr title="Plan Breakdown" icon="bar-chart-outline" color={colors.primary} />
        <View style={styles.typeBreakdownCard}>
          <PlanRow name="Free"         count={sub.plans.free}         total={sub.plans.totalActive} color={colors.textSecondary} />
          <PlanRow name="Starter"      count={sub.plans.starter}      total={sub.plans.totalActive} color={colors.info}          />
          <PlanRow name="Professional" count={sub.plans.professional} total={sub.plans.totalActive} color={colors.secondary}     />
          <PlanRow name="Premium"      count={sub.plans.premium}      total={sub.plans.totalActive} color={'#F59E0B'}            />
        </View>

        <SectionHdr title="Activity" icon="pulse-outline" color={colors.success} />
        <View style={styles.metricGrid}>
          <MetricCard icon="add-circle-outline"   iconColor={colors.success}  label="New Subscriptions"    value={fmtNum(sub.activity.newSubscriptions)}      half />
          <MetricCard icon="close-circle-outline" iconColor={colors.error}    label="Cancelled"            value={fmtNum(sub.activity.cancelledSubscriptions)} half />
          <MetricCard icon="refresh-outline"      iconColor={colors.info}     label="Renewals"             value={fmtNum(sub.activity.renewals)}               half />
          <MetricCard icon="trending-up-outline"  iconColor={colors.secondary} label="Upgrades"            value={fmtNum(sub.activity.upgrades)}               half />
          <MetricCard icon="arrow-up-outline"     iconColor={colors.accent}   label="Upgrade Rate"         value={`${sub.activity.upgradeRate}%`}              half />
          <MetricCard icon="exit-outline"         iconColor={colors.warning}  label="Churn Rate"           value={`${sub.activity.churnRate}%`}                half />
        </View>

        <SectionHdr title="Subscription Revenue" icon="cash-outline" color={colors.success} />
        <View style={styles.metricGrid}>
          <MetricCard icon="cash-outline"   iconColor={colors.success}  label="Total Revenue" value={fmtCurrency(sub.revenue.total)} />
          <MetricCard icon="receipt-outline" iconColor={colors.primary} label="Transactions"  value={fmtNum(sub.revenue.count)}      half />
          <MetricCard icon="analytics-outline" iconColor={colors.info}  label="Avg. Value"    value={fmtCurrency(sub.revenue.avg)}   half />
        </View>

        {planChartData.length > 0 && (
          <SimpleBarChart data={planChartData} title="Active Users by Plan" />
        )}
      </View>
    );
  };

  const renderCredits = () => {
    if (!credits) return isLoading ? renderLoading() : renderNoData();
    const cr = credits;
    return (
      <View>
        <SectionHdr title="Credit Summary" icon="wallet-outline" color={colors.success} />
        <View style={styles.metricGrid}>
          <MetricCard icon="add-circle-outline"  iconColor={colors.success}  label="Credits Sold"     value={fmtNum(cr.summary.creditsSold)}         />
          <MetricCard icon="flash-outline"       iconColor={colors.error}    label="Credits Consumed" value={fmtNum(cr.summary.creditsConsumed)}      half />
          <MetricCard icon="return-down-back-outline" iconColor={colors.warning} label="Refunded"     value={fmtNum(cr.summary.creditsRefunded)}      half />
          <MetricCard icon="calculator-outline"  iconColor={colors.primary}  label="Net Credits"      value={fmtNum(cr.summary.netCredits)}           half />
          <MetricCard icon="trophy-outline"      iconColor={'#F59E0B'}       label="Top Pack"         value={cr.summary.topPack}                      half />
          <MetricCard icon="trending-up-outline" iconColor={colors.info}     label="Avg. Purchased"   value={fmtNum(cr.summary.avgCreditsPurchased)}  half />
        </View>

        <SectionHdr title="Transaction Types" icon="list-outline" color={colors.primary} />
        <View style={styles.typeBreakdownCard}>
          {[
            { label: 'Credits Granted',  value: cr.byType.granted,  color: colors.success   },
            { label: 'Lead Unlocks',     value: cr.byType.unlocks,  color: colors.error     },
            { label: 'Refunds',          value: cr.byType.refunds,  color: colors.warning   },
            { label: 'Bonus Credits',    value: cr.byType.bonuses,  color: '#F59E0B'        },
            { label: 'Plan Upgrades',    value: cr.byType.upgrades, color: colors.secondary },
          ].map(row => (
            <View key={row.label} style={styles.typeRow}>
              <View style={[styles.typeDot, { backgroundColor: row.color }]} />
              <Text style={styles.typeName}>{row.label}</Text>
              <Text style={styles.typeAmount}>{fmtNum(row.value)}</Text>
            </View>
          ))}
        </View>

        {cr.packBreakdown.length > 0 && (
          <>
            <SectionHdr title="Pack Purchases" icon="storefront-outline" color={colors.accent} />
            <View style={styles.typeBreakdownCard}>
              {cr.packBreakdown.map(p => (
                <View key={p.pack} style={styles.typeRow}>
                  <View style={[styles.typeDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.typeName}>{p.pack}</Text>
                  <Text style={styles.typePct}>{p.purchases} purchases</Text>
                  <Text style={styles.typeAmount}>{fmtNum(p.totalCredits)} cr</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <SectionHdr title="Credit Revenue" icon="cash-outline" color={colors.success} />
        <View style={styles.metricGrid}>
          <MetricCard icon="cash-outline"    iconColor={colors.success}  label="Total Revenue"   value={fmtCurrency(cr.revenue.total)} half />
          <MetricCard icon="receipt-outline" iconColor={colors.primary}  label="Transactions"    value={fmtNum(cr.revenue.count)}      half />
        </View>
      </View>
    );
  };

  const renderPayments = () => {
    if (!payments) return isLoading ? renderLoading() : renderNoData();
    const pm = payments;
    const successRate = pm.summary.successRate;
    return (
      <View>
        <SectionHdr title="Payment Summary" icon="card-outline" color={colors.primary} />
        <View style={styles.metricGrid}>
          <MetricCard icon="receipt-outline"         iconColor={colors.primary}   label="Total"         value={fmtNum(pm.summary.total)}        />
          <MetricCard icon="checkmark-circle-outline" iconColor={colors.success}  label="Success Rate"  value={`${successRate}%`}                half />
          <MetricCard icon="close-circle-outline"    iconColor={colors.error}     label="Failure Rate"  value={`${pm.summary.failureRate}%`}     half />
          <MetricCard icon="cash-outline"            iconColor={colors.success}   label="Total Revenue" value={fmtCurrency(pm.summary.totalRevenue)} half />
          <MetricCard icon="analytics-outline"       iconColor={colors.info}      label="Avg. Tx Value" value={fmtCurrency(pm.summary.avgTxValue)}  half />
        </View>

        {pm.byType.length > 0 && (
          <>
            <SectionHdr title="Revenue By Type" icon="pie-chart-outline" color={colors.secondary} />
            <SimpleBarChart
              data={pm.byType.map((t, i) => ({
                label: t.type.replace('_', ' ').slice(0, 6),
                value: t.amount,
                color: [colors.primary, colors.secondary, colors.success, colors.accent][i % 4],
              }))}
              title="Revenue by Payment Type"
            />
          </>
        )}

        {pm.byMethod.length > 0 && (
          <>
            <SectionHdr title="Payment Methods" icon="wallet-outline" color={colors.info} />
            <View style={styles.typeBreakdownCard}>
              {pm.byMethod.map((m, i) => {
                const col = [colors.primary, colors.info, colors.success, colors.accent][i % 4];
                const total = pm.byMethod.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
                return (
                  <View key={m.method} style={styles.typeRow}>
                    <View style={[styles.typeDot, { backgroundColor: col }]} />
                    <Text style={styles.typeName}>{m.method.toUpperCase()}</Text>
                    <View style={styles.typeBarTrack}>
                      <View style={[styles.typeBarFill, { width: `${pct}%`, backgroundColor: col }]} />
                    </View>
                    <Text style={styles.typeAmount}>{fmtCurrency(m.amount)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {pm.payments.length > 0 ? (
          <>
            <SectionHdr title="Recent Payments" icon="time-outline" color={colors.textSecondary} />
            <View style={styles.listCard}>
              {pm.payments.slice(0, 15).map(p => (
                <PaymentRow
                  key={p.paymentId}
                  type={p.type}
                  amount={p.totalAmount}
                  status={p.status}
                  method={p.paymentMethod}
                  date={p.paymentDate}
                  invoiceNum={p.invoiceNumber}
                />
              ))}
            </View>
          </>
        ) : (
          renderNoData()
        )}
      </View>
    );
  };

  const renderInvoices = () => {
    if (!invoices) return isLoading ? renderLoading() : renderNoData();
    const inv = invoices;
    return (
      <View>
        <SectionHdr title="Invoice Summary" icon="document-text-outline" color={colors.info} />
        <View style={styles.metricGrid}>
          <MetricCard icon="documents-outline"   iconColor={colors.primary}  label="Total Invoices"  value={fmtNum(inv.summary.total)}          />
          <MetricCard icon="checkmark-done-outline" iconColor={colors.success} label="Issued"        value={fmtNum(inv.summary.issued)}         half />
          <MetricCard icon="close-circle-outline" iconColor={colors.error}    label="Cancelled"      value={fmtNum(inv.summary.cancelled)}      half />
          <MetricCard icon="cash-outline"        iconColor={colors.success}   label="Grand Total"    value={fmtCurrency(inv.summary.grandTotal)} half />
          <MetricCard icon="receipt-outline"     iconColor={colors.info}      label="GST Collected"  value={fmtCurrency(inv.summary.gstTotal)}  half />
          <MetricCard icon="pricetag-outline"    iconColor={colors.accent}    label="Promo Discounts" value={fmtCurrency(inv.summary.promoDiscount)} half />
        </View>

        {inv.invoices.length > 0 ? (
          <>
            <SectionHdr title="Recent Invoices" icon="time-outline" color={colors.textSecondary} />
            <View style={styles.listCard}>
              {inv.invoices.slice(0, 15).map(i => {
                const statusColor = i.status === 'issued' ? colors.success : i.status === 'cancelled' ? colors.error : colors.warning;
                return (
                  <View key={i._id} style={styles.invoiceRow}>
                    <View style={[styles.invoiceIcon, { backgroundColor: statusColor + '18' }]}>
                      <Ionicons name="document-text-outline" size={16} color={statusColor} />
                    </View>
                    <View style={styles.invoiceInfo}>
                      <Text style={styles.invoiceNum}>{i.invoiceNumber}</Text>
                      <Text style={styles.invoiceBuyer}>{i.buyer.name}</Text>
                    </View>
                    <View style={styles.invoiceRight}>
                      <Text style={styles.invoiceAmount}>{fmtCurrency(i.grandTotal)}</Text>
                      <View style={[styles.invoiceStatusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[styles.invoiceStatusText, { color: statusColor }]}>{i.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          renderNoData()
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    if (isLoading && !overview) return renderLoading();
    if (error && !overview)     return renderError();
    switch (activeTab) {
      case 'overview':      return renderOverview();
      case 'subscriptions': return renderSubscriptions();
      case 'credits':       return renderCredits();
      case 'payments':      return renderPayments();
      case 'invoices':      return renderInvoices();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Revenue Dashboard</Text>
            <Text style={styles.headerSub}>Admin Monetization Overview</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <RevenueFiltersBar
          filters={filters}
          onFilter={(f) => {
            setFilters(f);
            if (__DEV__) console.log('[AdminRevenue] Revenue Filter Applied:', f.range);
          }}
        />
      </View>

      {/* Tab Nav */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={tab.icon as any} size={15} color={active ? colors.textWhite : colors.textSecondary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.success]}
            tintColor={colors.success}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Loading overlay for filter change */}
      {isLoading && overview && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.success} />
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  // ── Header
  header: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:      { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 1 },
  exportBtn:    { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },

  // ── Filters
  filtersScroll:  {},
  filtersContent: { gap: 8 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  filterChipActive: { backgroundColor: colors.textWhite },
  filterChipText:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  filterChipTextActive: { color: colors.success },

  // ── Tab Bar
  tabBar:        { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  tabActive:     { backgroundColor: colors.success, borderColor: colors.success },
  tabText:       { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.textWhite },

  // ── Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // ── Section Header
  sectionHdr:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 20 },
  sectionHdrText: { fontSize: 15, fontWeight: '700' },

  // ── Metric Grid
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  metricCard: {
    flex: 1, minWidth: (width - 48) / 2,
    backgroundColor: colors.card, borderRadius: 16, padding: 14,
    ...shadows.sm,
  },
  metricIcon:       { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  metricValue:      { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  metricLabel:      { fontSize: 12, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },
  metricGrowth:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  metricGrowthText: { fontSize: 11, fontWeight: '600' },
  metricSub:        { fontSize: 11, color: colors.textTertiary, marginTop: 2 },

  // ── Chart
  chartCard:    { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 4, ...shadows.sm },
  chartTitle:   { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 14 },
  chartBars:    { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120 },
  chartBarCol:  { flex: 1, alignItems: 'center' },
  chartBarTrack:{ height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  chartBarFill: { borderRadius: 4, minHeight: 2 },
  chartBarLabel:{ fontSize: 9, color: colors.textTertiary, marginTop: 4, textAlign: 'center' },

  // ── Plan rows
  typeBreakdownCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 4, gap: 12, ...shadows.sm },
  typeRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeDot:      { width: 10, height: 10, borderRadius: 5 },
  typeName:     { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  typeBarTrack: { flex: 2, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  typeBarFill:  { height: 6, borderRadius: 3 },
  typeAmount:   { fontSize: 12, fontWeight: '700', color: colors.text, minWidth: 56, textAlign: 'right' },
  typePct:      { fontSize: 11, color: colors.textSecondary, minWidth: 36, textAlign: 'right' },

  planRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDot:      { width: 10, height: 10, borderRadius: 5 },
  planName:     { width: 90, fontSize: 13, fontWeight: '600', color: colors.text },
  planBarTrack: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  planBarFill:  { height: 6, borderRadius: 3 },
  planCount:    { fontSize: 12, fontWeight: '700', color: colors.text, minWidth: 34, textAlign: 'right' },
  planPct:      { fontSize: 11, color: colors.textSecondary, minWidth: 36, textAlign: 'right' },

  // ── Payment/Invoice list
  listCard:        { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', ...shadows.sm },
  paymentRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  paymentTypeDot:  { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  paymentInfo:     { flex: 1 },
  paymentType:     { fontSize: 13, fontWeight: '600', color: colors.text },
  paymentMeta:     { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  paymentRight:    { alignItems: 'flex-end', gap: 4 },
  paymentAmount:   { fontSize: 14, fontWeight: '700', color: colors.text },
  paymentStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  paymentStatusText:  { fontSize: 10, fontWeight: '600' },

  invoiceRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  invoiceIcon:      { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  invoiceInfo:      { flex: 1 },
  invoiceNum:       { fontSize: 13, fontWeight: '600', color: colors.text },
  invoiceBuyer:     { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  invoiceRight:     { alignItems: 'flex-end', gap: 4 },
  invoiceAmount:    { fontSize: 14, fontWeight: '700', color: colors.text },
  invoiceStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  invoiceStatusText:  { fontSize: 10, fontWeight: '600' },

  // ── States
  skeletonSection: { paddingTop: 16 },
  skeletonGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  skeletonCard:    { backgroundColor: colors.card, borderRadius: 16, padding: 14, ...shadows.sm },

  errorState:  { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  errorIcon:   { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.error + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  errorTitle:  { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  errorSub:    { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  retryBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.error, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText:{ fontSize: 14, fontWeight: '700', color: colors.textWhite },

  emptyState:  { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  loadingOverlay: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: colors.card, padding: 10, borderRadius: 20, ...shadows.md },
});

export default AdminRevenueDashboardScreen;
