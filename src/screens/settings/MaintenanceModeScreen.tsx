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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

type PlatformStatus = 'online' | 'maintenance';

const MaintenanceModeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [status, setStatus] = useState<PlatformStatus>('online');
  const [affectedServices, setAffectedServices] = useState<Record<string, boolean>>({
    api: false,
    payments: false,
    notifications: false,
    search: false,
    uploads: false,
  });
  const [confirmModal, setConfirmModal] = useState(false);

  const isMaintenance = status === 'maintenance';

  const serviceItems = [
    { key: 'api', label: 'API Services', icon: 'server-outline', color: colors.primary },
    { key: 'payments', label: 'Payment Gateway', icon: 'card-outline', color: colors.success },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', color: colors.accent },
    { key: 'search', label: 'Search & Discovery', icon: 'search-outline', color: colors.info },
    { key: 'uploads', label: 'File Uploads', icon: 'cloud-upload-outline', color: colors.secondary },
  ];

  const toggleService = (key: string) => {
    setAffectedServices(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleMaintenance = () => {
    if (!isMaintenance) {
      setConfirmModal(true);
    } else {
      setStatus('online');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance Mode</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Platform Status Card */}
        <View style={[
          styles.statusCard,
          isMaintenance ? styles.statusCardMaintenance : styles.statusCardOnline,
        ]}>
          <View style={styles.statusCardLeft}>
            <View style={[styles.statusDot, { backgroundColor: isMaintenance ? colors.warning : colors.success }]} />
            <View>
              <Text style={styles.statusCardLabel}>Platform Status</Text>
              <Text style={[styles.statusCardValue, { color: isMaintenance ? colors.warning : colors.success }]}>
                {isMaintenance ? 'Under Maintenance' : 'Online & Operational'}
              </Text>
            </View>
          </View>
          <View style={styles.statusIconWrap}>
            <Ionicons
              name={isMaintenance ? 'construct-outline' : 'checkmark-circle-outline'}
              size={32}
              color={isMaintenance ? colors.warning : colors.success}
            />
          </View>
        </View>

        {/* Toggle Switch */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleIconWrap, { backgroundColor: isMaintenance ? colors.warning + '20' : colors.success + '15' }]}>
              <Ionicons
                name={isMaintenance ? 'construct-outline' : 'radio-button-on-outline'}
                size={22}
                color={isMaintenance ? colors.warning : colors.success}
              />
            </View>
            <View>
              <Text style={styles.toggleLabel}>Maintenance Mode</Text>
              <Text style={styles.toggleSubtitle}>
                {isMaintenance ? 'Users see a maintenance page' : 'Platform is fully accessible'}
              </Text>
            </View>
          </View>
          <Switch
            value={isMaintenance}
            onValueChange={handleToggleMaintenance}
            trackColor={{ false: colors.success + '50', true: colors.warning + '50' }}
            thumbColor={isMaintenance ? colors.warning : colors.success}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Affected Services */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>AFFECTED SERVICES</Text>
        <Text style={styles.sectionDesc}>
          Select which services are impacted during maintenance.
        </Text>
        <View style={styles.card}>
          {serviceItems.map((item, idx) => (
            <React.Fragment key={item.key}>
              <View style={styles.serviceRow}>
                <View style={[styles.serviceIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.serviceLabel}>{item.label}</Text>
                <Switch
                  value={affectedServices[item.key]}
                  onValueChange={() => toggleService(item.key)}
                  trackColor={{ false: colors.border, true: colors.warning + '50' }}
                  thumbColor={affectedServices[item.key] ? colors.warning : colors.textTertiary}
                  ios_backgroundColor={colors.border}
                />
              </View>
              {idx < serviceItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Impact Summary */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>MAINTENANCE IMPACT</Text>
        <View style={styles.impactCard}>
          <View style={styles.impactRow}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.impactText}>
              All active users will see a maintenance banner
            </Text>
          </View>
          <View style={styles.dividerH} />
          <View style={styles.impactRow}>
            <Ionicons name="notifications-off-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.impactText}>
              New registrations and logins will be blocked
            </Text>
          </View>
          <View style={styles.dividerH} />
          <View style={styles.impactRow}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.impactText}>
              Scheduled tasks and cron jobs will be paused
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noteText}>
            This is a UI-only toggle. No backend action is performed. Production integration will call the system API.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirm Modal */}
      <Modal
        visible={confirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="construct-outline" size={36} color={colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Enable Maintenance?</Text>
            <Text style={styles.modalDesc}>
              This will put the platform in maintenance mode. All users will see a maintenance page and new activity will be blocked.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => { setStatus('maintenance'); setConfirmModal(false); }}
              >
                <Text style={styles.modalConfirmText}>Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  statusCard: {
    borderRadius: 20, padding: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, ...shadows.card, borderWidth: 1.5,
  },
  statusCardOnline: { backgroundColor: colors.successLight, borderColor: colors.success + '40' },
  statusCardMaintenance: { backgroundColor: colors.warningLight, borderColor: colors.warning + '40' },
  statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusCardLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 2 },
  statusCardValue: { fontSize: 17, fontWeight: '800' },
  statusIconWrap: {},

  toggleCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...shadows.card,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIconWrap: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  toggleSubtitle: { fontSize: 12, color: colors.textSecondary },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 4, paddingHorizontal: 4,
  },
  sectionDesc: { fontSize: 12, color: colors.textTertiary, marginBottom: 8, paddingHorizontal: 4 },

  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  serviceIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },

  impactCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },
  impactRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  impactText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  dividerH: { height: 1, backgroundColor: colors.border, marginLeft: 44 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.infoLight, padding: 14, borderRadius: 14, marginTop: 20,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', ...shadows.lg },
  modalIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  modalDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.backgroundSecondary, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.warning, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: colors.textWhite },
});

export default MaintenanceModeScreen;
