import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { DocumentType, DOCUMENT_TYPE_LABELS, DocumentStatus, STATUS_COLORS, STATUS_LABELS } from '../../services/documentApi';

interface DocumentUploadCardProps {
  type: DocumentType;
  title?: string;
  description?: string;
  existingDocument?: {
    _id: string;
    name: string;
    status: DocumentStatus;
    uploadedAt: string;
    rejectionReason?: string;
  } | null;
  onUpload: (type: DocumentType, name: string, fileUri: string, fileName: string, mimeType: string) => Promise<void>;
  onReplace?: (documentId: string, fileUri: string, fileName: string, mimeType: string) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  isUploading?: boolean;
  disabled?: boolean;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  type,
  title,
  description,
  existingDocument,
  onUpload,
  onReplace,
  onDelete,
  isUploading = false,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const displayTitle = title || DOCUMENT_TYPE_LABELS[type];
  const isUploaded = !!existingDocument;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleUploadPress = useCallback(() => {
    if (disabled || isUploading) return;

    Alert.alert(
      'Upload Document',
      `Select a file for ${displayTitle}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            // In a real app, this would open the image picker
            // For now, we'll simulate the selection
            simulateFileSelection();
          },
        },
        {
          text: 'Take Photo',
          onPress: () => {
            // In a real app, this would open the camera
            simulateFileSelection();
          },
        },
      ]
    );
  }, [disabled, isUploading, displayTitle]);

  const simulateFileSelection = () => {
    // Simulate file selection for demo purposes
    // In a real app, this would come from image picker
    const mockFileUri = 'file:///mock/document.jpg';
    const mockFileName = `${type}_document.jpg`;
    const mockMimeType = 'image/jpeg';

    onUpload(type, displayTitle, mockFileUri, mockFileName, mockMimeType);
  };

  const handleReplacePress = useCallback(() => {
    if (!existingDocument || !onReplace) return;

    Alert.alert(
      'Replace Document',
      'Are you sure you want to replace this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            const mockFileUri = 'file:///mock/document.jpg';
            const mockFileName = `${type}_document.jpg`;
            const mockMimeType = 'image/jpeg';
            onReplace(existingDocument._id, mockFileUri, mockFileName, mockMimeType);
          },
        },
      ]
    );
  }, [existingDocument, onReplace, type]);

  const handleDeletePress = useCallback(() => {
    if (!existingDocument || !onDelete) return;

    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(existingDocument._id),
        },
      ]
    );
  }, [existingDocument, onDelete]);

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'document-outline';
    }
  };

  const renderUploadState = () => (
    <TouchableOpacity
      onPress={handleUploadPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isUploading}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.container,
          styles.uploadContainer,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.iconContainer}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{displayTitle}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          <Text style={styles.hint}>
            Tap to upload (JPG, PNG, PDF up to 5MB)
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Animated.View>
    </TouchableOpacity>
  );

  const renderUploadedState = () => {
    if (!existingDocument) return null;

    const statusColor = STATUS_COLORS[existingDocument.status];

    return (
      <View style={[styles.container, styles.uploadedContainer]}>
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

        <View style={styles.contentRow}>
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '15' }]}>
            <Ionicons
              name={getStatusIcon(existingDocument.status) as any}
              size={24}
              color={statusColor}
            />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>{existingDocument.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {STATUS_LABELS[existingDocument.status]}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(existingDocument.uploadedAt).toLocaleDateString()}
              </Text>
            </View>

            {existingDocument.status === 'rejected' && existingDocument.rejectionReason && (
              <View style={styles.rejectionBox}>
                <Ionicons name="warning-outline" size={14} color={colors.error} />
                <Text style={styles.rejectionText}>{existingDocument.rejectionReason}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onReplace && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReplacePress}
              disabled={isUploading}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.actionText}>Replace</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeletePress}
              disabled={isUploading}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          )}

          {existingDocument.status === 'rejected' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reuploadButton]}
              onPress={handleReplacePress}
              disabled={isUploading}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Re-upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return isUploaded ? renderUploadedState() : renderUploadState();
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    ...shadows.xs,
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  uploadedContainer: {
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  reuploadButton: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});

export default DocumentUploadCard;
