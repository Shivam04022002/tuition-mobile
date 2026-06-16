import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAdminKyc } from '../../hooks/useKyc';

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  submitted: '#3B82F6',
  under_review: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  reupload_required: '#F59E0B',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  PAN_CARD: 'PAN Card',
  AADHAAR_FRONT: 'Aadhaar Front',
  AADHAAR_BACK: 'Aadhaar Back',
  BANK_PROOF: 'Bank Proof',
  ADDRESS_PROOF: 'Address Proof',
  SELFIE_PHOTO: 'Selfie Photo',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

const AdminKycDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useTheme();
  const { kycId } = route.params || {};

  const {
    detail,
    isLoading,
    isProcessing,
    error,
    fetchDetail,
    handleApprove,
    handleReject,
    handleRequestReupload,
  } = useAdminKyc();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [reuploadModalVisible, setReuploadModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reuploadNotes, setReuploadNotes] = useState('');

  useEffect(() => {
    if (kycId) {
      fetchDetail(kycId);
    }
  }, [kycId, fetchDetail]);

  const onApprove = useCallback(() => {
    Alert.alert(
      'Approve KYC',
      'This will mark the teacher as verified. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await handleApprove(kycId);
              Alert.alert('Success', 'KYC approved successfully');
              navigation.goBack();
            } catch {}
          },
        },
      ],
    );
  }, [kycId, handleApprove, navigation]);

  const onReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    try {
      await handleReject(kycId, rejectReason.trim());
      setRejectModalVisible(false);
      setRejectReason('');
      Alert.alert('Done', 'KYC rejected');
      navigation.goBack();
    } catch {}
  }, [kycId, rejectReason, handleReject, navigation]);

  const onRequestReupload = useCallback(async () => {
    if (!reuploadNotes.trim()) {
      Alert.alert('Error', 'Please provide notes explaining what needs to be re-uploaded');
      return;
    }
    try {
      await handleRequestReupload(kycId, reuploadNotes.trim());
      setReuploadModalVisible(false);
      setReuploadNotes('');
      Alert.alert('Done', 'Re-upload request sent to teacher');
      navigation.goBack();
    } catch {}
  }, [kycId, reuploadNotes, handleRequestReupload, navigation]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Loading KYC details...</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Failed to load details'}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.colors.secondary }]} onPress={() => fetchDetail(kycId)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kyc = detail.kyc;
  const teacher = detail.teacherProfile;
  const statusColor = STATUS_COLORS[kyc.status] || '#6B7280';
  const teacherName = teacher?.basicDetails?.fullName || 'Unknown Teacher';
  const canAct = kyc.status === 'submitted' || kyc.status === 'under_review';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Review</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Teacher Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teacher Profile</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{teacherName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{teacher?.basicDetails?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoValue}>{teacher?.basicDetails?.mobileNumber || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Profile Completion</Text>
              <Text style={styles.infoValue}>{detail.profileCompletion}%</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Verification Status</Text>
              <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{kyc.status?.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* KYC Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KYC Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>KYC ID</Text>
              <Text style={styles.infoValue}>{kyc.kycId}</Text>
            </View>
            {kyc.submittedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Submitted</Text>
                <Text style={styles.infoValue}>{new Date(kyc.submittedAt).toLocaleString('en-IN')}</Text>
              </View>
            )}
            {kyc.reviewedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reviewed</Text>
                <Text style={styles.infoValue}>{new Date(kyc.reviewedAt).toLocaleString('en-IN')}</Text>
              </View>
            )}
            {kyc.verificationNotes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={[styles.infoValue, { flex: 1 }]}>{kyc.verificationNotes}</Text>
              </View>
            )}
            {kyc.rejectionReason && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rejection</Text>
                <Text style={[styles.infoValue, { color: '#EF4444', flex: 1 }]}>{kyc.rejectionReason}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Documents ({kyc.documents?.length || 0})</Text>
          {(kyc.documents || []).map((doc: any, idx: number) => {
            const docColor = STATUS_COLORS[doc.verificationStatus] || '#6B7280';
            return (
              <View key={doc._id || idx} style={styles.docCard}>
                <View style={styles.docHeader}>
                  <Text style={styles.docType}>{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</Text>
                  <View style={[styles.badge, { backgroundColor: docColor + '15' }]}>
                    <Text style={[styles.badgeText, { color: docColor }]}>{doc.verificationStatus}</Text>
                  </View>
                </View>
                {doc.documentUrl && (
                  <Image source={{ uri: doc.documentUrl }} style={styles.docImage} resizeMode="cover" />
                )}
                <View style={styles.docMeta}>
                  <Text style={styles.docMetaText}>
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                  </Text>
                  {doc.notes && <Text style={styles.docNotes}>Note: {doc.notes}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        {canAct && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={onApprove}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => setRejectModalVisible(true)}
              disabled={isProcessing}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => setReuploadModalVisible(true)}
              disabled={isProcessing}
            >
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Request Reupload</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject KYC</Text>
            <Text style={styles.modalSubtitle}>Provide a reason for rejection</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setRejectModalVisible(false); setRejectReason(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444' }]} onPress={onReject} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalConfirmText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reupload Modal */}
      <Modal visible={reuploadModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Re-upload</Text>
            <Text style={styles.modalSubtitle}>Explain what documents need to be re-uploaded and why</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter notes for the teacher..."
              value={reuploadNotes}
              onChangeText={setReuploadNotes}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setReuploadModalVisible(false); setReuploadNotes(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#F59E0B' }]} onPress={onRequestReupload} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalConfirmText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: { padding: 16 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },

  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280', width: 120 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827' },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  docCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  docType: { fontSize: 14, fontWeight: '600', color: '#111827' },
  docImage: { width: '100%', height: 160, borderRadius: 8, backgroundColor: '#E5E7EB', marginBottom: 8 },
  docMeta: {},
  docMetaText: { fontSize: 12, color: '#6B7280' },
  docNotes: { fontSize: 12, color: '#F59E0B', marginTop: 4 },

  actionsSection: { gap: 10, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, gap: 8 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default AdminKycDetailScreen;
