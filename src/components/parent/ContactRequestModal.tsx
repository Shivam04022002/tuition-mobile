import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { PrimaryButton } from '../ui';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContactRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (message: string, requirementId?: string) => Promise<void>;
  contactType: 'call' | 'whatsapp' | 'message';
  tutorName: string;
  requirements?: Array<{
    _id: string;
    requirementId?: string;
    studentDetails?: {
      studentName?: string;
      grade?: string;
    };
    subjects?: string[];
  }>;
  isSubmitting?: boolean;
  error?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  visible,
  onClose,
  onSubmit,
  contactType,
  tutorName,
  requirements = [],
  isSubmitting = false,
  error = null,
}) => {
  const [message, setMessage] = useState('');
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | undefined>();

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setMessage('');
      setSelectedRequirementId(undefined);
      onClose();
    }
  }, [onClose, isSubmitting]);

  const handleSubmit = useCallback(async () => {
    await onSubmit(message.trim(), selectedRequirementId);
    setMessage('');
    setSelectedRequirementId(undefined);
  }, [onSubmit, message, selectedRequirementId]);

  const getTitle = () => {
    switch (contactType) {
      case 'call': return 'Request Phone Call';
      case 'whatsapp': return 'Request WhatsApp Chat';
      case 'message': return 'Send Message';
      default: return 'Contact Request';
    }
  };

  const getIcon = () => {
    switch (contactType) {
      case 'call': return 'call-outline';
      case 'whatsapp': return 'logo-whatsapp';
      case 'message': return 'chatbubble-outline';
      default: return 'mail-outline';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop} onTouchEnd={handleClose} />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getIcon() as any} 
                size={28} 
                color={colors.primary} 
              />
            </View>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>
              Send a contact request to {tutorName}
            </Text>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Requirements Selection */}
            {requirements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Related Requirement (Optional)</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.requirementScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.requirementChip,
                      !selectedRequirementId && styles.requirementChipSelected,
                    ]}
                    onPress={() => setSelectedRequirementId(undefined)}
                  >
                    <Text style={[
                      styles.requirementChipText,
                      !selectedRequirementId && styles.requirementChipTextSelected,
                    ]}>
                      General Inquiry
                    </Text>
                  </TouchableOpacity>
                  {requirements.map((req) => (
                    <TouchableOpacity
                      key={req._id}
                      style={[
                        styles.requirementChip,
                        selectedRequirementId === req._id && styles.requirementChipSelected,
                      ]}
                      onPress={() => setSelectedRequirementId(req._id)}
                    >
                      <Text style={[
                        styles.requirementChipText,
                        selectedRequirementId === req._id && styles.requirementChipTextSelected,
                      ]}>
                        {req.studentDetails?.studentName || 'Student'} - {req.studentDetails?.grade || 'N/A'}
                        {req.subjects?.length ? ` (${req.subjects[0]}${req.subjects.length > 1 ? '...' : ''})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Message Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder={`Introduce yourself and mention your tuition requirements...`}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{message.length}/1000</Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
              <Text style={styles.infoText}>
                The tutor will receive your request and can choose to accept or decline. 
                You will be notified of their response.
              </Text>
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Sending request...</Text>
                </View>
              ) : (
                <PrimaryButton
                  label="Send Request"
                  onPress={handleSubmit}
                  variant="primary"
                  disabled={isSubmitting}
                />
              )}
            </View>

            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...shadows.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  requirementScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  requirementChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  requirementChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  requirementChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  requirementChipTextSelected: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: colors.info + '10',
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  submitSection: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomSpace: {
    height: 32,
  },
});

export default React.memo(ContactRequestModal);
