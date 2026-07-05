import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface MenuItem {
  icon: string;
  label: string;
  subtitle: string;
  iconColor: string;
  onPress: () => void;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const AdminSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const groups: MenuGroup[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-circle-outline',
          label: 'My Profile',
          subtitle: 'View name, email, role & joined date',
          iconColor: colors.secondary,
          onPress: () => navigation.navigate('AdminProfile'),
        },
      ],
    },
    {
      title: 'Platform Controls',
      items: [
        {
          icon: 'trending-up-outline',
          label: 'Revenue Dashboard',
          subtitle: 'Revenue, subscriptions, credits & payment analytics',
          iconColor: colors.success,
          onPress: () => navigation.navigate('AdminRevenueDashboard'),
        },
        {
          icon: 'toggle-outline',
          label: 'System Settings',
          subtitle: 'Auto matching, registration & lead controls',
          iconColor: colors.primary,
          onPress: () => navigation.navigate('SystemSettings'),
        },
        {
          icon: 'construct-outline',
          label: 'Maintenance Mode',
          subtitle: 'Toggle platform online/maintenance status',
          iconColor: colors.warning,
          onPress: () => navigation.navigate('MaintenanceMode'),
        },
        {
          icon: 'mail-outline',
          label: 'Notification Templates',
          subtitle: 'View and preview message templates',
          iconColor: colors.secondary,
          onPress: () => navigation.navigate('NotificationTemplates'),
        },
        {
          icon: 'server-outline',
          label: 'SMTP Configuration',
          subtitle: 'Configure SMTP host, credentials & sender email',
          iconColor: colors.info,
          onPress: () => navigation.navigate('SmtpConfig'),
        },
        {
          icon: 'location-outline',
          label: 'Location Services',
          subtitle: 'Google Maps API key for location autofill during signup',
          iconColor: colors.success,
          onPress: () => navigation.navigate('LocationConfig'),
        },
      ],
    },
    {
      title: 'Coming Soon',
      items: [
        {
          icon: 'wallet-outline',
          label: 'Wallet Analytics',
          subtitle: 'Wallet balance, refunds & escrow — coming soon',
          iconColor: '#6B7280',
          onPress: () => navigation.navigate('AdminWalletDashboard'),
          badge: 'Soon',
        },
        {
          icon: 'videocam-outline',
          label: 'Live Classes',
          subtitle: 'Sessions, attendance & recording dashboard',
          iconColor: colors.info,
          onPress: () => navigation.navigate('AdminLiveClassesDashboard'),
          badge: 'Demo',
        },
        {
          icon: 'storefront-outline',
          label: 'Course Marketplace',
          subtitle: 'Digital course listing and management',
          iconColor: colors.secondary,
          onPress: () => navigation.navigate('AdminCourseDashboard'),
          badge: 'Demo',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'App Version',
          subtitle: 'v1.0.0 (Build 100)',
          iconColor: colors.textSecondary,
          onPress: () => {},
          badge: 'v1.0.0',
        },
        {
          icon: 'document-text-outline',
          label: 'Terms of Service',
          subtitle: '',
          iconColor: colors.textSecondary,
          onPress: () => {},
        },
      ],
    },
  ];

  const renderItem = (item: MenuItem, idx: number, total: number) => (
    <React.Fragment key={item.label}>
      <TouchableOpacity style={styles.row} onPress={item.onPress} activeOpacity={0.72}>
        <View style={[styles.iconWrap, { backgroundColor: item.iconColor + '18' }]}>
          <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          {!!item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
        </View>
        {item.badge ? (
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
      </TouchableOpacity>
      {idx < total - 1 && <View style={styles.divider} />}
    </React.Fragment>
  );

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="settings-outline" size={22} color={colors.textWhite} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin Settings</Text>
            <Text style={styles.headerSubtitle}>Platform & system controls</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {groups.map(group => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.title.toUpperCase()}</Text>
            <View style={styles.card}>
              {group.items.map((item, idx) => renderItem(item, idx, group.items.length))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => dispatch(logout())}
            activeOpacity={0.82}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.error + '80'} />
          </TouchableOpacity>
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
    paddingHorizontal: 20, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: '500', marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24 },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 1 },
  rowSubtitle: { fontSize: 12, color: colors.textTertiary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 70 },
  badgeWrap: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 14, ...shadows.card,
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.error },
});

export default AdminSettingsScreen;
