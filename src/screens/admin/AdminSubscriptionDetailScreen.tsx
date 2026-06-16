import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { SubscriptionDetail, getSubscriptionDetail, upgradeSubscription, downgradeSubscription, extendSubscription, suspendSubscription, reactivateSubscription, cancelSubscription } from '../../services/adminSubscriptionApi';

interface Props {
  navigation: any;
  route: { params: { teacherId: string; subscriptionId: string } };
}

const planOptions = [
  { value: 'free', label: 'Free', displayName: 'Free Plan' },
  { value: 'starter', label: 'Starter', displayName: 'Starter Plan' },
  { value: 'professional', label: 'Professional', displayName: 'Professional Plan' },
  { value: 'premium', label: 'Premium', displayName: 'Premium Plan' },
];

export default function AdminSubscriptionDetailScreen({ navigation, route }: Props) {
  const { teacherId, subscriptionId } = route.params;
  const [detail, setDetail] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [targetPlan, setTargetPlan] = useState('');
  const [extensionDays, setExtensionDays] = useState('30');
  const [processing, setProcessing] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const response = await getSubscriptionDetail(teacherId);
      if (response.success) setDetail(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load subscription details');
    }
  }, [teacherId]);

  useEffect(() => { loadDetail().then(() => setLoading(false)); }, [loadDetail]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDetail();
    setRefreshing(false);
  };

  const handleAction = async (action: string) => {
    if (!reason.trim()) { Alert.alert('Required', 'Please enter a reason'); return; }
    setProcessing(true);
    try {
      let response;
      switch (action) {
        case 'upgrade': response = await upgradeSubscription(teacherId, targetPlan, reason); break;
        case 'downgrade': response = await downgradeSubscription(teacherId, targetPlan, reason); break;
        case 'extend': response = await extendSubscription(teacherId, parseInt(extensionDays), reason); break;
        case 'suspend': response = await suspendSubscription(teacherId, reason); break;
        case 'reactivate': response = await reactivateSubscription(teacherId, reason); break;
        case 'cancel': response = await cancelSubscription(teacherId, reason); break;
        default: return;
      }
      if (response.success) {
        Alert.alert('Success', response.message);
        setActionModal(null);
        setReason('');
        await loadDetail();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderActionModal = () => {
    if (!actionModal) return null;
    const titles: Record<string, string> = { upgrade: 'Upgrade Plan', downgrade: 'Downgrade Plan', extend: 'Extend Subscription', suspend: 'Suspend Subscription', reactivate: 'Reactivate Subscription', cancel: 'Cancel Subscription' };
    return (
      <Modal visible={true} transparent animationType="fade" onRequestClose={() => setActionModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{titles[actionModal]}</Text>
            {(actionModal === 'upgrade' || actionModal === 'downgrade') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Plan</Text>
                <View style={styles.planButtons}>
                  {planOptions.map(plan => (
                    <TouchableOpacity key={plan.value} style={[styles.planButton, targetPlan === plan.value && styles.planButtonActive]} onPress={() => setTargetPlan(plan.value)}>
                      <Text style={[styles.planButtonText, targetPlan === plan.value && styles.planButtonTextActive]}>{plan.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {actionModal === 'extend' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Extension Days</Text>
                <TextInput style={styles.input} value={extensionDays} onChangeText={setExtensionDays} keyboardType="number-pad" />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason} placeholder="Enter reason for this action..." multiline numberOfLines={3} />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => { setActionModal(null); setReason(''); }}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={() => handleAction(actionModal)} disabled={processing}>
                {processing ? <ActivityIndicator color={colors.textWhite} /> : <Text style={styles.modalButtonTextConfirm}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading || !detail) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const { subscription, payments, creditTransactions, auditHistory } = detail;
  const isActive = subscription.status === 'active';
  const isSuspended = subscription.status === 'suspended';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Detail</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teacher Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.teacherName}>{subscription.teacherId?.basicDetails?.fullName || 'Unknown'}</Text>
            <Text style={styles.teacherEmail}>{subscription.userId?.email}</Text>
            <Text style={styles.teacherPhone}>{subscription.teacherId?.basicDetails?.mobileNumber}</Text>
            <View style={[styles.kycBadge, { backgroundColor: subscription.teacherId?.verificationStatus === 'verified' ? colors.success : colors.warning }]}>
              <Text style={styles.kycText}>KYC: {subscription.teacherId?.verificationStatus}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Status</Text>
          <View style={styles.infoCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Plan:</Text>
              <Text style={[styles.statusValue, { color: planOptions.find(p => p.value === subscription.planName)?.value === 'premium' ? colors.accent : colors.primary }]}>
                {subscription.planName?.charAt(0).toUpperCase() + subscription.planName?.slice(1)}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: isActive ? colors.success : isSuspended ? colors.error : colors.textSecondary }]}>
                {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Start Date:</Text>
              <Text style={styles.statusValue}>{new Date(subscription.startDate).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>End Date:</Text>
              <Text style={styles.statusValue}>{new Date(subscription.endDate).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Auto Renew:</Text>
              <Text style={styles.statusValue}>{subscription.autoRenew ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits & Usage</Text>
          <View style={styles.infoCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{subscription.credits?.creditsRemaining === -1 ? '∞' : subscription.credits?.creditsRemaining}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{subscription.credits?.creditsUsed || 0}</Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{subscription.usage?.applicationsUsed || 0}</Text>
                <Text style={styles.statLabel}>Applications</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{subscription.usage?.leadUnlocksUsed || 0}</Text>
                <Text style={styles.statLabel}>Unlocks</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionButton, styles.actionUpgrade]} onPress={() => setActionModal('upgrade')}>
              <Ionicons name="trending-up-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Upgrade</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionDowngrade]} onPress={() => setActionModal('downgrade')}>
              <Ionicons name="trending-down-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Downgrade</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionExtend]} onPress={() => setActionModal('extend')}>
              <Ionicons name="calendar-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Extend</Text>
            </TouchableOpacity>
            {isActive ? (
              <TouchableOpacity style={[styles.actionButton, styles.actionSuspend]} onPress={() => setActionModal('suspend')}>
                <Ionicons name="pause-circle-outline" size={20} color={colors.textWhite} />
                <Text style={styles.actionText}>Suspend</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionButton, styles.actionReactivate]} onPress={() => setActionModal('reactivate')}>
                <Ionicons name="play-circle-outline" size={20} color={colors.textWhite} />
                <Text style={styles.actionText}>Reactivate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, styles.actionCancel]} onPress={() => setActionModal('cancel')}>
              <Ionicons name="close-circle-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Audit History</Text>
          {auditHistory?.slice(0, 5).map((entry, idx) => (
            <View key={idx} style={styles.auditItem}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>{entry.action?.toUpperCase()}</Text>
                <Text style={styles.auditDate}>{new Date(entry.timestamp).toLocaleDateString('en-IN')}</Text>
              </View>
              <Text style={styles.auditReason}>Reason: {entry.reason}</Text>
            </View>
          ))}
          {!auditHistory?.length && <Text style={styles.noData}>No audit history available</Text>}
        </View>
      </ScrollView>
      {renderActionModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textWhite },
  backButton: { padding: 4, width: 40 },
  section: { margin: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  infoCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  teacherName: { fontSize: 18, fontWeight: '700', color: colors.text },
  teacherEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  teacherPhone: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  kycBadge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  kycText: { fontSize: 12, fontWeight: '600', color: colors.textWhite },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusLabel: { fontSize: 14, color: colors.textSecondary },
  statusValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionUpgrade: { backgroundColor: colors.success },
  actionDowngrade: { backgroundColor: colors.info },
  actionExtend: { backgroundColor: colors.accent },
  actionSuspend: { backgroundColor: colors.warning },
  actionReactivate: { backgroundColor: colors.success },
  actionCancel: { backgroundColor: colors.error },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.textWhite },
  auditItem: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  auditAction: { fontSize: 12, fontWeight: '700', color: colors.primary },
  auditDate: { fontSize: 12, color: colors.textSecondary },
  auditReason: { fontSize: 13, color: colors.textSecondary },
  noData: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: colors.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  planButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  planButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  planButtonText: { fontSize: 14, color: colors.text },
  planButtonTextActive: { color: colors.textWhite },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.backgroundSecondary },
  modalButtonConfirm: { backgroundColor: colors.primary },
  modalButtonTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalButtonTextConfirm: { fontSize: 16, fontWeight: '600', color: colors.textWhite },
});
