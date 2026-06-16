import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTickets } from '../../hooks/useTickets';
import {
  TicketCategory,
  TicketPriority,
  PARENT_TICKET_CATEGORIES,
  TEACHER_TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_COLORS,
  CATEGORY_DISPLAY,
  PRIORITY_DISPLAY,
} from '../../services/ticketApi';

const PRIORITY_ICONS: Record<TicketPriority, string> = {
  low: 'arrow-down-circle-outline',
  medium: 'remove-circle-outline',
  high: 'arrow-up-circle-outline',
  urgent: 'alert-circle-outline',
};

const CreateTicketScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';
  const categories = role === 'teacher' ? TEACHER_TICKET_CATEGORIES : PARENT_TICKET_CATEGORIES;

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>('medium');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { create, isSubmitting } = useTickets();

  const isFormValid = subject.trim().length > 0 && selectedCategory !== null && description.trim().length > 10;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }
    if (!selectedCategory) return;

    try {
      const ticket = await create({
        category: selectedCategory,
        priority: selectedPriority.toLowerCase() as any,
        subject: subject.trim(),
        description: description.trim(),
      });

      Alert.alert(
        '✅ Ticket Created',
        `Your ticket ${ticket.ticketId} has been submitted successfully.\n\nWe will respond within 24 hours.`,
        [
          {
            text: 'View My Tickets',
            onPress: () => navigation.navigate('MyTickets', { role }),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create ticket. Please try again.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Create Ticket</Text>
          <Text style={styles.headerSub}>Describe your issue</Text>
        </View>
        <View style={styles.headerIconBox}>
          <Ionicons name="create-outline" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Subject */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Subject <Text style={styles.required}>*</Text></Text>
          <View style={[styles.inputBox, subject.length > 0 && styles.inputBoxActive]}>
            <Ionicons name="text-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief title of your issue"
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
            />
          </View>
          <Text style={styles.charCount}>{subject.length}/100</Text>
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.inputBox, selectedCategory !== null && styles.inputBoxActive]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Text style={[styles.pickerText, selectedCategory && { color: colors.text }]}>
              {selectedCategory ?? 'Select a category'}
            </Text>
            <Ionicons
              name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.dropdownCard}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.dropdownItem, selectedCategory === cat && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dropdownText, selectedCategory === cat && { color: colors.primary, fontWeight: '700' }]}>
                    {CATEGORY_DISPLAY[cat]}
                  </Text>
                  {selectedCategory === cat && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Priority */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {TICKET_PRIORITIES.map((p) => {
              const isActive = selectedPriority === p;
              const pColor = TICKET_PRIORITY_COLORS[p];
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    { borderColor: isActive ? pColor : colors.border },
                    isActive && { backgroundColor: pColor + '14' },
                  ]}
                  onPress={() => setSelectedPriority(p)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={PRIORITY_ICONS[p] as any} size={14} color={isActive ? pColor : colors.textSecondary} />
                  <Text style={[styles.priorityChipText, { color: isActive ? pColor : colors.textSecondary }]}>
                    {PRIORITY_DISPLAY[p]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description <Text style={styles.required}>*</Text></Text>
          <View style={[styles.textAreaBox, description.length > 10 && styles.inputBoxActive]}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your issue in detail. Include any relevant transaction IDs, dates, or screenshots description."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>

        {/* Attachment Placeholder */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Attachment (Optional)</Text>
          <TouchableOpacity style={styles.attachmentBox} activeOpacity={0.75}>
            <Ionicons name="attach-outline" size={24} color={colors.textSecondary} />
            <View style={styles.attachmentText}>
              <Text style={styles.attachmentTitle}>Attach Screenshot</Text>
              <Text style={styles.attachmentSub}>JPG, PNG up to 5 MB</Text>
            </View>
            <View style={styles.attachmentBadge}>
              <Text style={styles.attachmentBadgeText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            Our support team will respond within 24 hours. For urgent issues, mark priority as
            "Urgent".
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Create Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBox: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: '500', marginTop: 2 },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { padding: 16 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
  required: { color: colors.error },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    ...shadows.xs,
  },
  inputBoxActive: { borderColor: colors.primary },
  inputIcon: { flexShrink: 0 },
  textInput: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  pickerText: { flex: 1, fontSize: 15, color: colors.textTertiary, fontWeight: '500' },
  charCount: { fontSize: 11, color: colors.textTertiary, textAlign: 'right', marginTop: 4 },
  dropdownCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    overflow: 'hidden',
    ...shadows.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemActive: { backgroundColor: colors.primary + '08' },
  dropdownText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  priorityRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  priorityChipText: { fontSize: 13, fontWeight: '600' },
  textAreaBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 130,
    ...shadows.xs,
  },
  textArea: { fontSize: 15, color: colors.text, fontWeight: '400', lineHeight: 22, minHeight: 110 },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  attachmentText: { flex: 1 },
  attachmentTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  attachmentSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  attachmentBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  attachmentBadgeText: { fontSize: 10, fontWeight: '700', color: colors.accentDark },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.infoLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 20 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    ...shadows.md,
  },
  submitBtnDisabled: { backgroundColor: colors.textTertiary },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});

export default CreateTicketScreen;
