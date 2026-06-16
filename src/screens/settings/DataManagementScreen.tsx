import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const DataManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'final'>('confirm');

  const handleDownload = () => {
    // Coming soon – no API call
  };

  const handleDeleteConfirm = () => {
    if (deleteStep === 'confirm') {
      setDeleteStep('final');
    } else {
      // No backend action
      setDeleteModalVisible(false);
      setDeleteStep('confirm');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data & Account</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your data belongs to you. Download a full export or permanently remove your account below.
          </Text>
        </View>

        {/* Download Card */}
        <Text style={styles.sectionLabel}>YOUR DATA</Text>
        <TouchableOpacity style={styles.downloadCard} onPress={handleDownload} activeOpacity={0.82}>
          <View style={styles.downloadIconWrap}>
            <Ionicons name="cloud-download-outline" size={32} color={colors.primary} />
          </View>
          <View style={styles.downloadText}>
            <Text style={styles.downloadTitle}>Download My Data</Text>
            <Text style={styles.downloadSubtitle}>
              Export your profile, activity, and preferences as a file
            </Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.dataItemsCard}>
          {[
            { icon: 'person-outline', label: 'Profile & Personal Info', color: colors.primary },
            { icon: 'chatbubble-outline', label: 'Messages & Conversations', color: colors.info },
            { icon: 'card-outline', label: 'Payment History', color: colors.success },
            { icon: 'star-outline', label: 'Reviews & Ratings', color: colors.accent },
            { icon: 'document-text-outline', label: 'Applications & Leads', color: colors.secondary },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <View style={styles.dataRow}>
                <View style={[styles.dataIconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.dataLabel}>{item.label}</Text>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Delete Account */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>DANGER ZONE</Text>
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <View style={styles.dangerIconWrap}>
              <Ionicons name="warning-outline" size={24} color={colors.error} />
            </View>
            <View style={styles.dangerHeaderText}>
              <Text style={styles.dangerTitle}>Delete Account</Text>
              <Text style={styles.dangerSubtitle}>This action cannot be undone</Text>
            </View>
          </View>
          <Text style={styles.dangerDesc}>
            Deleting your account will permanently remove all your data including profile,
            messages, payment history, and reviews. This cannot be reversed.
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => { setDeleteStep('confirm'); setDeleteModalVisible(true); }}
            activeOpacity={0.82}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textWhite} />
            <Text style={styles.deleteBtnText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setDeleteModalVisible(false); setDeleteStep('confirm'); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons
                name={deleteStep === 'confirm' ? 'alert-circle-outline' : 'trash-outline'}
                size={36}
                color={colors.error}
              />
            </View>
            <Text style={styles.modalTitle}>
              {deleteStep === 'confirm' ? 'Are you sure?' : 'Final Confirmation'}
            </Text>
            <Text style={styles.modalDesc}>
              {deleteStep === 'confirm'
                ? 'You are about to permanently delete your account and all associated data. This action cannot be undone.'
                : 'Once deleted, your account cannot be recovered. All data will be permanently erased from our servers.'}
            </Text>

            {deleteStep === 'final' && (
              <View style={styles.modalWarning}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
                <Text style={styles.modalWarningText}>No backend action — UI demo only</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setDeleteModalVisible(false); setDeleteStep('confirm'); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={handleDeleteConfirm}>
                <Text style={styles.modalDeleteText}>
                  {deleteStep === 'confirm' ? 'Yes, Continue' : 'Delete Account'}
                </Text>
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

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.primary + '12', padding: 16, borderRadius: 16,
    marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '25',
  },
  infoText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 20, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },

  downloadCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    ...shadows.card,
  },
  downloadIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  downloadText: { flex: 1 },
  downloadTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  downloadSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  comingSoonBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  comingSoonText: { fontSize: 11, fontWeight: '700', color: colors.accent },

  dataItemsCard: {
    backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden',
    ...shadows.card,
  },
  dataRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dataIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dataLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },

  dangerCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: colors.error + '25', ...shadows.card,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dangerIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.error + '14',
    justifyContent: 'center', alignItems: 'center',
  },
  dangerHeaderText: { flex: 1 },
  dangerTitle: { fontSize: 17, fontWeight: '800', color: colors.error },
  dangerSubtitle: { fontSize: 12, color: colors.error + '80', fontWeight: '500', marginTop: 2 },
  dangerDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  deleteBtn: {
    backgroundColor: colors.error, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: colors.textWhite },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.card, borderRadius: 24, padding: 24,
    width: '100%', alignItems: 'center', ...shadows.lg,
  },
  modalIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: colors.error + '14',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  modalDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  modalWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorLight, padding: 10, borderRadius: 10, marginBottom: 8,
  },
  modalWarningText: { fontSize: 12, color: colors.error, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.backgroundSecondary, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  modalDeleteBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.error, alignItems: 'center',
  },
  modalDeleteText: { fontSize: 15, fontWeight: '700', color: colors.textWhite },
});

export default DataManagementScreen;
