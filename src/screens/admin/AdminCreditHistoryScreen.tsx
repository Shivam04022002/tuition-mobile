import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { CreditDetail, CreditTransaction, getTeacherCredits, grantCredits, deductCredits, grantBonusCredits, correctCredits } from '../../services/adminCreditsApi';

interface Props {
  navigation: any;
  route: { params?: { teacherId?: string } };
}

const transactionTypeColors: Record<string, string> = {
  CREDIT_GRANTED: '#10B981',
  LEAD_UNLOCK: '#EF4444',
  CREDIT_REFUND: '#3B82F6',
  BONUS_CREDIT: '#8B5CF6',
  PLAN_UPGRADE: '#F59E0B',
};

const transactionTypeLabels: Record<string, string> = {
  CREDIT_GRANTED: 'Granted',
  LEAD_UNLOCK: 'Unlock',
  CREDIT_REFUND: 'Refund',
  BONUS_CREDIT: 'Bonus',
  PLAN_UPGRADE: 'Plan Upgrade',
};

const bonusTypes = [
  { value: 'referral', label: 'Referral Bonus' },
  { value: 'loyalty', label: 'Loyalty Reward' },
  { value: 'promotion', label: 'Promotional' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'goodwill', label: 'Goodwill' },
  { value: 'manual', label: 'Manual' },
];

export default function AdminCreditHistoryScreen({ navigation, route }: Props) {
  const teacherId = route.params?.teacherId;
  const [detail, setDetail] = useState<CreditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [bonusType, setBonusType] = useState('manual');
  const [newBalance, setNewBalance] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!teacherId) return;
    try {
      const response = await getTeacherCredits(teacherId);
      if (response.success) setDetail(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load credit details');
    }
  }, [teacherId]);

  useEffect(() => { if (teacherId) { loadDetail().then(() => setLoading(false)); } else { setLoading(false); } }, [loadDetail, teacherId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDetail();
    setRefreshing(false);
  };

  const handleAction = async () => {
    if (!teacherId) return;
    if (!reason.trim()) { Alert.alert('Required', 'Please enter a reason'); return; }
    setProcessing(true);
    try {
      let response;
      switch (actionModal) {
        case 'grant': response = await grantCredits(teacherId, parseInt(amount), reason); break;
        case 'deduct': response = await deductCredits(teacherId, parseInt(amount), reason); break;
        case 'bonus': response = await grantBonusCredits(teacherId, parseInt(amount), reason, bonusType); break;
        case 'correct': response = await correctCredits(teacherId, parseInt(newBalance), reason); break;
        default: return;
      }
      if (response.success) {
        Alert.alert('Success', response.message);
        setActionModal(null);
        setAmount('');
        setReason('');
        setNewBalance('');
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
    const titles: Record<string, string> = { grant: 'Grant Credits', deduct: 'Deduct Credits', bonus: 'Grant Bonus', correct: 'Correct Balance' };
    return (
      <Modal visible={true} transparent animationType="fade" onRequestClose={() => setActionModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{titles[actionModal]}</Text>
            {(actionModal === 'grant' || actionModal === 'deduct' || actionModal === 'bonus') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Enter credit amount" />
              </View>
            )}
            {actionModal === 'bonus' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bonus Type</Text>
                <View style={styles.bonusTypes}>
                  {bonusTypes.map(type => (
                    <TouchableOpacity key={type.value} style={[styles.bonusTypeButton, bonusType === type.value && styles.bonusTypeActive]} onPress={() => setBonusType(type.value)}>
                      <Text style={[styles.bonusTypeText, bonusType === type.value && styles.bonusTypeTextActive]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {actionModal === 'correct' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Balance *</Text>
                <TextInput style={styles.input} value={newBalance} onChangeText={setNewBalance} keyboardType="number-pad" placeholder="Enter new balance" />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason} placeholder="Enter reason..." multiline numberOfLines={3} />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => { setActionModal(null); setAmount(''); setReason(''); }}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleAction} disabled={processing}>
                {processing ? <ActivityIndicator color={colors.textWhite} /> : <Text style={styles.modalButtonTextConfirm}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTransaction = (tx: CreditTransaction, index: number) => (
    <View key={tx._id || index} style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={[styles.typeBadge, { backgroundColor: transactionTypeColors[tx.type] || colors.textTertiary }]}>
          <Text style={styles.typeText}>{transactionTypeLabels[tx.type] || tx.type}</Text>
        </View>
        <Text style={[styles.amountText, { color: tx.amount > 0 ? colors.success : colors.error }]}>
          {tx.amount > 0 ? '+' : ''}{tx.amount}
        </Text>
      </View>
      <Text style={styles.description}>{tx.description}</Text>
      <View style={styles.transactionFooter}>
        <Text style={styles.balanceInfo}>Balance: {tx.balanceBefore} → {tx.balanceAfter}</Text>
        <Text style={styles.date}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</Text>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!teacherId) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit History</Text>
        <View style={styles.backButton} />
      </View>
      <View style={styles.noSelection}>
        <Ionicons name="wallet-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.noSelectionText}>Select a teacher from Credits Management</Text>
        <TouchableOpacity style={styles.gotoButton} onPress={() => navigation.navigate('AdminCreditsManagement')}>
          <Text style={styles.gotoButtonText}>Go to Credits Management</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const { subscription, transactions, summary, auditHistory } = detail || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit History</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.section}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{subscription?.credits?.creditsRemaining === -1 ? 'Unlimited' : subscription?.credits?.creditsRemaining}</Text>
            <Text style={styles.balancePlan}>{subscription?.planName?.charAt(0).toUpperCase() + subscription?.planName?.slice(1)} Plan</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifetime Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary?.granted || 0}</Text>
                <Text style={styles.statLabel}>Granted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary?.consumed || 0}</Text>
                <Text style={styles.statLabel}>Consumed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary?.refunded || 0}</Text>
                <Text style={styles.statLabel}>Refunded</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary?.bonus || 0}</Text>
                <Text style={styles.statLabel}>Bonus</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.actionGrant]} onPress={() => setActionModal('grant')}>
              <Ionicons name="add-circle-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Grant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionDeduct]} onPress={() => setActionModal('deduct')}>
              <Ionicons name="remove-circle-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Deduct</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionBonus]} onPress={() => setActionModal('bonus')}>
              <Ionicons name="gift-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Bonus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionCorrect]} onPress={() => setActionModal('correct')}>
              <Ionicons name="create-outline" size={20} color={colors.textWhite} />
              <Text style={styles.actionText}>Correct</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions?.slice(0, 10).map(renderTransaction)}
          {!transactions?.length && <Text style={styles.noData}>No transactions yet</Text>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit History</Text>
          {auditHistory?.slice(0, 5).map((entry, idx) => (
            <View key={idx} style={styles.auditItem}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>{entry.action?.toUpperCase()}</Text>
                <Text style={[styles.auditAmount, { color: entry.amount > 0 ? colors.success : colors.error }]}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </Text>
              </View>
              <Text style={styles.auditReason}>{entry.reason}</Text>
              <Text style={styles.auditMeta}>Balance: {entry.balanceBefore} → {entry.balanceAfter}</Text>
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
  noSelection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noSelectionText: { fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: 'center' },
  gotoButton: { marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  gotoButtonText: { color: colors.textWhite, fontWeight: '600' },
  section: { margin: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  balanceCard: { backgroundColor: colors.primary, borderRadius: 12, padding: 24, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: colors.textLight },
  balanceValue: { fontSize: 48, fontWeight: '700', color: colors.textWhite, marginVertical: 8 },
  balancePlan: { fontSize: 14, color: colors.textLight },
  statsCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  actionGrant: { backgroundColor: colors.success },
  actionDeduct: { backgroundColor: colors.error },
  actionBonus: { backgroundColor: colors.secondary },
  actionCorrect: { backgroundColor: colors.info },
  actionText: { fontSize: 14, fontWeight: '600', color: colors.textWhite },
  transactionItem: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  typeText: { fontSize: 11, fontWeight: '600', color: colors.textWhite },
  amountText: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, color: colors.text, marginBottom: 4 },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceInfo: { fontSize: 12, color: colors.textSecondary },
  date: { fontSize: 12, color: colors.textSecondary },
  auditItem: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  auditAction: { fontSize: 12, fontWeight: '700', color: colors.primary },
  auditAmount: { fontSize: 14, fontWeight: '700' },
  auditReason: { fontSize: 13, color: colors.text, marginBottom: 2 },
  auditMeta: { fontSize: 11, color: colors.textSecondary },
  noData: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: colors.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  bonusTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bonusTypeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  bonusTypeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bonusTypeText: { fontSize: 13, color: colors.text },
  bonusTypeTextActive: { color: colors.textWhite },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.backgroundSecondary },
  modalButtonConfirm: { backgroundColor: colors.primary },
  modalButtonTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalButtonTextConfirm: { fontSize: 16, fontWeight: '600', color: colors.textWhite },
});
