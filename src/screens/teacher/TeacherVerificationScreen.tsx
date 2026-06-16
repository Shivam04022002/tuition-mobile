import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTeacherDocuments } from '../../hooks/useTeacherDocuments';
import VerificationTimeline from '../../components/teacher/VerificationTimeline';
import { STATUS_COLORS, STATUS_LABELS, DocumentStatus } from '../../services/documentApi';

type TeacherStackParamList = {
  TeacherDocuments: undefined;
  TeacherVerification: undefined;
};

const TeacherVerificationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const insets = useSafeAreaInsets();

  const {
    verificationStatus,
    documents,
    summary,
    isLoading,
    isRefreshing,
    isSubmitting,
    submitError,
    refresh,
    submitVerification,
    clearErrors,
  } = useTeacherDocuments();

  const handleSubmitVerification = useCallback(async () => {
    if (!verificationStatus?.canSubmit) {
      Alert.alert(
        'Cannot Submit',
        'Please ensure you have uploaded all required documents before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Submit for Verification',
      'Your documents will be reviewed by our team within 24-48 hours. You cannot modify documents during review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            clearErrors();
            const success = await submitVerification();
            if (success) {
              Alert.alert(
                'Submitted Successfully',
                'Your profile has been submitted for verification. You will receive a notification once reviewed.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [verificationStatus?.canSubmit, submitVerification, clearErrors]);

  const getStatusConfig = (status: DocumentStatus) => {
    switch (status) {
      case 'draft':
        return {
          icon: 'document-outline',
          color: colors.textSecondary,
          bgColor: colors.backgroundSecondary,
          title: 'Draft',
          description: 'Complete your profile and upload documents to submit for verification.',
        };
      case 'pending':
        return {
          icon: 'time',
          color: colors.warning,
          bgColor: colors.warning + '15',
          title: 'Under Review',
          description: 'Your documents are being reviewed. This usually takes 24-48 hours.',
        };
      case 'verified':
        return {
          icon: 'shield-checkmark',
          color: colors.success,
          bgColor: colors.success + '15',
          title: 'Verified',
          description: 'Congratulations! Your profile has been verified. You can now apply to leads.',
        };
      case 'rejected':
        return {
          icon: 'alert-circle',
          color: colors.error,
          bgColor: colors.error + '15',
          title: 'Rejected',
          description: verificationStatus?.rejectionReason || 'Your verification was rejected. Please review the feedback and re-upload documents.',
        };
      default:
        return {
          icon: 'help-circle',
          color: colors.textSecondary,
          bgColor: colors.backgroundSecondary,
          title: 'Unknown',
          description: 'Status unavailable',
        };
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Verification Status</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderStatusCard = () => {
    const status = (verificationStatus?.status || 'draft') as DocumentStatus;
    const config = getStatusConfig(status);

    return (
      <View style={[styles.statusCard, shadows.sm, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
        <View style={[styles.statusIconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon as any} size={32} color={config.color} />
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.statusDescription}>{config.description}</Text>
        </View>
      </View>
    );
  };

  const renderRequirementsChecklist = () => {
    if (!verificationStatus?.requirements) return null;

    const { requirements } = verificationStatus;

    const requirementItems = [
      { key: 'identityDocument', label: 'Identity Document', check: requirements.identityDocument },
      { key: 'qualificationDocument', label: 'Qualification Document', check: requirements.qualificationDocument },
      { key: 'profilePhoto', label: 'Profile Photo', check: requirements.profilePhoto },
    ];

    const allMet = requirementItems.every(item => item.check.met);

    return (
      <View style={[styles.requirementsCard, shadows.xs]}>
        <Text style={styles.requirementsTitle}>Requirements Checklist</Text>

        {requirementItems.map(item => (
          <View key={item.key} style={styles.requirementItem}>
            <Ionicons
              name={item.check.met ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={item.check.met ? colors.success : colors.textTertiary}
            />
            <Text
              style={[
                styles.requirementLabel,
                { color: item.check.met ? colors.text : colors.textSecondary },
              ]}
            >
              {item.label}
            </Text>
            {item.check.met && (
              <Text style={styles.requirementCount}>
                {item.check.documents.length} uploaded
              </Text>
            )}
          </View>
        ))}

        {!allMet && verificationStatus.requiredActions.length > 0 && (
          <View style={styles.actionsNeeded}>
            <Ionicons name="information-circle" size={16} color={colors.warning} />
            <Text style={styles.actionsText}>Complete all requirements to submit</Text>
          </View>
        )}

        {allMet && verificationStatus.canSubmit && (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitVerification}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {submitError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderDocumentStats = () => {
    if (!verificationStatus?.documents) return null;

    const { documents: stats } = verificationStatus;

    return (
      <View style={[styles.statsCard, shadows.xs]}>
        <Text style={styles.statsTitle}>Document Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabelSmall}>Total</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.success + '10' }]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{stats.verified}</Text>
            <Text style={styles.statLabelSmall}>Verified</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.warning + '10' }]}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.pending}</Text>
            <Text style={styles.statLabelSmall}>Pending</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.error + '10' }]}>
            <Text style={[styles.statNumber, { color: colors.error }]}>{stats.rejected}</Text>
            <Text style={styles.statLabelSmall}>Rejected</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigation.navigate('TeacherDocuments')}
        >
          <Text style={styles.manageButtonText}>Manage Documents</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTimeline = () => {
    if (!verificationStatus?.timeline?.length) return null;

    return (
      <VerificationTimeline
        events={verificationStatus.timeline}
        currentStatus={verificationStatus.status}
      />
    );
  };

  if (isLoading && !verificationStatus) {
    return (
      <View style={[styles.container, styles.centered]}>
        {renderHeader()}
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading verification status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderStatusCard()}
        {renderRequirementsChecklist()}
        {renderDocumentStats()}
        {renderTimeline()}
      </ScrollView>
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
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requirementLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
  requirementCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  actionsNeeded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  actionsText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 70,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  statLabelSmall: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default TeacherVerificationScreen;
