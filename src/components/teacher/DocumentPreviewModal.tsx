import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  TeacherDocument,
  DOCUMENT_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatFileSize,
} from '../../services/documentApi';

interface DocumentPreviewModalProps {
  visible: boolean;
  document: TeacherDocument | null;
  onClose: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onReplace?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  visible,
  document,
  onClose,
  onDownload,
  onDelete,
  onReplace,
}) => {
  if (!document) return null;

  const statusColor = STATUS_COLORS[document.status];

  const getFileIcon = () => {
    switch (document.fileType) {
      case 'pdf':
        return 'document-text';
      case 'png':
      case 'jpg':
        return 'image';
      default:
        return 'document';
    }
  };

  const isImage = document.fileType === 'jpg' || document.fileType === 'png';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {document.name}
                </Text>
                <View style={styles.placeholder} />
              </View>

              {/* Preview Area */}
              <View style={styles.previewContainer}>
                {isImage ? (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={64} color={colors.textTertiary} />
                    <Text style={styles.previewHint}>
                      Image Preview (Web View)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pdfPlaceholder}>
                    <Ionicons name="document-text" size={80} color={colors.primary} />
                    <Text style={styles.pdfLabel}>PDF Document</Text>
                    <TouchableOpacity style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>Open in Viewer</Text>
                      <Ionicons name="open-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Document Info */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>
                    {DOCUMENT_TYPE_LABELS[document.type]}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons
                      name={document.status === 'verified' ? 'checkmark' : document.status === 'rejected' ? 'close' : 'time'}
                      size={12}
                      color={statusColor}
                    />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {STATUS_LABELS[document.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>File Size</Text>
                  <Text style={styles.infoValue}>{formatFileSize(document.fileSize)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Uploaded</Text>
                  <Text style={styles.infoValue}>
                    {new Date(document.uploadedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {document.verifiedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Verified</Text>
                    <Text style={styles.infoValue}>
                      {new Date(document.verifiedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {document.rejectionReason && (
                  <View style={styles.rejectionSection}>
                    <Text style={styles.rejectionLabel}>Rejection Reason</Text>
                    <Text style={styles.rejectionText}>{document.rejectionReason}</Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actionsSection}>
                {onDownload && (
                  <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Download</Text>
                  </TouchableOpacity>
                )}

                {onReplace && (
                  <TouchableOpacity style={styles.actionButton} onPress={onReplace}>
                    <Ionicons name="refresh-outline" size={20} color={colors.info} />
                    <Text style={[styles.actionButtonText, { color: colors.info }]}>Replace</Text>
                  </TouchableOpacity>
                )}

                {onDelete && (
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 32,
  },
  previewContainer: {
    height: 200,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  previewHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  pdfPlaceholder: {
    alignItems: 'center',
  },
  pdfLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  infoSection: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: colors.error,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
  },
});

export default DocumentPreviewModal;
