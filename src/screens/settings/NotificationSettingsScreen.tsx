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

interface NotifSetting {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
  iconColor: string;
  value: boolean;
}

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [settings, setSettings] = useState<Record<string, boolean>>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    paymentUpdates: true,
    leadUpdates: true,
    demoClassUpdates: true,
    marketingMessages: false,
  });

  const notifItems: NotifSetting[] = [
    {
      key: 'pushNotifications',
      icon: 'phone-portrait-outline',
      label: 'Push Notifications',
      subtitle: 'In-app alerts on your device',
      iconColor: colors.primary,
      value: settings.pushNotifications,
    },
    {
      key: 'emailNotifications',
      icon: 'mail-outline',
      label: 'Email Notifications',
      subtitle: 'Receive updates via email',
      iconColor: colors.info,
      value: settings.emailNotifications,
    },
    {
      key: 'smsNotifications',
      icon: 'chatbubble-outline',
      label: 'SMS Notifications',
      subtitle: 'Text messages to your mobile',
      iconColor: colors.success,
      value: settings.smsNotifications,
    },
  ];

  const activityItems: NotifSetting[] = [
    {
      key: 'paymentUpdates',
      icon: 'card-outline',
      label: 'Payment Updates',
      subtitle: 'Receipts, refunds & billing',
      iconColor: colors.accent,
      value: settings.paymentUpdates,
    },
    {
      key: 'leadUpdates',
      icon: 'people-outline',
      label: 'Lead Updates',
      subtitle: 'New leads and applications',
      iconColor: colors.secondary,
      value: settings.leadUpdates,
    },
    {
      key: 'demoClassUpdates',
      icon: 'videocam-outline',
      label: 'Demo Class Updates',
      subtitle: 'Scheduling and reminders',
      iconColor: colors.pink,
      value: settings.demoClassUpdates,
    },
    {
      key: 'marketingMessages',
      icon: 'megaphone-outline',
      label: 'Marketing Messages',
      subtitle: 'Offers, tips & promotions',
      iconColor: colors.textSecondary,
      value: settings.marketingMessages,
    },
  ];

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderRow = (item: NotifSetting, idx: number, total: number) => (
    <React.Fragment key={item.key}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: item.iconColor + '18' }]}>
          <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
        </View>
        <Switch
          value={item.value}
          onValueChange={() => toggle(item.key)}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={item.value ? colors.primary : colors.textTertiary}
          ios_backgroundColor={colors.border}
        />
      </View>
      {idx < total - 1 && <View style={styles.divider} />}
    </React.Fragment>
  );

  const allOn = Object.values(settings).every(Boolean);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.allBtn}
          onPress={() => {
            const newVal = !allOn;
            setSettings({
              pushNotifications: newVal,
              emailNotifications: newVal,
              smsNotifications: newVal,
              paymentUpdates: newVal,
              leadUpdates: newVal,
              demoClassUpdates: newVal,
              marketingMessages: newVal,
            });
          }}
        >
          <Text style={styles.allBtnText}>{allOn ? 'Off All' : 'All On'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            Manage how and when you receive updates from the platform.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>CHANNELS</Text>
        <View style={styles.card}>
          {notifItems.map((item, idx) => renderRow(item, idx, notifItems.length))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ACTIVITY ALERTS</Text>
        <View style={styles.card}>
          {activityItems.map((item, idx) => renderRow(item, idx, activityItems.length))}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
          <Text style={styles.noteText}>
            Critical account alerts (security, payments) are always sent regardless of these settings.
          </Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },
  allBtn: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
  },
  allBtnText: { fontSize: 13, fontWeight: '700', color: colors.textWhite },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight,
    padding: 14, borderRadius: 14, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 20, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 20,
    overflow: 'hidden', ...shadows.card,
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
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 1 },
  rowSubtitle: { fontSize: 12, color: colors.textTertiary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 70 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.successLight,
    padding: 14, borderRadius: 14, marginTop: 20,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.success, lineHeight: 19, fontWeight: '500' },
});

export default NotificationSettingsScreen;
