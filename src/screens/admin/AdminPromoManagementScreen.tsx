import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import * as promoApi from '../../services/promoApi';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';

const AdminPromoManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const token = useAppSelector(selectAuthToken);

  const [promos, setPromos] = useState<promoApi.PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<promoApi.CreatePromoInput>>({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 20,
    applicableTo: 'subscription',
    minOrderAmount: 0,
    usageLimit: 100,
    perUserLimit: 1,
  });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await promoApi.listPromoCodes(token);
      if (response.success && response.data) {
        setPromos(response.data.promos);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token || !formData.code || !formData.description) return;

    try {
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + 30);

      await promoApi.createPromoCode(token, {
        ...formData as promoApi.CreatePromoInput,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
      });

      setShowCreateModal(false);
      loadPromos();
      Alert.alert('Success', 'Promo code created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!token) return;
    Alert.alert(
      'Deactivate Promo',
      'Are you sure you want to deactivate this promo code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await promoApi.deactivatePromoCode(token, id);
              loadPromos();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Promo Codes</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderPromoItem = (promo: promoApi.PromoCode) => (
    <View key={promo._id} style={styles.promoCard}>
      <View style={styles.promoHeader}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{promo.code}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: promo.isActive ? colors.successLight : colors.errorLight }]}>
          <Text style={[styles.statusText, { color: promo.isActive ? colors.success : colors.error }]}>
            {promo.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{promo.description}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Discount</Text>
          <Text style={styles.statValue}>
            {promo.discountType === 'percent' ? `${promo.discountValue}%` : `₹${promo.discountValue}`}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Usage</Text>
          <Text style={styles.statValue}>{promo.usageCount} / {promo.usageLimit}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Type</Text>
          <Text style={styles.statValue}>{promo.applicableTo}</Text>
        </View>
      </View>

      {promo.isActive && (
        <TouchableOpacity
          style={styles.deactivateButton}
          onPress={() => handleDeactivate(promo._id)}
        >
          <Text style={styles.deactivateText}>Deactivate</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadPromos} />}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading && promos.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <View style={styles.promosList}>
            {promos.map(renderPromoItem)}
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Promo Code</Text>

            <TextInput
              style={styles.input}
              placeholder="Code (e.g., SUMMER20)"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.typeButton, formData.discountType === 'percent' && styles.typeButtonActive]}
                onPress={() => setFormData({ ...formData, discountType: 'percent' })}
              >
                <Text style={styles.typeButtonText}>Percent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.discountType === 'flat' && styles.typeButtonActive]}
                onPress={() => setFormData({ ...formData, discountType: 'flat' })}
              >
                <Text style={styles.typeButtonText}>Flat Amount</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder={formData.discountType === 'percent' ? 'Discount % (e.g., 20)' : 'Discount Amount (e.g., 100)'}
              value={String(formData.discountValue)}
              onChangeText={(text) => setFormData({ ...formData, discountValue: Number(text) })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreate}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  addButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  errorBanner: { backgroundColor: colors.errorLight, padding: 12, margin: 16, borderRadius: 8 },
  errorText: { color: colors.error, fontSize: 14 },
  loader: { marginTop: 32 },
  promosList: { padding: 16, gap: 16 },
  promoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  codeText: { color: colors.card, fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  description: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  deactivateButton: {
    backgroundColor: colors.errorLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deactivateText: { color: colors.error, fontSize: 14, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 14, color: colors.text },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.background },
  cancelButtonText: { color: colors.text, fontSize: 16, fontWeight: '500' },
  createButton: { backgroundColor: colors.primary },
  createButtonText: { color: colors.card, fontSize: 16, fontWeight: '600' },
});

export default AdminPromoManagementScreen;
