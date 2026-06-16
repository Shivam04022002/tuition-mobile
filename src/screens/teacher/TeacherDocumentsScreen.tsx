import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTeacherDocuments } from '../../hooks/useTeacherDocuments';
import DocumentUploadCard from '../../components/teacher/DocumentUploadCard';
import DocumentList from '../../components/teacher/DocumentList';
import DocumentPreviewModal from '../../components/teacher/DocumentPreviewModal';
import { TeacherDocument, DocumentType } from '../../services/documentApi';

type TeacherStackParamList = {
  TeacherDocuments: undefined;
  TeacherVerification: undefined;
  TeacherOnboarding: undefined;
};

const REQUIRED_DOCUMENTS: Array<{
  type: DocumentType;
  title: string;
  description: string;
  category: 'identity' | 'qualification' | 'profile';
}> = [
  {
    type: 'aadhaar',
    title: 'Aadhaar Card',
    description: 'Government issued ID proof',
    category: 'identity',
  },
  {
    type: 'pan',
    title: 'PAN Card',
    description: 'Tax identification document',
    category: 'identity',
  },
  {
    type: 'degree_certificate',
    title: 'Degree Certificate',
    description: 'Highest qualification proof',
    category: 'qualification',
  },
  {
    type: 'teaching_certificate',
    title: 'Teaching Certificate',
    description: 'B.Ed or teaching diploma',
    category: 'qualification',
  },
  {
    type: 'experience_certificate',
    title: 'Experience Certificate',
    description: 'Previous employment proof (optional)',
    category: 'qualification',
  },
];

const TeacherDocumentsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const insets = useSafeAreaInsets();

  const {
    documents,
    summary,
    isLoading,
    isUploading,
    error,
    refresh,
    uploadNewDocument,
    updateExistingDocument,
    deleteExistingDocument,
  } = useTeacherDocuments();

  const [selectedDocument, setSelectedDocument] = useState<TeacherDocument | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleUpload = useCallback(async (
    type: DocumentType,
    name: string,
    fileUri: string,
    fileName: string,
    mimeType: string
  ) => {
    await uploadNewDocument(type, name, fileUri, fileName, mimeType);
  }, [uploadNewDocument]);

  const handleReplace = useCallback(async (
    documentId: string,
    fileUri: string,
    fileName: string,
    mimeType: string
  ) => {
    await updateExistingDocument(documentId, { fileUri, fileName, mimeType });
  }, [updateExistingDocument]);

  const handleDelete = useCallback(async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExistingDocument(documentId);
          },
        },
      ]
    );
  }, [deleteExistingDocument]);

  const handleDocumentPress = useCallback((document: TeacherDocument) => {
    setSelectedDocument(document);
    setPreviewVisible(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
    setSelectedDocument(null);
  }, []);

  const getExistingDocument = (type: DocumentType) => {
    return documents.find(d => d.type === type) || null;
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Documents</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderProgressCard = () => {
    if (!summary) return null;

    const progress = summary.completionPercentage;
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={[styles.progressCard, shadows.sm]}>
        <View style={styles.progressCircle}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={colors.border}
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={colors.primary}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressPercentage}>{progress}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statValue}>{summary.verified}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color={colors.warning} />
            <Text style={styles.statValue}>{summary.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cloud-upload" size={20} color={colors.info} />
            <Text style={styles.statValue}>{summary.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUploadSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upload Documents</Text>
      <Text style={styles.sectionSubtitle}>
        Upload required documents to complete your profile
      </Text>

      {REQUIRED_DOCUMENTS.map(doc => (
        <DocumentUploadCard
          key={doc.type}
          type={doc.type}
          title={doc.title}
          description={doc.description}
          existingDocument={getExistingDocument(doc.type)}
          onUpload={handleUpload}
          onReplace={handleReplace}
          onDelete={handleDelete}
          isUploading={isUploading}
        />
      ))}
    </View>
  );

  const renderDocumentList = () => (
    <View style={styles.section}>
      <DocumentList
        documents={documents}
        title="Your Documents"
        onDocumentPress={handleDocumentPress}
        onDocumentDelete={handleDelete}
      />
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('TeacherVerification')}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.info + '15' }]}>
          <Ionicons name="shield-checkmark" size={24} color={colors.info} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Verification Status</Text>
          <Text style={styles.actionSubtitle}>Check your verification progress</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !documents.length) {
    return (
      <View style={[styles.container, styles.centered]}>
        {renderHeader()}
        <Ionicons name="documents-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        {renderHeader()}
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderProgressCard()}
        {renderUploadSection()}
        {documents.length > 0 && renderDocumentList()}
        {renderActions()}
      </ScrollView>

      <DocumentPreviewModal
        visible={previewVisible}
        document={selectedDocument}
        onClose={closePreview}
        onDelete={selectedDocument ? () => handleDelete(selectedDocument._id) : undefined}
        onReplace={selectedDocument ? () => {
          closePreview();
          if (selectedDocument) {
            handleReplace(selectedDocument._id, 'file:///mock/document.jpg', 'document.jpg', 'image/jpeg');
          }
        } : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  actionsSection: {
    paddingHorizontal: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    ...shadows.xs,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TeacherDocumentsScreen;
