import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface SystemSetting {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
  iconColor: string;
  critical?: boolean;
}

const SystemSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [settings, setSettings] = useState<Record<string, boolean>>({
    autoMatching: true,
    userRegistration: true,
    teacherRegistration: true,
    parentRegistration: true,
    leadExpiry: true,
    demoScheduling: true,
  });

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const platformItems: SystemSetting[] = [
    {
      key: 'autoMatching',
      icon: 'git-compare-outline',
      label: 'Auto Matching',
      subtitle: 'Auto-match tutors with parent requirements',
      iconColor: colors.primary,
    },
    {
      key: 'leadExpiry',
      icon: 'timer-outline',
      label: 'Lead Expiry',
      subtitle: 'Automatically expire stale leads',
      iconColor: colors.accent,
    },
    {
      key: 'demoScheduling',
      icon: 'videocam-outline',
      label: 'Demo Scheduling',
      subtitle: 'Allow booking of demo classes',
      iconColor: colors.info,
    },
  ];

  const registrationItems: SystemSetting[] = [
    {
      key: 'userRegistration',
      icon: 'person-add-outline',
      label: 'User Registration',
      subtitle: 'Allow new user sign-ups',
      iconColor: colors.success,
      critical: true,
    },
    {
      key: 'teacherRegistration',
      icon: 'school-outline',
      label: 'Teacher Registration',
      subtitle: 'Accept new teacher applications',
      iconColor: colors.secondary,
      critical: true,
    },
    {
      key: 'parentRegistration',
      icon: 'home-outline',
      label: 'Parent Registration',
      subtitle: 'Accept new parent sign-ups',
      iconColor: colors.pink,
      critical: true,
    },
  ];

  const renderRow = (item: SystemSetting, idx: number, total: number) => (
    <React.Fragment key={item.key}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: item.iconColor + '18' }]}>
          <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
        </View>
        <View style={styles.rowText}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            {item.critical && (
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalText}>Critical</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
        </View>
        <Switch
          value={settings[item.key]}
          onValueChange={() => toggle(item.key)}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={settings[item.key] ? colors.primary : colors.textTertiary}
          ios_backgroundColor={colors.border}
        />
      </View>
      {idx < total - 1 && <View style={styles.divider} />}
    </React.Fragment>
  );

  const activeCount = Object.values(settings).filter(Boolean).length;
  const total = Object.keys(settings).length;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status Overview */}
        <View style={styles.statusRow}>
          <View style={[styles.statCard, { backgroundColor: colors.success + '14' }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.error + '14' }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{total - activeCount}</Text>
            <Text style={styles.statLabel}>Disabled</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PLATFORM FEATURES</Text>
        <View style={styles.card}>
          {platformItems.map((item, idx) => renderRow(item, idx, platformItems.length))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>REGISTRATION CONTROLS</Text>
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.warningText}>
            Disabling registration will prevent new users from joining the platform.
          </Text>
        </View>
        <View style={styles.card}>
          {registrationItems.map((item, idx) => renderRow(item, idx, registrationItems.length))}
        </View>

        {/* Last Modified */}
        <View style={styles.metaCard}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.metaText}>Last modified: Today at 10:30 AM (mock)</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', ...shadows.sm,
  },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.warningLight, padding: 12, borderRadius: 12, marginBottom: 8,
  },
  warningText: { flex: 1, fontSize: 12, color: colors.warning, fontWeight: '600', lineHeight: 18 },

  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textTertiary },
  criticalBadge: {
    backgroundColor: colors.error + '18',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  criticalText: { fontSize: 10, fontWeight: '700', color: colors.error },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 70 },

  metaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    marginTop: 20, ...shadows.xs,
  },
  metaText: { fontSize: 13, color: colors.textSecondary },
});

export default SystemSettingsScreen;
