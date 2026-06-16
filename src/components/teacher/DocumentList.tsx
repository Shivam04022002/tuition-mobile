import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import {
  TeacherDocument,
  DocumentCategory,
  DOCUMENT_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatFileSize,
} from '../../services/documentApi';

interface DocumentListProps {
  documents: TeacherDocument[];
  category?: DocumentCategory;
  title?: string;
  onDocumentPress?: (document: TeacherDocument) => void;
  onDocumentDelete?: (documentId: string) => void;
  showHeader?: boolean;
  emptyText?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  category,
  title,
  onDocumentPress,
  onDocumentDelete,
  showHeader = true,
  emptyText = 'No documents uploaded yet',
}) => {
  const filteredDocuments = category
    ? documents.filter(d => d.category === category)
    : documents;

  const getCategoryIcon = (cat: DocumentCategory) => {
    switch (cat) {
      case 'identity':
        return 'card-outline';
      case 'qualification':
        return 'school-outline';
      case 'profile':
        return 'person-outline';
      default:
        return 'document-outline';
    }
  };

  const getCategoryLabel = (cat: DocumentCategory) => {
    switch (cat) {
      case 'identity':
        return 'Identity Documents';
      case 'qualification':
        return 'Qualifications & Certificates';
      case 'profile':
        return 'Profile Photos';
      default:
        return 'Documents';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'document-text-outline';
      case 'png':
        return 'image-outline';
      default:
        return 'image-outline';
    }
  };

  const renderDocumentItem = ({ item }: { item: TeacherDocument }) => {
    const statusColor = STATUS_COLORS[item.status];

    return (
      <TouchableOpacity
        style={styles.documentItem}
        onPress={() => onDocumentPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.fileIconContainer, { backgroundColor: statusColor + '10' }]}>
          <Ionicons name={getFileIcon(item.fileType) as any} size={24} color={statusColor} />
        </View>

        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.documentType}>
            {DOCUMENT_TYPE_LABELS[item.type]}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
            <Text style={styles.fileSize}>{formatFileSize(item.fileSize)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDocumentPress?.(item)}
          >
            <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {onDocumentDelete && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onDocumentDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="documents-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Ionicons
            name={(category ? getCategoryIcon(category) : 'folder-outline') as any}
            size={20}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>
            {title || (category ? getCategoryLabel(category) : 'All Documents')}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredDocuments.length}</Text>
          </View>
        </View>
      )}

      {filteredDocuments.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.listContainer}>
          {filteredDocuments.map((item, index) => (
            <View key={item._id}>
              {renderDocumentItem({ item })}
              {index < filteredDocuments.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  listContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    ...shadows.xs,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: 12,
    ...shadows.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default DocumentList;
