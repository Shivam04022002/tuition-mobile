import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { useTeacherKyc } from '../../hooks/useKyc';
import { KycDocumentType, KycDocument } from '../../services/kycApi';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DOCUMENT_SECTIONS: {
  title: string;
  subtitle: string;
  types: { type: KycDocumentType; label: string; description: string }[];
}[] = [
  {
    title: 'Identity Documents',
    subtitle: 'PAN Card & Aadhaar for identity verification',
    types: [
      { type: 'PAN_CARD', label: 'PAN Card', description: 'Clear photo of your PAN card' },
      { type: 'AADHAAR_FRONT', label: 'Aadhaar Front', description: 'Front side of Aadhaar card' },
      { type: 'AADHAAR_BACK', label: 'Aadhaar Back', description: 'Back side of Aadhaar card' },
    ],
  },
  {
    title: 'Address Verification',
    subtitle: 'Any valid address proof document',
    types: [
      { type: 'ADDRESS_PROOF', label: 'Address Proof', description: 'Utility bill, voter ID, or passport' },
    ],
  },
  {
    title: 'Bank Verification',
    subtitle: 'Bank passbook or cancelled cheque',
    types: [
      { type: 'BANK_PROOF', label: 'Bank Proof', description: 'Cancelled cheque or passbook first page' },
    ],
  },
  {
    title: 'Selfie Verification',
    subtitle: 'A clear selfie holding your ID',
    types: [
      { type: 'SELFIE_PHOTO', label: 'Selfie Photo', description: 'Clear selfie photo for face verification' },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: colors.accent,
  verified: colors.success,
  rejected: '#EF4444',
  reupload_required: colors.accent,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TeacherKycScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    status,
    details,
    isLoading,
    isRefreshing,
    isUploading,
    isSubmitting,
    error,
    uploadError,
    refresh,
    retry,
    upload,
    replaceDocument,
    removeDocument,
    submit,
    clearUploadError,
  } = useTeacherKyc();

  const [uploadingType, setUploadingType] = useState<KycDocumentType | null>(null);

  const getDocumentForType = (type: KycDocumentType): KycDocument | undefined => {
    return details?.documents?.find(d => d.documentType === type);
  };

  const handlePickDocument = useCallback(async (type: KycDocumentType) => {
    clearUploadError();

    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const fileName = asset.name || `kyc_${type}_${Date.now()}.jpg`;

    setUploadingType(type);
    try {
      const existingDoc = getDocumentForType(type);
      if (existingDoc) {
        await replaceDocument(existingDoc._id, asset.uri, fileName);
      } else {
        await upload(type, asset.uri, fileName);
      }
    } catch {
      // Error handled in hook
    } finally {
      setUploadingType(null);
    }
  }, [upload, replaceDocument, clearUploadError, details]);

  const handleDeleteDocument = useCallback((doc: KycDocument) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeDocument(doc._id) },
      ],
    );
  }, [removeDocument]);

  const handleSubmit = useCallback(() => {
    Alert.alert(
      'Submit KYC',
      'Once submitted, you cannot modify documents until the review is complete. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submit().catch(() => {}) },
      ],
    );
  }, [submit]);

  // Progress calculation
  const requiredTypes: KycDocumentType[] = ['PAN_CARD', 'AADHAAR_FRONT', 'AADHAAR_BACK', 'SELFIE_PHOTO'];
  const uploadedRequired = requiredTypes.filter(t => getDocumentForType(t)).length;
  const progress = Math.round((uploadedRequired / requiredTypes.length) * 100);

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading KYC...</Text>
      </View>
    );
  }

  // Error state
  if (error && !status) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canSubmit = status?.canSubmit ?? false;
  const isLocked = status?.status === 'submitted' || status?.status === 'under_review' || status?.status === 'approved';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherKycStatus')}>
          <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Document Upload Progress</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {uploadedRequired}/{requiredTypes.length} required documents uploaded
          </Text>
        </View>

        {/* Upload Error Banner */}
        {uploadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={styles.errorBannerText}>{uploadError}</Text>
          </View>
        )}

        {/* Locked Banner */}
        {isLocked && (
          <View style={styles.lockedBanner}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.info} />
            <Text style={styles.lockedBannerText}>
              {status?.status === 'approved'
                ? 'KYC is approved. Documents are locked.'
                : 'KYC is under review. Documents cannot be modified.'}
            </Text>
          </View>
        )}

        {/* Document Sections */}
        {DOCUMENT_SECTIONS.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>

            {section.types.map((docType) => {
              const doc = getDocumentForType(docType.type);
              const isThisUploading = uploadingType === docType.type && isUploading;
              const isRequired = requiredTypes.includes(docType.type);

              return (
                <View key={docType.type} style={styles.documentCard}>
                  <View style={styles.docHeader}>
                    <View style={styles.docLabelRow}>
                      <Text style={styles.docLabel}>{docType.label}</Text>
                      {isRequired && <Text style={styles.requiredBadge}>Required</Text>}
                    </View>
                    {doc && (
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[doc.verificationStatus] + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[doc.verificationStatus] }]} />
                        <Text style={[styles.statusText, { color: STATUS_COLORS[doc.verificationStatus] }]}>
                          {doc.verificationStatus.replace('_', ' ')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.docDescription}>{docType.description}</Text>

                  {doc?.notes && (
                    <View style={styles.notesBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.accent} />
                      <Text style={styles.notesText}>{doc.notes}</Text>
                    </View>
                  )}

                  {doc ? (
                    <View style={styles.uploadedRow}>
                      <Image source={{ uri: doc.documentUrl }} style={styles.docThumbnail} />
                      <View style={styles.uploadedInfo}>
                        <Text style={styles.uploadedLabel}>Uploaded</Text>
                        <Text style={styles.uploadedDate}>
                          {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                      {!isLocked && (
                        <View style={styles.docActions}>
                          <TouchableOpacity
                            onPress={() => handlePickDocument(docType.type)}
                            style={styles.actionBtn}
                          >
                            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteDocument(doc)}
                            style={styles.actionBtn}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.uploadButton, isLocked && styles.uploadButtonDisabled]}
                      onPress={() => handlePickDocument(docType.type)}
                      disabled={isLocked || isThisUploading}
                    >
                      {isThisUploading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color={isLocked ? colors.textSecondary : colors.primary} />
                          <Text style={[styles.uploadButtonText, isLocked && { color: colors.textSecondary }]}>
                            Upload Document
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      {!isLocked && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              </>
            )}
          </TouchableOpacity>
          {!canSubmit && (
            <Text style={styles.submitHint}>
              {status?.missingDocuments && status.missingDocuments.length > 0
                ? `Missing: ${status.missingDocuments.join(', ')}`
                : (status?.profileCompletion ?? 0) < 70
                  ? 'Profile completion must be at least 70%'
                  : 'Upload all required documents to submit'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 14 },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: { padding: 16 },

  progressCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  progressPercentage: { fontSize: 16, fontWeight: '700', color: colors.primary },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: colors.border },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  progressSubtext: { marginTop: 8, fontSize: 12, color: colors.textSecondary },

  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12, gap: 8 },
  errorBannerText: { color: '#EF4444', fontSize: 13, flex: 1 },

  lockedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', borderRadius: 8, padding: 12, marginBottom: 12, gap: 8 },
  lockedBannerText: { color: colors.info, fontSize: 13, flex: 1 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },

  documentCard: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  docLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  requiredBadge: { fontSize: 10, fontWeight: '600', color: '#EF4444', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  docDescription: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },

  notesBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: 6, padding: 8, marginBottom: 10, gap: 6 },
  notesText: { fontSize: 12, color: '#92400E', flex: 1 },

  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docThumbnail: { width: 48, height: 48, borderRadius: 6, backgroundColor: colors.border },
  uploadedInfo: { flex: 1 },
  uploadedLabel: { fontSize: 12, fontWeight: '600', color: colors.success },
  uploadedDate: { fontSize: 11, color: colors.textSecondary },
  docActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6, borderRadius: 6, backgroundColor: colors.background },

  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', gap: 8 },
  uploadButtonDisabled: { borderColor: colors.border },
  uploadButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, gap: 8 },
  submitButtonDisabled: { backgroundColor: colors.border },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  submitHint: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
});

export default TeacherKycScreen;
