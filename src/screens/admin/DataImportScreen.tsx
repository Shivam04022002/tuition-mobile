import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSelector } from 'react-redux';
import {
  ImportHistoryRecord,
  ImportResult,
  getImportHistory,
  importParents,
  importTeachers,
} from '../../services/adminApi';

type ImportType = 'parents' | 'teachers';

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ImportHistoryRecord['status'] }> = ({ status }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    completed: { bg: '#d4edda', text: '#155724' },
    partial: { bg: '#fff3cd', text: '#856404' },
    failed: { bg: '#f8d7da', text: '#721c24' },
    processing: { bg: '#cce5ff', text: '#004085' },
  };
  const c = colors[status] ?? colors.processing;
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusText, { color: c.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

const ImportSummaryCard: React.FC<{ result: ImportResult; type: ImportType }> = ({ result, type }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryTitle}>
      {type === 'parents' ? '👨‍👩‍👧 Parents' : '🎓 Teachers'} Import Summary
    </Text>
    <Text style={styles.summaryFile} numberOfLines={1}>📄 {result.fileName}</Text>
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCell, { backgroundColor: '#e8f4fd' }]}>
        <Text style={styles.summaryCellNum}>{result.totalRows}</Text>
        <Text style={styles.summaryCellLabel}>Total Rows</Text>
      </View>
      <View style={[styles.summaryCell, { backgroundColor: '#d4edda' }]}>
        <Text style={[styles.summaryCellNum, { color: '#155724' }]}>{result.successfulRows}</Text>
        <Text style={styles.summaryCellLabel}>Imported</Text>
      </View>
      <View style={[styles.summaryCell, { backgroundColor: '#fff3cd' }]}>
        <Text style={[styles.summaryCellNum, { color: '#856404' }]}>{result.duplicates}</Text>
        <Text style={styles.summaryCellLabel}>Duplicates</Text>
      </View>
      <View style={[styles.summaryCell, { backgroundColor: '#f8d7da' }]}>
        <Text style={[styles.summaryCellNum, { color: '#721c24' }]}>{result.failedRows}</Text>
        <Text style={styles.summaryCellLabel}>Failed</Text>
      </View>
    </View>
    <StatusBadge status={result.status} />
    {result.errors.length > 0 && (
      <View style={styles.errorsList}>
        <Text style={styles.errorsTitle}>Row Errors (first {result.errors.length}):</Text>
        {result.errors.slice(0, 10).map((e, i) => (
          <Text key={i} style={styles.errorLine}>
            Row {e.rowNumber}: {e.errorMessage}
          </Text>
        ))}
      </View>
    )}
  </View>
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

const DataImportScreen: React.FC = () => {
  const token: string = useSelector((state: any) => state.auth?.token ?? '');

  const [importing, setImporting] = useState<ImportType | null>(null);
  const [lastResult, setLastResult] = useState<{ result: ImportResult; type: ImportType } | null>(null);

  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setHistoryRefreshing(true);
    else setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getImportHistory(token, { limit: 20 });
      if (res.success) setHistory(res.data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const pickAndImport = async (type: ImportType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '*/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileUri = asset.uri;
      const fileName = asset.name ?? `import_${type}_${Date.now()}.xlsx`;

      if (!fileName.match(/\.(xlsx|xls)$/i)) {
        Alert.alert('Invalid file', 'Please select an .xlsx or .xls file');
        return;
      }

      setImporting(type);
      setLastResult(null);

      const fn = type === 'parents' ? importParents : importTeachers;
      const res = await fn(token, fileUri, fileName);

      setLastResult({ result: res.data, type });
      fetchHistory(true);
    } catch (err) {
      Alert.alert('Import Error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setImporting(null);
    }
  };

  const renderHistoryItem = ({ item }: { item: ImportHistoryRecord }) => {
    const uploaderName = typeof item.uploadedBy === 'object'
      ? `${item.uploadedBy.profile?.firstName ?? ''} ${item.uploadedBy.profile?.lastName ?? ''}`.trim()
      : 'Admin';

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.historyIcon}>
            <Text style={styles.historyIconText}>
              {item.importType === 'parents' ? '👨‍👩‍👧' : '🎓'}
            </Text>
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyFileName} numberOfLines={1}>{item.fileName}</Text>
            <Text style={styles.historyMeta}>
              {item.importType} · {new Date(item.createdAt).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.historyMeta}>By: {uploaderName}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.historyStats}>
          <Text style={styles.historyStatItem}>📥 {item.totalRows} rows</Text>
          <Text style={[styles.historyStatItem, { color: '#155724' }]}>✓ {item.successfulRows}</Text>
          <Text style={[styles.historyStatItem, { color: '#856404' }]}>⊘ {item.duplicates}</Text>
          <Text style={[styles.historyStatItem, { color: '#721c24' }]}>✗ {item.failedRows}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={historyRefreshing} onRefresh={() => fetchHistory(true)} tintColor="#007AFF" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Import</Text>
        <Text style={styles.headerSub}>Bulk import parents & teachers from Excel</Text>
      </View>

      {/* Import Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Excel File</Text>

        <TouchableOpacity
          style={[styles.uploadBtn, importing === 'parents' && styles.uploadBtnDisabled]}
          onPress={() => pickAndImport('parents')}
          disabled={importing !== null}
        >
          {importing === 'parents' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.uploadBtnIcon}>👨‍👩‍👧</Text>
          )}
          <View style={styles.uploadBtnText}>
            <Text style={styles.uploadBtnTitle}>Import Parents</Text>
            <Text style={styles.uploadBtnSub}>
              Required: Name, Email, Mobile{'\n'}Optional: Address, City, Pincode, Class, Subjects
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadBtn, styles.uploadBtnTeacher, importing === 'teachers' && styles.uploadBtnDisabled]}
          onPress={() => pickAndImport('teachers')}
          disabled={importing !== null}
        >
          {importing === 'teachers' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.uploadBtnIcon}>🎓</Text>
          )}
          <View style={styles.uploadBtnText}>
            <Text style={styles.uploadBtnTitle}>Import Teachers</Text>
            <Text style={styles.uploadBtnSub}>
              Required: Name, Email, Mobile{'\n'}Optional: Qualification, Experience, Subjects, Classes, Pricing
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Template Info */}
      <View style={styles.templateSection}>
        <Text style={styles.templateTitle}>📋 Excel Column Guide</Text>
        <View style={styles.templateRow}>
          <Text style={styles.templateHeader}>Parents Template</Text>
          <Text style={styles.templateCols}>Name | Email | Mobile | Address | City | Pincode | Class | Subjects | GenderPreference</Text>
        </View>
        <View style={[styles.templateRow, { marginTop: 8 }]}>
          <Text style={styles.templateHeader}>Teachers Template</Text>
          <Text style={styles.templateCols}>Name | Email | Mobile | Address | City | Pincode | Qualification | Experience | Subjects | Classes | Pricing</Text>
        </View>
        <Text style={styles.templateNote}>
          ⚠️ Row 1 must be the header row. Duplicates (same email or mobile) are skipped automatically.
        </Text>
      </View>

      {/* Last Import Summary */}
      {lastResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Import Result</Text>
          <ImportSummaryCard result={lastResult.result} type={lastResult.type} />
        </View>
      )}

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Import History</Text>

        {historyLoading ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : historyError ? (
          <Text style={styles.errorText}>{historyError}</Text>
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No import history yet</Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => item._id}
            renderItem={renderHistoryItem}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#5856D6',
    padding: 20,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  section: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5856D6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  uploadBtnTeacher: { backgroundColor: '#34C759' },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnIcon: { fontSize: 28 },
  uploadBtnText: { flex: 1 },
  uploadBtnTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  uploadBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, lineHeight: 18 },

  templateSection: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  templateTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  templateRow: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  templateHeader: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 4 },
  templateCols: { fontSize: 11, color: '#777', lineHeight: 18 },
  templateNote: {
    marginTop: 10,
    fontSize: 12,
    color: '#FF9500',
    lineHeight: 18,
  },

  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 6 },
  summaryFile: { fontSize: 12, color: '#666', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  summaryCell: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  summaryCellNum: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  summaryCellLabel: { fontSize: 10, color: '#666', marginTop: 2 },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  errorsList: { marginTop: 12 },
  errorsTitle: { fontSize: 13, fontWeight: '700', color: '#721c24', marginBottom: 6 },
  errorLine: { fontSize: 12, color: '#333', marginBottom: 3 },

  historyCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyIconText: { fontSize: 20 },
  historyInfo: { flex: 1 },
  historyFileName: { fontSize: 14, fontWeight: '600', color: '#111' },
  historyMeta: { fontSize: 11, color: '#777', marginTop: 2 },
  historyStats: { flexDirection: 'row', gap: 12 },
  historyStatItem: { fontSize: 12, color: '#555', fontWeight: '500' },

  errorText: { fontSize: 14, color: '#FF3B30', textAlign: 'center', paddingVertical: 16 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },
});

export default DataImportScreen;
