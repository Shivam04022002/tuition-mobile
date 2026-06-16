import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  DemandAnalytics,
  MonthlyCount,
  OverviewAnalytics,
  RevenueAnalytics,
  SupplyAnalytics,
  SupplyVsDemand,
  getDemandAnalytics,
  getOverviewAnalytics,
  getRevenueAnalytics,
  getSupplyAnalytics,
} from '../../services/adminApi';

// ─────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionIcon}>{icon}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}> = ({ label, value, sub, accent = '#007AFF' }) => (
  <View style={[styles.statCard, { borderLeftColor: accent }]}>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
  </View>
);

const ProgressRow: React.FC<{ label: string; value: number; max: number; color?: string }> = ({
  label,
  value,
  max,
  color = '#007AFF',
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.progressCount}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const TableRow: React.FC<{ left: string; right: string | number; highlight?: boolean }> = ({
  left,
  right,
  highlight,
}) => (
  <View style={[styles.tableRow, highlight && styles.tableRowHighlight]}>
    <Text style={styles.tableLeft} numberOfLines={1}>{left}</Text>
    <Text style={[styles.tableRight, highlight && { color: '#FF3B30', fontWeight: '700' }]}>{right}</Text>
  </View>
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyBar: React.FC<{ data: MonthlyCount[]; valueKey?: string }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <View style={styles.barChart}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.count / max) * 60);
        return (
          <View key={i} style={styles.barItem}>
            <Text style={styles.barCount}>{d.count}</Text>
            <View style={[styles.bar, { height: h }]} />
            <Text style={styles.barLabel}>{MONTHS[(d.month - 1) % 12]}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────
// Tab types
// ─────────────────────────────────────────────

type TabKey = 'overview' | 'demand' | 'supply' | 'revenue';
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'demand', label: 'Demand', icon: '📋' },
  { key: 'supply', label: 'Supply', icon: '🎓' },
  { key: 'revenue', label: 'Revenue', icon: '💰' },
];

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

const AnalyticsScreen: React.FC = () => {
  const token: string = useSelector((state: any) => state.auth?.token ?? '');
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [demand, setDemand] = useState<DemandAnalytics | null>(null);
  const [supply, setSupply] = useState<SupplyAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);

  const fetchTab = useCallback(async (tab: TabKey, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      if (tab === 'overview') {
        const res = await getOverviewAnalytics(token);
        if (res.success) setOverview(res.data);
      } else if (tab === 'demand') {
        const res = await getDemandAnalytics(token);
        if (res.success) setDemand(res.data);
      } else if (tab === 'supply') {
        const res = await getSupplyAnalytics(token);
        if (res.success) setSupply(res.data);
      } else if (tab === 'revenue') {
        const res = await getRevenueAnalytics(token);
        if (res.success) setRevenue(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  // ─── Overview Section ───
  const renderOverview = () => {
    if (!overview) return null;
    const { users, teachers, requirements, applications, demos, classes } = overview;
    return (
      <>
        {/* Users */}
        <View style={styles.card}>
          <SectionHeader title="Users" icon="👥" />
          <View style={styles.statRow}>
            <StatCard label="Parents" value={users.totalParents} sub={`+${users.newParentsThisMonth} this month`} accent="#007AFF" />
            <StatCard label="Teachers" value={users.totalTeachers} sub={`+${users.newTeachersThisMonth} this month`} accent="#34C759" />
          </View>
        </View>

        {/* Teacher Verification */}
        <View style={styles.card}>
          <SectionHeader title="Teacher Verification" icon="✅" />
          <View style={styles.statRow}>
            <StatCard label="Verified" value={teachers.verifiedTeachers} accent="#34C759" />
            <StatCard label="Pending" value={teachers.pendingTeachers} accent="#FF9500" />
            <StatCard label="Blocked" value={teachers.blockedTeachers} accent="#FF3B30" />
          </View>
          <ProgressRow label="Verification Rate" value={teachers.verificationRate} max={100} color="#34C759" />
        </View>

        {/* Requirements */}
        <View style={styles.card}>
          <SectionHeader title="Requirements" icon="📋" />
          <View style={styles.statRow}>
            <StatCard label="Active" value={requirements.activeRequirements} sub={`+${requirements.newReqsThisMonth} this month`} accent="#007AFF" />
            <StatCard label="Closed" value={requirements.closedRequirements} accent="#8E8E93" />
            <StatCard label="Total" value={requirements.totalRequirements} accent="#5856D6" />
          </View>
        </View>

        {/* Applications */}
        <View style={styles.card}>
          <SectionHeader title="Applications" icon="📝" />
          <View style={styles.statRow}>
            <StatCard label="Total" value={applications.totalApplications} sub={`+${applications.newAppsThisWeek} this week`} accent="#5856D6" />
            <StatCard label="Pending" value={applications.pendingApplications} accent="#FF9500" />
            <StatCard label="Accepted" value={applications.acceptedApplications} accent="#34C759" />
          </View>
          <ProgressRow label={`Conversion Rate ${applications.conversionRate}%`} value={applications.conversionRate} max={100} color="#5856D6" />
        </View>

        {/* Demos + Classes */}
        <View style={styles.card}>
          <SectionHeader title="Demos & Classes" icon="🎯" />
          <View style={styles.statRow}>
            <StatCard label="Demo Classes" value={demos.totalDemoClasses} accent="#FF9500" />
            <StatCard label="Completed" value={demos.completedDemos} accent="#34C759" />
            <StatCard label="Scheduled" value={demos.scheduledDemos} accent="#007AFF" />
          </View>
          <ProgressRow label={`Demo Conversion ${demos.demoConversionRate}%`} value={demos.demoConversionRate} max={100} color="#FF9500" />
          <View style={[styles.statRow, { marginTop: 12 }]}>
            <StatCard label="Scheduled Classes" value={classes.scheduledClasses} accent="#5856D6" />
            <StatCard label="Active Classes" value={classes.activeScheduledClasses} accent="#34C759" />
          </View>
        </View>
      </>
    );
  };

  // ─── Demand Section ───
  const renderDemand = () => {
    if (!demand) return null;
    const topMax = demand.topSubjects[0]?.count ?? 1;
    return (
      <>
        <View style={styles.card}>
          <SectionHeader title="Top Subjects" icon="📚" />
          {demand.topSubjects.map((s, i) => (
            <ProgressRow key={i} label={s.subject || 'Unknown'} value={s.count} max={topMax} color="#007AFF" />
          ))}
          {demand.topSubjects.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Top Classes / Grades" icon="🏫" />
          {demand.topGrades.map((g, i) => (
            <ProgressRow key={i} label={g.grade || 'Unknown'} value={g.count} max={demand.topGrades[0]?.count ?? 1} color="#5856D6" />
          ))}
          {demand.topGrades.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Top Boards" icon="📐" />
          {demand.topBoards.map((b, i) => (
            <ProgressRow key={i} label={b.board || 'Unknown'} value={b.count} max={demand.topBoards[0]?.count ?? 1} color="#FF9500" />
          ))}
          {demand.topBoards.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Top Cities (Demand)" icon="📍" />
          {demand.topCities.map((c, i) => (
            <ProgressRow key={i} label={c.city || 'Unknown'} value={c.count} max={demand.topCities[0]?.count ?? 1} color="#34C759" />
          ))}
          {demand.topCities.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Tuition Type Breakdown" icon="🏠" />
          {demand.tuitionTypeBreakdown.map((t, i) => (
            <TableRow key={i} left={t.type || 'Unknown'} right={t.count} />
          ))}
          {demand.tuitionTypeBreakdown.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        {demand.requirementsByMonth.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="New Requirements / Month" icon="📅" />
            <MonthlyBar data={demand.requirementsByMonth} />
          </View>
        )}
      </>
    );
  };

  // ─── Supply Section ───
  const renderSupply = () => {
    if (!supply) return null;
    return (
      <>
        <View style={styles.card}>
          <SectionHeader title="Teachers by City" icon="📍" />
          {supply.teachersByCity.map((c, i) => (
            <ProgressRow key={i} label={c.city || 'Unknown'} value={c.count} max={supply.teachersByCity[0]?.count ?? 1} color="#34C759" />
          ))}
          {supply.teachersByCity.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Teachers by Subject" icon="📚" />
          {supply.teachersBySubject.map((s, i) => (
            <ProgressRow key={i} label={s.subject || 'Unknown'} value={s.count} max={supply.teachersBySubject[0]?.count ?? 1} color="#007AFF" />
          ))}
          {supply.teachersBySubject.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Teachers by Board" icon="📐" />
          {supply.teachersByBoard.map((b, i) => (
            <ProgressRow key={i} label={b.board || 'Unknown'} value={b.count} max={supply.teachersByBoard[0]?.count ?? 1} color="#5856D6" />
          ))}
          {supply.teachersByBoard.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Teaching Mode" icon="🖥️" />
          {supply.teachersByMode.map((m, i) => (
            <TableRow key={i} left={m.mode || 'Unknown'} right={m.count} />
          ))}
          {supply.teachersByMode.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Avg Hourly Rate by City" icon="💵" />
          {supply.avgHourlyRateByCity.map((c, i) => (
            <TableRow key={i} left={c.city} right={`₹${c.avgHourlyRate}/hr (${c.teacherCount} teachers)`} />
          ))}
          {supply.avgHourlyRateByCity.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        {/* Supply vs Demand */}
        {supply.supplyVsDemand.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Supply vs Demand Gap" icon="⚖️" />
            <View style={styles.tableHead}>
              <Text style={[styles.tableLeft, styles.tableHeadText]}>Subject</Text>
              <Text style={styles.tableHeadCell}>Demand</Text>
              <Text style={styles.tableHeadCell}>Supply</Text>
              <Text style={styles.tableHeadCell}>Gap</Text>
            </View>
            {(supply.supplyVsDemand as SupplyVsDemand[]).map((s, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && { backgroundColor: '#f9f9f9' }]}>
                <Text style={[styles.tableLeft, { flex: 2 }]} numberOfLines={1}>{s.subject}</Text>
                <Text style={styles.tableHeadCell}>{s.demand}</Text>
                <Text style={styles.tableHeadCell}>{s.supply}</Text>
                <Text style={[styles.tableHeadCell, s.gap > 0 ? { color: '#FF3B30' } : { color: '#34C759' }]}>
                  {s.gap > 0 ? `+${s.gap}` : s.gap}
                </Text>
              </View>
            ))}
          </View>
        )}

        {supply.teachersJoinedByMonth.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="New Teachers / Month" icon="📅" />
            <MonthlyBar data={supply.teachersJoinedByMonth} />
          </View>
        )}
      </>
    );
  };

  // ─── Revenue Section ───
  const renderRevenue = () => {
    if (!revenue) return null;
    const { summary } = revenue;
    return (
      <>
        <View style={styles.card}>
          <SectionHeader title="Revenue Summary" icon="💰" />
          <View style={styles.statRow}>
            <StatCard label="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString('en-IN')}`} accent="#34C759" />
            <StatCard label="Transactions" value={summary.totalTransactions} accent="#007AFF" />
          </View>
          <View style={styles.statRow}>
            <StatCard label="This Month" value={`₹${summary.monthRevenue.toLocaleString('en-IN')}`} accent="#FF9500" />
            <StatCard label="This Year" value={`₹${summary.yearRevenue.toLocaleString('en-IN')}`} accent="#5856D6" />
          </View>
          <StatCard label="Avg Transaction" value={`₹${summary.avgTransactionValue}`} accent="#8E8E93" />
          {revenue.notes.map((n, i) => (
            <Text key={i} style={styles.noteText}>⚠️ {n}</Text>
          ))}
        </View>

        {revenue.revenueByType.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Revenue by Type" icon="🗂️" />
            <View style={styles.tableHead}>
              <Text style={[styles.tableLeft, styles.tableHeadText]}>Type</Text>
              <Text style={styles.tableHeadCell}>Count</Text>
              <Text style={styles.tableHeadCell}>Total</Text>
            </View>
            {revenue.revenueByType.map((r, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableLeft} numberOfLines={1}>{r.type}</Text>
                <Text style={styles.tableHeadCell}>{r.count}</Text>
                <Text style={[styles.tableHeadCell, { color: '#34C759' }]}>₹{r.total.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        )}

        {revenue.revenueByMonth.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Monthly Revenue Trend" icon="📈" />
            <View style={styles.barChart}>
              {revenue.revenueByMonth.map((d, i) => {
                const max = Math.max(...revenue.revenueByMonth.map(m => m.revenue), 1);
                const h = Math.max(4, (d.revenue / max) * 60);
                return (
                  <View key={i} style={styles.barItem}>
                    <Text style={styles.barCount}>{d.revenue >= 1000 ? `${Math.round(d.revenue / 1000)}k` : d.revenue}</Text>
                    <View style={[styles.bar, { height: h, backgroundColor: '#34C759' }]} />
                    <Text style={styles.barLabel}>{MONTHS[(d.month - 1) % 12]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Lead Unlock Stats */}
        {revenue.leadUnlocks.stats.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Lead Unlock Stats" icon="🔓" />
            {revenue.leadUnlocks.stats.map((s, i) => (
              <TableRow key={i} left={s.status || 'Unknown'} right={`${s.count} unlocks · ₹${s.totalAmount}`} />
            ))}
          </View>
        )}

        {revenue.leadUnlocks.conversionStats.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="Lead Conversion" icon="🎯" />
            {revenue.leadUnlocks.conversionStats.map((s, i) => (
              <TableRow key={i} left={s.status || 'Unknown'} right={s.count} highlight={s.status === 'converted'} />
            ))}
          </View>
        )}
      </>
    );
  };

  const isEmpty = () => {
    if (activeTab === 'overview') return !overview;
    if (activeTab === 'demand') return !demand;
    if (activeTab === 'supply') return !supply;
    if (activeTab === 'revenue') return !revenue;
    return true;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSub}>Business Intelligence Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.geoButton}
          onPress={() => navigation.navigate('GeoAnalytics')}
        >
          <Text style={styles.geoButtonIcon}>🗺️</Text>
          <Text style={styles.geoButtonText}>Geo</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTab(activeTab, true)}
            tintColor="#007AFF"
          />
        }
      >
        {loading && isEmpty() ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading analytics…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTab(activeTab)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contentPad}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'demand' && renderDemand()}
            {activeTab === 'supply' && renderSupply()}
            {activeTab === 'revenue' && renderRevenue()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },

  header: {
    backgroundColor: '#1C1C1E',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  tabLabelActive: { color: '#007AFF', fontWeight: '700' },

  scrollView: { flex: 1 },
  contentPad: { padding: 12, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { fontSize: 18, marginRight: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  statSub: { fontSize: 10, color: '#999', marginTop: 2 },

  progressRow: { marginBottom: 10 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 13, color: '#333', flex: 1 },
  progressCount: { fontSize: 13, fontWeight: '700', color: '#333' },
  progressTrack: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#007AFF' },

  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 4,
  },
  tableHeadText: { fontWeight: '700', color: '#555' },
  tableHeadCell: { width: 64, textAlign: 'right', fontSize: 12, color: '#333' },
  tableRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowHighlight: { backgroundColor: '#fff3cd' },
  tableLeft: { flex: 1, fontSize: 13, color: '#333' },
  tableRight: { fontSize: 13, color: '#555', textAlign: 'right' },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8 },
  barItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  barCount: { fontSize: 9, color: '#555', marginBottom: 2 },
  bar: { width: '80%', minWidth: 6, backgroundColor: '#007AFF', borderRadius: 3 },
  barLabel: { fontSize: 9, color: '#888', marginTop: 3 },

  loadingContainer: { alignItems: 'center', paddingTop: 80 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  errorContainer: { alignItems: 'center', paddingTop: 60 },
  errorText: { fontSize: 14, color: '#FF3B30', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { marginTop: 16, backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 12 },
  noteText: { fontSize: 12, color: '#FF9500', marginTop: 10, lineHeight: 18 },

  geoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  geoButtonIcon: { fontSize: 16 },
  geoButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
});

export default AnalyticsScreen;
