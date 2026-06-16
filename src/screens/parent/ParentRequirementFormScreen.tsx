import React, { useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { useRequirementForm, EMPTY_FORM } from '../../hooks/useRequirementForm';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import type { RequirementFormData } from '../../services/requirementService';

// ── Route params ──────────────────────────────────────────────────────────────

export interface ParentRequirementFormParams {
  mode: 'create' | 'edit';
  editId?: string;
  initialData?: Partial<RequirementFormData>;
}

type RouteProps = RouteProp<{ ParentRequirementForm: ParentRequirementFormParams }, 'ParentRequirementForm'>;

// ── Static option lists ───────────────────────────────────────────────────────

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
const GRADES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Undergraduate',
];
const SUBJECTS = [
  'Maths', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
  'Computer Science', 'Economics', 'Accounts', 'Business Studies',
];
const TUITION_MODES: { key: RequirementFormData['tuitionType']; label: string; icon: string }[] = [
  { key: 'home', label: 'Home Tuition', icon: 'home-outline' },
  { key: 'online', label: 'Online', icon: 'laptop-outline' },
  { key: 'group', label: 'Group', icon: 'people-outline' },
  { key: 'crash', label: 'Crash Course', icon: 'flash-outline' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMINGS = ['Morning (6–9 AM)', 'Forenoon (9–12 PM)', 'Afternoon (12–4 PM)', 'Evening (4–7 PM)', 'Night (7–10 PM)'];
const BUDGET_PRESETS = ['1000', '2000', '3000', '5000', '8000', '10000'];

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; icon: string; required?: boolean }> = memo(({ title, icon, required }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={18} color={colors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
    {required && <Text style={styles.requiredAsterisk}>*</Text>}
  </View>
));
SectionHeader.displayName = 'SectionHeader';

const FieldLabel: React.FC<{ label: string; required?: boolean }> = memo(({ label, required }) => (
  <Text style={styles.fieldLabel}>
    {label}{required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
  </Text>
));
FieldLabel.displayName = 'FieldLabel';

const FieldError: React.FC<{ message?: string }> = memo(({ message }) =>
  message ? <Text style={styles.fieldError}>{message}</Text> : null,
);
FieldError.displayName = 'FieldError';

interface ChipRowProps {
  options: string[];
  selected: string | string[];
  onToggle: (val: string) => void;
  multi?: boolean;
  error?: string;
}
const ChipRow: React.FC<ChipRowProps> = memo(({ options, selected, onToggle, multi = false, error }) => {
  const isSelected = (val: string) =>
    multi ? (selected as string[]).includes(val) : selected === val;

  return (
    <>
      <View style={styles.chipRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, isSelected(opt) && styles.chipSelected]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, isSelected(opt) && styles.chipTextSelected]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </>
  );
});
ChipRow.displayName = 'ChipRow';

// ── Main Screen ───────────────────────────────────────────────────────────────

const ParentRequirementFormScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const { mode = 'create', editId, initialData } = route.params ?? {};
  const isEdit = mode === 'edit';

  const {
    formData,
    errors,
    submitStatus,
    isDirty,
    setField,
    toggleSubject,
    toggleDay,
    toggleTiming,
    submit,
    saveDraft,
    loadDraft,
    reset,
  } = useRequirementForm(token, initialData, editId);

  const scrollRef = useRef<ScrollView>(null);

  // Load draft on mount (only for create mode)
  useEffect(() => {
    if (!isEdit) {
      loadDraft();
    }
  }, [isEdit, loadDraft]);

  // Handle 401 globally
  useEffect(() => {
    if (errors.general === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [errors.general, dispatch]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Save as draft or discard?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => { reset(); navigation.goBack(); } },
          { text: 'Save Draft', onPress: async () => { await saveDraft(); navigation.goBack(); } },
          { text: 'Continue Editing', style: 'cancel' },
        ],
      );
    } else {
      navigation.goBack();
    }
  }, [isDirty, navigation, reset, saveDraft]);

  const handleSubmit = useCallback(async () => {
    const result = await submit();
    if (result) {
      Alert.alert(
        isEdit ? 'Requirement Updated' : 'Requirement Posted!',
        isEdit
          ? 'Your requirement has been updated successfully.'
          : 'Your requirement is live. Tutors will start applying soon!',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [submit, isEdit, navigation]);

  const handleSaveDraft = useCallback(async () => {
    await saveDraft();
    Alert.alert('Draft Saved', 'Your progress has been saved. You can continue later.');
  }, [saveDraft]);

  const isSubmitting = submitStatus === 'submitting';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Requirement' : 'Post Requirement'}
          </Text>
          <Text style={styles.headerSub}>
            {isEdit ? 'Update your tuition details' : 'Find the perfect tutor'}
          </Text>
        </View>
        {!isEdit && (
          <TouchableOpacity
            onPress={handleSaveDraft}
            style={styles.draftBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.draftBtnText}>Draft</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* General error banner */}
          {errors.general ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* ── Section 1: Student Information ─────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Student Information" icon="person-outline" required />

            <FieldLabel label="Student Name" required />
            <TextInput
              style={[styles.input, errors.studentName ? styles.inputError : null]}
              value={formData.studentName}
              onChangeText={v => setField('studentName', v)}
              placeholder="e.g. Aarav Sharma"
              placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
              returnKeyType="next"
              maxLength={80}
            />
            <FieldError message={errors.studentName} />

            <FieldLabel label="Class / Grade" required />
            <ChipRow
              options={GRADES}
              selected={formData.grade}
              onToggle={v => setField('grade', formData.grade === v ? '' : v)}
              error={errors.grade}
            />

            <FieldLabel label="Board" required />
            <ChipRow
              options={BOARDS}
              selected={formData.board}
              onToggle={v => setField('board', formData.board === v ? '' : v)}
              error={errors.board}
            />
          </View>

          {/* ── Section 2: Subjects ────────────────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Subjects" icon="book-outline" required />
            <Text style={styles.hintText}>Select one or more subjects</Text>
            <ChipRow
              options={SUBJECTS}
              selected={formData.subjects}
              onToggle={toggleSubject}
              multi
              error={errors.subjects}
            />
          </View>

          {/* ── Section 3: Tuition Mode ────────────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Tuition Mode" icon="school-outline" required />
            <View style={styles.modeRow}>
              {TUITION_MODES.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.modeCard, formData.tuitionType === m.key && styles.modeCardSelected]}
                  onPress={() => setField('tuitionType', m.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.modeIcon, formData.tuitionType === m.key && styles.modeIconSelected]}>
                    <Ionicons
                      name={m.icon as any}
                      size={20}
                      color={formData.tuitionType === m.key ? '#FFFFFF' : colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.modeLabel, formData.tuitionType === m.key && styles.modeLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FieldError message={errors.tuitionType} />
          </View>

          {/* ── Section 4: Location ────────────────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Location" icon="location-outline" />

            <FieldLabel label="Address" />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={formData.address}
              onChangeText={v => setField('address', v)}
              placeholder="Street / Locality"
              placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
              multiline
              numberOfLines={2}
              maxLength={200}
            />

            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <FieldLabel label="City" />
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={v => setField('city', v)}
                  placeholder="City"
                  placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
                  maxLength={60}
                />
              </View>
              <View style={styles.rowField}>
                <FieldLabel label="State" />
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={v => setField('state', v)}
                  placeholder="State"
                  placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
                  maxLength={60}
                />
              </View>
            </View>

            <FieldLabel label="Pincode" />
            <TextInput
              style={styles.input}
              value={formData.pincode}
              onChangeText={v => setField('pincode', v.replace(/[^0-9]/g, ''))}
              placeholder="6-digit pincode"
              placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          {/* ── Section 5: Budget ──────────────────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Monthly Budget" icon="cash-outline" required />
            <Text style={styles.hintText}>Select or enter your monthly budget (₹)</Text>

            <View style={styles.chipRow}>
              {BUDGET_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.chip,
                    formData.budgetMax === preset && styles.chipSelected,
                  ]}
                  onPress={() => setField('budgetMax', preset)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.chipText,
                    formData.budgetMax === preset && styles.chipTextSelected,
                  ]}>
                    ₹{parseInt(preset, 10).toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FieldLabel label="Or enter custom amount" />
            <View style={styles.budgetInputRow}>
              <Text style={styles.budgetPrefix}>₹</Text>
              <TextInput
                style={[styles.input, styles.budgetInput, errors.budgetMax ? styles.inputError : null]}
                value={formData.budgetMax}
                onChangeText={v => setField('budgetMax', v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 4000"
                placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
                keyboardType="numeric"
                maxLength={6}
              />
              <Text style={styles.budgetSuffix}>/month</Text>
            </View>
            <FieldError message={errors.budgetMax} />
          </View>

          {/* ── Section 6: Schedule ────────────────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Preferred Schedule" icon="calendar-outline" />

            <FieldLabel label="Days" />
            <ChipRow
              options={DAYS}
              selected={formData.preferredDays}
              onToggle={toggleDay}
              multi
            />

            <FieldLabel label="Time Slots" />
            <ChipRow
              options={TIMINGS}
              selected={formData.preferredTimings}
              onToggle={toggleTiming}
              multi
            />
          </View>

          {/* ── Section 7: Additional Notes ────────────────────── */}
          <View style={styles.card}>
            <SectionHeader title="Additional Notes" icon="create-outline" />
            <Text style={styles.hintText}>Learning goals, special requirements (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={formData.notes}
              onChangeText={v => setField('notes', v)}
              placeholder="e.g. Need strong foundation in calculus, prefer experienced teacher..."
              placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{formData.notes.length}/500</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Submit Footer ────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.88}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name={isEdit ? 'save-outline' : 'paper-plane-outline'} size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isEdit ? 'Update Requirement' : 'Post Requirement'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border ?? '#E5E7EB',
    ...shadows.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  draftBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  draftBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error + '14',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    marginBottom: 4,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: colors.error, lineHeight: 18 },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  requiredAsterisk: { color: colors.error, fontSize: 15, fontWeight: '700' },

  // Field
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  fieldError: { fontSize: 12, color: colors.error, marginTop: 4 },
  hintText: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },

  // Input
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  inputMultiline: { minHeight: 64, paddingTop: 10, textAlignVertical: 'top' },
  notesInput: { minHeight: 100, paddingTop: 10 },
  charCount: { fontSize: 11, color: colors.textSecondary, textAlign: 'right', marginTop: 4 },

  // Row fields
  rowFields: { flexDirection: 'row', gap: 10 },
  rowField: { flex: 1 },

  // Budget
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetPrefix: { fontSize: 18, fontWeight: '700', color: colors.text },
  budgetInput: { flex: 1 },
  budgetSuffix: { fontSize: 13, color: colors.textSecondary },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },

  // Mode cards
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  modeCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border ?? '#E5E7EB',
    backgroundColor: colors.background,
    gap: 6,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '0D',
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border ?? '#E5E7EB',
  },
  modeIconSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  modeLabelSelected: { color: colors.primary },

  // Footer
  footer: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border ?? '#E5E7EB',
    ...shadows.md,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

export default ParentRequirementFormScreen;
