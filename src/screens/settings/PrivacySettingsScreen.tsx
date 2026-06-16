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

interface PrivacySetting {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
  iconColor: string;
}

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [settings, setSettings] = useState<Record<string, boolean>>({
    showProfilePublicly: true,
    allowContactSuggestions: false,
    locationVisibility: true,
    profileDiscoverability: true,
  });

  const privacyItems: PrivacySetting[] = [
    {
      key: 'showProfilePublicly',
      icon: 'eye-outline',
      label: 'Show Profile Publicly',
      subtitle: 'Allow others to view your profile',
      iconColor: colors.primary,
    },
    {
      key: 'allowContactSuggestions',
      icon: 'people-circle-outline',
      label: 'Allow Contact Suggestions',
      subtitle: 'Be suggested to similar users',
      iconColor: colors.secondary,
    },
    {
      key: 'locationVisibility',
      icon: 'location-outline',
      label: 'Location Visibility',
      subtitle: 'Show your area to tutors/parents',
      iconColor: colors.accent,
    },
    {
      key: 'profileDiscoverability',
      icon: 'search-outline',
      label: 'Profile Discoverability',
      subtitle: 'Appear in search results',
      iconColor: colors.info,
    },
  ];

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>
            Control who can see your profile and how you appear across the platform.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>VISIBILITY CONTROLS</Text>
        <View style={styles.card}>
          {privacyItems.map((item, idx) => (
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
                  value={settings[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={settings[item.key] ? colors.primary : colors.textTertiary}
                  ios_backgroundColor={colors.border}
                />
              </View>
              {idx < privacyItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Quick Summary */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>CURRENT STATUS</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Ionicons
              name={settings.showProfilePublicly ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={settings.showProfilePublicly ? colors.success : colors.error}
            />
            <Text style={styles.summaryText}>
              Profile is{' '}
              <Text style={{ color: settings.showProfilePublicly ? colors.success : colors.error, fontWeight: '700' }}>
                {settings.showProfilePublicly ? 'visible' : 'hidden'}
              </Text>{' '}
              to others
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Ionicons
              name={settings.profileDiscoverability ? 'search-outline' : 'search-circle-outline'}
              size={18}
              color={settings.profileDiscoverability ? colors.success : colors.error}
            />
            <Text style={styles.summaryText}>
              Discoverable in search:{' '}
              <Text style={{ color: settings.profileDiscoverability ? colors.success : colors.error, fontWeight: '700' }}>
                {settings.profileDiscoverability ? 'Yes' : 'No'}
              </Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Ionicons
              name={settings.locationVisibility ? 'location-outline' : 'location-outline'}
              size={18}
              color={settings.locationVisibility ? colors.success : colors.error}
            />
            <Text style={styles.summaryText}>
              Location sharing:{' '}
              <Text style={{ color: settings.locationVisibility ? colors.success : colors.error, fontWeight: '700' }}>
                {settings.locationVisibility ? 'Enabled' : 'Disabled'}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noteText}>
            Changes are saved automatically. Your data is always encrypted and never sold to third parties.
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

  heroBanner: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 24, ...shadows.card,
  },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.primary + '14',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

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

  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  summaryText: { fontSize: 14, color: colors.text },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight, padding: 14, borderRadius: 14, marginTop: 20,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19, fontWeight: '500' },
});

export default PrivacySettingsScreen;
