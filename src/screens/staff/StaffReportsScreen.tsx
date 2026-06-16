import React, { useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useStaffReports } from '../../hooks/useStaffPortal';

const { width } = Dimensions.get('window');
const BAR_MAX_W = width - 100;

interface BarChartRowProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const BarChartRow: React.FC<BarChartRowProps> = ({ label, value, max, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: (value / max) * BAR_MAX_W,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, []);
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { width: anim, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.value, { color }]}>{value}</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  label: { width: 60, fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  track: { flex: 1, height: 10, backgroundColor: colors.backgroundTertiary, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  value: { width: 36, fontSize: 13, fontWeight: '800', textAlign: 'right' },
});

const SUBJECT_COLORS = [colors.secondary, colors.info, colors.success, colors.accent, colors.error];

interface StatRowProps {
  icon: string;
  label: string;
  value: string;
  color: string;
  sub?: string;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, value, color, sub }) => (
  <View style={statRowStyles.row}>
    <View style={[statRowStyles.icon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={statRowStyles.label}>{label}</Text>
      {sub ? <Text style={statRowStyles.sub}>{sub}</Text> : null}
    </View>
    <Text style={[statRowStyles.value, { color }]}>{value}</Text>
  </View>
);

const statRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  icon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  sub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  value: { fontSize: 18, fontWeight: '800' },
});

const SectionCard: React.FC<{ title: string; icon: string; color: string; children: React.ReactNode }> = ({
  title, icon, color, children,
}) => (
  <View style={sectionStyles.card}>
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.headerIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
});

const StaffReportsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { reports, isLoading, isRefreshing, error, refresh, retry } = useStaffReports();

  const dailyActivity = (reports?.dailyActivity ?? []).map((d, i) => ({
    ...d,
    color: i === 3 ? colors.accent : colors.info,
  }));
  const dailyMax = Math.max(...dailyActivity.map((d) => d.value), 1);

  const verBySubject = (reports?.verifications.bySubject ?? []).map((v, i) => ({
    label: v.label,
    value: v.value,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));
  const verMax = Math.max(...verBySubject.map((v) => v.value), 1);


  if (isLoading && !reports) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.stateText}>Loading reports...</Text>
      </View>
    );
  }

  if (error && !reports) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
        <Text style={styles.stateText}>Unable to load reports</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.success]} tintColor={colors.success} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Staff Reports</Text>
          <Text style={styles.headerSub}>Analytics & performance overview</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={18} color="#FFF" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPIs */}
      <View style={styles.kpiStrip}>
        {[
          { label: 'Tickets\nResolved', value: String(reports?.kpis.totalResolved ?? 0), color: colors.success },
          { label: 'Avg. Time', value: `${reports?.kpis.avgResolutionHours ?? '0'}h`, color: colors.info },
          { label: 'Verifications', value: String(reports?.kpis.verifications ?? 0), color: colors.accent },
          { label: 'Staff\nPerformance', value: `${reports?.kpis.verifications ?? 0}`, color: colors.secondary },
        ].map((k, idx) => (
          <React.Fragment key={k.label}>
            {idx > 0 && <View style={styles.kpiDivider} />}
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={styles.sections}>
        {/* Daily Activity */}
        <SectionCard title="Daily Activity (This Week)" icon="bar-chart-outline" color={colors.info}>
          {dailyActivity.length > 0 ? (
            dailyActivity.map((d) => (
              <BarChartRow key={d.label} label={d.label} value={d.value} max={dailyMax} color={d.color} />
            ))
          ) : (
            <Text style={styles.noDataText}>No activity data</Text>
          )}
        </SectionCard>

        {/* Ticket Resolution */}
        <SectionCard title="Ticket Resolution" icon="timer-outline" color={colors.success}>
          <View style={styles.metricGrid}>
            <StatRow icon="flash-outline"          label="Total Resolved"  value={String(reports?.tickets.totalResolved ?? 0)}  color={colors.success} sub="This month" />
            <View style={styles.divider} />
            <StatRow icon="hourglass-outline"      label="Avg. Resolution" value={`${reports?.tickets.avgResolutionHours ?? '0'}h`} color={colors.info}    sub="Per ticket" />
            <View style={styles.divider} />
            <StatRow icon="checkmark-done-outline" label="SLA Compliance"  value={`${reports?.tickets.slaCompliance ?? 0}%`}  color={colors.accent} sub="Target: 90%" />
          </View>
        </SectionCard>

        {/* Verification Progress */}
        <SectionCard title="Verification Progress" icon="shield-checkmark-outline" color={colors.accent}>
          <View style={styles.metricGrid}>
            <StatRow icon="checkmark-circle-outline" label="Approved" value={String(reports?.verifications.approved ?? 0)} color={colors.success} sub="This month" />
            <View style={styles.divider} />
            <StatRow icon="close-circle-outline"     label="Rejected" value={String(reports?.verifications.rejected ?? 0)} color={colors.error}   sub="This month" />
            <View style={styles.divider} />
            <StatRow icon="time-outline"              label="Pending"  value={String(reports?.verifications.pending  ?? 0)} color={colors.accent}  sub="Awaiting review" />
          </View>
          {verBySubject.length > 0 && (
            <>
              <View style={styles.subSectionTitle}>
                <Text style={styles.subSectionText}>By Subject</Text>
              </View>
              {verBySubject.map((v) => (
                <BarChartRow key={v.label} label={v.label} value={v.value} max={verMax} color={v.color} />
              ))}
            </>
          )}
        </SectionCard>

      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 24 },

  header: {
    backgroundColor: colors.success,
    paddingHorizontal: 16, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 12,
  },
  exportText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  kpiStrip: {
    flexDirection: 'row',
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 3, textAlign: 'center' },
  kpiDivider: { width: 1, backgroundColor: colors.border },

  sections: { paddingHorizontal: 16, marginTop: 20, gap: 16 },
  metricGrid: { gap: 2, marginBottom: 12 },
  divider: { height: 1, backgroundColor: colors.border },
  subSectionTitle: { marginBottom: 10 },
  subSectionText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  sectionFooterText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  stateText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 28, paddingVertical: 10,
    backgroundColor: colors.success, borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  noDataText: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', paddingVertical: 8 },
});

export default StaffReportsScreen;
