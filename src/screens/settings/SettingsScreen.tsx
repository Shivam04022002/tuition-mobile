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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface SettingItem {
  icon: string;
  label: string;
  subtitle?: string;
  iconColor: string;
  onPress: () => void;
  badge?: string;
  danger?: boolean;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const accountItems: SettingItem[] = [
    {
      icon: 'person-outline',
      label: 'Profile',
      subtitle: 'Manage your personal info',
      iconColor: colors.primary,
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      subtitle: 'Push, email & SMS alerts',
      iconColor: colors.accent,
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      icon: 'shield-outline',
      label: 'Privacy',
      subtitle: 'Control your visibility',
      iconColor: colors.secondary,
      onPress: () => navigation.navigate('PrivacySettings'),
    },
    {
      icon: 'language-outline',
      label: 'Language',
      subtitle: 'English, Hindi & more',
      iconColor: colors.info,
      onPress: () => navigation.navigate('LanguageSettings'),
    },
    ...(role === 'teacher'
      ? [{
          icon: 'calendar-outline',
          label: 'Availability',
          subtitle: 'Days, slots & teaching mode',
          iconColor: colors.success,
          onPress: () => navigation.navigate('AvailabilitySettings'),
        }]
      : []),
  ];

  const supportItems: SettingItem[] = [
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'Get help from our team',
      iconColor: colors.success,
      onPress: () => navigation.navigate('Support', { role }),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: 'FAQs',
      subtitle: 'Frequently asked questions',
      iconColor: colors.info,
      onPress: () => navigation.navigate('SupportFAQ'),
    },
  ];

  const dataItems: SettingItem[] = [
    {
      icon: 'download-outline',
      label: 'Download My Data',
      subtitle: 'Export your account data',
      iconColor: colors.secondary,
      onPress: () => navigation.navigate('DataManagement', { action: 'download' }),
    },
    {
      icon: 'trash-outline',
      label: 'Delete Account',
      subtitle: 'Permanently remove your account',
      iconColor: colors.error,
      onPress: () => navigation.navigate('DataManagement', { action: 'delete' }),
      danger: true,
    },
  ];

  const aboutItems: SettingItem[] = [
    {
      icon: 'document-text-outline',
      label: 'Terms of Service',
      subtitle: '',
      iconColor: colors.textSecondary,
      onPress: () => {},
    },
    {
      icon: 'lock-closed-outline',
      label: 'Privacy Policy',
      subtitle: '',
      iconColor: colors.textSecondary,
      onPress: () => {},
    },
    {
      icon: 'card-outline',
      label: 'Refund Policy',
      subtitle: '',
      iconColor: colors.textSecondary,
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline',
      label: 'App Version',
      subtitle: 'v1.0.0 (Build 100)',
      iconColor: colors.textTertiary,
      onPress: () => {},
      badge: 'v1.0.0',
    },
  ];

  const groups: SettingGroup[] = [
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
    { title: 'Data', items: dataItems },
    { title: 'About', items: aboutItems },
  ];

  const renderItem = (item: SettingItem, idx: number, total: number) => (
    <React.Fragment key={item.label}>
      <TouchableOpacity
        style={styles.row}
        onPress={item.onPress}
        activeOpacity={0.72}
      >
        <View style={[styles.iconWrap, { backgroundColor: item.iconColor + '18' }]}>
          <Ionicons name={item.icon as any} size={20} color={item.danger ? colors.error : item.iconColor} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, item.danger && { color: colors.error }]}>
            {item.label}
          </Text>
          {!!item.subtitle && (
            <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.badge ? (
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={item.danger ? colors.error + '80' : colors.textTertiary}
          />
        )}
      </TouchableOpacity>
      {idx < total - 1 && <View style={styles.divider} />}
    </React.Fragment>
  );

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.title.toUpperCase()}</Text>
            <View style={styles.card}>
              {group.items.map((item, idx) =>
                renderItem(item, idx, group.items.length)
              )}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24 },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 1,
  },
  rowSubtitle: {
    fontSize: 12, color: colors.textTertiary, fontWeight: '400',
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 70 },

  badgeWrap: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
});

export default SettingsScreen;
