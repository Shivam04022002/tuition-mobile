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
import * as smtpApi from '../../services/adminSmtpApi';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';

const ENCRYPTION_OPTIONS: Array<{ label: string; value: smtpApi.SmtpConfig['encryption'] }> = [
  { label: 'None', value: 'none' },
  { label: 'STARTTLS', value: 'STARTTLS' },
  { label: 'SSL/TLS', value: 'SSL/TLS' },
];

const EMPTY_FORM: smtpApi.SmtpConfigInput = {
  isActive: false,
  fromEmail: '',
  fromName: '',
  replyToEmail: '',
  host: '',
  port: 587,
  encryption: 'STARTTLS',
  authRequired: true,
  username: '',
  password: '',
};

const SmtpConfigScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);
  const token = useAppSelector(selectAuthToken);

  const [config, setConfig] = useState<smtpApi.SmtpConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<smtpApi.SmtpConfigInput>(EMPTY_FORM);
  const [services, setServices] = useState<smtpApi.MailService[]>([]);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [pendingClear, setPendingClear] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await smtpApi.getSmtpConfig(token);
      if (res.success) {
        setConfig(res.data);
        setHasSavedPassword(res.data.hasPassword);
        setServices(res.data.services || []);
        setForm({
          isActive: res.data.isActive,
          fromEmail: res.data.fromEmail,
          fromName: res.data.fromName,
          replyToEmail: res.data.replyToEmail,
          host: res.data.host,
          port: res.data.port,
          encryption: res.data.encryption,
          authRequired: res.data.authRequired,
          username: res.data.username,
          password: '',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load SMTP configuration');
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
    setShowPassword(false);
    setTestEmail('');
    // Discard any unsaved edits by reloading the last-saved values.
    if (config) {
      setForm({
        isActive: config.isActive,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        replyToEmail: config.replyToEmail,
        host: config.host,
        port: config.port,
        encryption: config.encryption,
        authRequired: config.authRequired,
        username: config.username,
        password: '',
      });
      setServices(config.services || []);
    }
    setPendingClear(false);
  };

  const toggleService = (key: string) => {
    if (!isEditing) return;
    setServices(prev => prev.map(s => (s.key === key ? { ...s, enabled: !s.enabled } : s)));
  };

  const handleClearKeys = () => {
    Alert.alert(
      'Clear Category Credentials?',
      'Are you sure you want to clear credentials for SMTP Configuration? This will clear all input fields in this category. You must click Save Changes to apply.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear Keys',
          style: 'destructive',
          onPress: () => {
            setForm({ ...EMPTY_FORM, isActive: form.isActive });
            setHasSavedPassword(false);
            setPendingClear(true);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!token) return;

    // If the admin cleared the form and hasn't typed anything new, treat
    // Save as "confirm the clear" — wipe the saved config instead of
    // rejecting it for missing required fields.
    const isFullyBlank = !form.fromEmail && !form.fromName && !form.host && !form.username && !form.password;
    const isClearing = pendingClear && isFullyBlank;

    if (!isClearing && (!form.fromEmail || !form.fromName || !form.host || !form.port)) {
      Alert.alert('Missing fields', 'From Email, From Name, SMTP Host, and SMTP Port are required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await smtpApi.updateSmtpConfig(token, {
        ...form,
        services: services.map(s => ({ key: s.key, enabled: s.enabled })),
        ...(isClearing ? { clear: true } : {}),
      });
      if (res.success) {
        setConfig(res.data);
        setHasSavedPassword(res.data.hasPassword);
        setServices(res.data.services || []);
        setForm(prev => ({ ...prev, password: '' }));
        setIsEditing(false);
        setPendingClear(false);
        Alert.alert('Saved', isClearing ? 'SMTP configuration cleared' : 'SMTP configuration saved successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save SMTP configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!token) return;
    if (!testEmail.trim()) {
      Alert.alert('Test email required', 'Enter an email address to send the test to.');
      return;
    }
    if (!form.password && !hasSavedPassword) {
      Alert.alert('Password required', 'Enter the SMTP password before sending a test email.');
      return;
    }
    setIsTesting(true);
    try {
      const res = await smtpApi.sendTestEmail(token, { ...form, to: testEmail.trim() });
      Alert.alert(res.success ? 'Success' : 'Failed', res.message);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send test email');
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
        <Text style={styles.headerTitle}>SMTP Configuration</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoading && !config ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="mail-outline" size={22} color={colors.primary} />
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
            <Text style={styles.cardTitle}>SMTP Configuration</Text>
            <Text style={styles.cardSubtitle}>
              Configure SMTP host, credentials, encryption, and sender email details.
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
                  <Text style={styles.modalTitle}>SMTP Server Configuration</Text>
                  <Text style={styles.modalSubtitle}>Configure SMTP server parameters and email sender details.</Text>
                </View>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>MAIL SERVICE STATUS</Text>
                  <Text style={styles.toggleHint}>
                    Turn mail service on/off. If inactive, all user signup and verification emails are blocked.
                  </Text>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={v => isEditing && setForm({ ...form, isActive: v })}
                  disabled={!isEditing}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={form.isActive ? colors.primary : colors.textTertiary}
                />
              </View>

              <Text style={styles.sectionLabel}>EMAIL SENDER SETTINGS</Text>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>From Email Address</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={form.fromEmail}
                    onChangeText={t => setForm({ ...form, fromEmail: t })}
                    editable={isEditing}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="info@example.com"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>From Name</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={form.fromName}
                    onChangeText={t => setForm({ ...form, fromName: t })}
                    editable={isEditing}
                    placeholder="Your App Name"
                  />
                </View>
              </View>
              <Text style={styles.fieldLabel}>Reply To Email (Optional)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.replyToEmail}
                onChangeText={t => setForm({ ...form, replyToEmail: t })}
                editable={isEditing}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="info@example.com"
              />

              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SMTP SERVER SETTINGS</Text>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>SMTP Host</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={form.host}
                    onChangeText={t => setForm({ ...form, host: t })}
                    editable={isEditing}
                    autoCapitalize="none"
                    placeholder="smtp.example.com"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>SMTP Port</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={String(form.port)}
                    onChangeText={t => setForm({ ...form, port: Number(t.replace(/[^0-9]/g, '')) || 0 })}
                    editable={isEditing}
                    keyboardType="number-pad"
                    placeholder="587"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Encryption</Text>
              <View style={styles.segmentRow}>
                {ENCRYPTION_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.segmentBtn, form.encryption === opt.value && styles.segmentBtnActive]}
                    disabled={!isEditing}
                    onPress={() => setForm({ ...form, encryption: opt.value })}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        form.encryption === opt.value && styles.segmentBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Require Username / Password</Text>
                <Switch
                  value={form.authRequired}
                  onValueChange={v => isEditing && setForm({ ...form, authRequired: v })}
                  disabled={!isEditing}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={form.authRequired ? colors.primary : colors.textTertiary}
                />
              </View>

              {form.authRequired && (
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.fieldLabel}>SMTP Username</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={form.username}
                      onChangeText={t => setForm({ ...form, username: t })}
                      editable={isEditing}
                      autoCapitalize="none"
                      placeholder="SMTP username"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.fieldLabel}>SMTP Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, !isEditing && styles.inputDisabled]}
                        value={form.password}
                        onChangeText={t => setForm({ ...form, password: t })}
                        editable={isEditing}
                        secureTextEntry={!showPassword}
                        placeholder={hasSavedPassword ? '••••••••••••' : 'SMTP password'}
                      />
                      <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.testBox}>
                <Text style={styles.sectionLabel}>SEND TEST EMAIL</Text>
                <Text style={styles.toggleHint}>Verify that your saved SMTP server configuration is working by sending a test email.</Text>
                <View style={styles.testRow}>
                  <TextInput
                    style={[styles.input, styles.testInput]}
                    value={testEmail}
                    onChangeText={setTestEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="e.g. test@example.com"
                  />
                  <TouchableOpacity style={styles.testBtn} onPress={handleSendTest} disabled={isTesting}>
                    {isTesting ? (
                      <ActivityIndicator size="small" color={colors.textWhite} />
                    ) : (
                      <Text style={styles.testBtnText}>Send Test Email</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.servicesBox}>
                <Text style={styles.sectionLabel}>MAIL SERVICES</Text>
                <Text style={styles.toggleHint}>
                  Choose which app features are allowed to send email through this SMTP configuration.
                </Text>
                {!form.host || !form.fromEmail ? (
                  <View style={styles.downBanner}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                    <Text style={styles.downBannerText}>Mail services are down — SMTP is not configured yet.</Text>
                  </View>
                ) : (
                  services.map((service, idx) => (
                    <React.Fragment key={service.key}>
                      <TouchableOpacity
                        style={styles.serviceRow}
                        activeOpacity={isEditing ? 0.7 : 1}
                        onPress={() => toggleService(service.key)}
                      >
                        <Ionicons
                          name={service.enabled ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={service.enabled ? colors.primary : colors.textTertiary}
                        />
                        <Text style={styles.serviceLabel}>{service.label}</Text>
                      </TouchableOpacity>
                      {idx < services.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))
                )}
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

  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text,
    backgroundColor: colors.card, marginBottom: 4,
  },
  inputDisabled: { backgroundColor: colors.backgroundSecondary, color: colors.textSecondary },

  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  segmentBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  segmentBtnActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  segmentBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  segmentBtnTextActive: { color: colors.primary },

  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { position: 'absolute', right: 12, top: 11 },

  testBox: { backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 14, marginTop: 18 },

  servicesBox: { backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 14, marginTop: 14 },
  downBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorLight, borderRadius: 10, padding: 10, marginTop: 8,
  },
  downBannerText: { flex: 1, fontSize: 12, color: colors.error, fontWeight: '600' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  serviceLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  testRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
  testInput: { flex: 1, marginBottom: 0, backgroundColor: colors.card },
  testBtn: {
    backgroundColor: colors.primary + 'CC', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
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

export default SmtpConfigScreen;
