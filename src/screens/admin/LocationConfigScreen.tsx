import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import * as locationApi from '../../services/adminLocationApi';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';

const LocationConfigScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);
  const token = useAppSelector(selectAuthToken);

  const [config, setConfig] = useState<locationApi.LocationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [pendingClear, setPendingClear] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await locationApi.getLocationConfig(token);
      if (res.success) {
        setConfig(res.data);
        setIsActive(res.data.isActive);
        setHasSavedKey(res.data.hasApiKey);
        setApiKey('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load location configuration');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openModal = () => {
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setShowKey(false);
    setPendingClear(false);
    if (config) {
      setIsActive(config.isActive);
      setApiKey('');
    }
  };

  const handleClearKeys = () => {
    Alert.alert(
      'Clear Category Credentials?',
      'Are you sure you want to clear credentials for Location Services? This will clear all input fields in this category. You must click Save Changes to apply.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear Keys',
          style: 'destructive',
          onPress: () => {
            setIsActive(false);
            setApiKey('');
            setHasSavedKey(false);
            setPendingClear(true);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!token) return;

    const isClearing = pendingClear && !apiKey;

    if (!isClearing && isActive && !apiKey && !hasSavedKey) {
      Alert.alert('API key required', 'Enter a Google Maps API key before activating location services.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await locationApi.updateLocationConfig(token, {
        isActive,
        apiKey: apiKey || undefined,
        ...(isClearing ? { clear: true } : {}),
      });
      if (res.success) {
        setConfig(res.data);
        setIsActive(res.data.isActive);
        setHasSavedKey(res.data.hasApiKey);
        setApiKey('');
        setIsEditing(false);
        setPendingClear(false);
        Alert.alert('Saved', isClearing ? 'Location configuration cleared' : 'Location configuration saved successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save location configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!token) return;
    if (!apiKey && !hasSavedKey) {
      Alert.alert('API key required', 'Enter an API key to test.');
      return;
    }
    setIsTesting(true);
    try {
      const res = await locationApi.testLocationConfig(token, apiKey || undefined);
      Alert.alert(res.success ? 'Success' : 'Failed', res.message);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to test location configuration');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Services</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoading && !config ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="location-outline" size={22} color={colors.primary} />
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: config?.isActive ? colors.successLight : colors.errorLight },
                ]}
              >
                <Text style={[styles.statusText, { color: config?.isActive ? colors.success : colors.error }]}>
                  {config?.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Location Services</Text>
            <Text style={styles.cardSubtitle}>
              Configure the Google Maps API key that powers "use my current location" and address
              autocomplete during signup.
            </Text>
            <TouchableOpacity style={styles.manageBtn} onPress={openModal}>
              <Text style={styles.manageBtnText}>Manage Credentials</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Location Services Configuration</Text>
                  <Text style={styles.modalSubtitle}>Configure the Google Maps API key used for location features.</Text>
                </View>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>LOCATION SERVICE STATUS</Text>
                  <Text style={styles.toggleHint}>
                    Turn on/off "use my current location" and address autocomplete during signup. If
                    inactive, users get a plain manual address form instead.
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={v => isEditing && setIsActive(v)}
                  disabled={!isEditing}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={isActive ? colors.primary : colors.textTertiary}
                />
              </View>

              <Text style={styles.sectionLabel}>GOOGLE MAPS API KEY</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, !isEditing && styles.inputDisabled]}
                  value={apiKey}
                  onChangeText={setApiKey}
                  editable={isEditing}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  placeholder={hasSavedKey ? '••••••••••••••••••••' : 'Google Maps API key'}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
                  <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.keyHint}>
                Needs Geocoding API + Places API enabled on this key in Google Cloud Console.
              </Text>

              <View style={styles.testBox}>
                <Text style={styles.sectionLabel}>TEST THIS KEY</Text>
                <Text style={styles.toggleHint}>Verifies the key by resolving a known address (India Gate, New Delhi).</Text>
                <TouchableOpacity style={styles.testBtn} onPress={handleSendTest} disabled={isTesting}>
                  {isTesting ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <Text style={styles.testBtnText}>Send Test Request</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.modalFooter}>
                {isEditing ? (
                  <>
                    <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={() => setIsEditing(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerBtn, styles.clearBtn]} onPress={handleClearKeys}>
                      <Text style={styles.clearBtnText}>Clear Keys</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerBtn, styles.saveBtn]} onPress={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color={colors.textWhite} />
                      ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={closeModal}>
                      <Text style={styles.cancelBtnText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerBtn, styles.saveBtn]} onPress={() => setIsEditing(true)}>
                      <Text style={styles.saveBtnText}>Edit Configuration</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  card: { backgroundColor: colors.card, borderRadius: 20, padding: 18, ...shadows.card },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  manageBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  modalSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, maxWidth: 280 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 6 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 14, marginBottom: 16, gap: 12,
  },
  toggleHint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text,
    backgroundColor: colors.card, marginBottom: 4,
  },
  inputDisabled: { backgroundColor: colors.backgroundSecondary, color: colors.textSecondary },

  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { position: 'absolute', right: 12, top: 11 },
  keyHint: { fontSize: 11, color: colors.textTertiary, marginTop: 4, marginBottom: 4 },

  testBox: { backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 14, marginTop: 18 },
  testBtn: {
    backgroundColor: colors.primary + 'CC', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  testBtnText: { color: colors.textWhite, fontSize: 13, fontWeight: '700' },

  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 22 },
  footerBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: colors.backgroundSecondary },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.text },
  clearBtn: { backgroundColor: colors.errorLight },
  clearBtnText: { fontSize: 14, fontWeight: '700', color: colors.error },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.textWhite },
});

export default LocationConfigScreen;
