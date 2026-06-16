import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface Template {
  id: string;
  title: string;
  trigger: string;
  icon: string;
  iconColor: string;
  subject: string;
  body: string;
  channels: string[];
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'teacher_applied',
    title: 'Teacher Applied',
    trigger: 'When a teacher applies to a lead',
    icon: 'school-outline',
    iconColor: colors.secondary,
    subject: 'New Application for Your Requirement',
    body: 'Hi {{parent_name}},\n\nA qualified teacher {{teacher_name}} has applied to your requirement "{{requirement_title}}".\n\nView their profile and respond within 48 hours.\n\nTeam TuitionApp',
    channels: ['Push', 'Email'],
  },
  {
    id: 'lead_unlocked',
    title: 'Lead Unlocked',
    trigger: 'When a teacher unlocks a lead',
    icon: 'lock-open-outline',
    iconColor: colors.success,
    subject: 'Lead Successfully Unlocked',
    body: 'Hi {{teacher_name}},\n\nYou have successfully unlocked the lead "{{lead_title}}" in {{city}}.\n\nThe parent\'s contact details are now available in your dashboard.\n\nGood luck!\nTeam TuitionApp',
    channels: ['Push', 'SMS'],
  },
  {
    id: 'payment_success',
    title: 'Payment Success',
    trigger: 'After successful payment',
    icon: 'checkmark-circle-outline',
    iconColor: colors.success,
    subject: 'Payment Confirmed — ₹{{amount}}',
    body: 'Hi {{user_name}},\n\nYour payment of ₹{{amount}} has been successfully processed.\n\nTransaction ID: {{txn_id}}\nDate: {{date}}\n\nYour invoice is attached.\n\nTeam TuitionApp',
    channels: ['Push', 'Email', 'SMS'],
  },
  {
    id: 'refund_approved',
    title: 'Refund Approved',
    trigger: 'When admin approves a refund',
    icon: 'return-down-back-outline',
    iconColor: colors.info,
    subject: 'Your Refund of ₹{{amount}} Has Been Approved',
    body: 'Hi {{user_name}},\n\nWe have approved your refund request of ₹{{amount}}.\n\nThe amount will be credited to your original payment method within 5–7 business days.\n\nRefund ID: {{refund_id}}\n\nTeam TuitionApp',
    channels: ['Push', 'Email'],
  },
  {
    id: 'support_ticket',
    title: 'Support Ticket',
    trigger: 'When a support ticket is created',
    icon: 'headset-outline',
    iconColor: colors.accent,
    subject: 'Support Ticket #{{ticket_id}} Created',
    body: 'Hi {{user_name}},\n\nThank you for reaching out. Your support ticket #{{ticket_id}} has been created.\n\nCategory: {{category}}\nPriority: {{priority}}\n\nWe will respond within 24 hours.\n\nTeam TuitionApp',
    channels: ['Push', 'Email'],
  },
];

const NotificationTemplatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  const openTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.body);
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setEditedSubject('');
    setEditedBody('');
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Templates</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.infoBanner}>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            View and preview notification templates. Tap any card to open the mock template editor.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>TEMPLATES ({MOCK_TEMPLATES.length})</Text>

        {MOCK_TEMPLATES.map(template => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => openTemplate(template)}
            activeOpacity={0.8}
          >
            <View style={[styles.templateIcon, { backgroundColor: template.iconColor + '18' }]}>
              <Ionicons name={template.icon as any} size={24} color={template.iconColor} />
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templateTrigger}>{template.trigger}</Text>
              <View style={styles.channelsRow}>
                {template.channels.map(ch => (
                  <View key={ch} style={[styles.channelChip, { backgroundColor: template.iconColor + '18' }]}>
                    <Text style={[styles.channelText, { color: template.iconColor }]}>{ch}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}

        <View style={styles.noteCard}>
          <Ionicons name="code-slash-outline" size={16} color={colors.secondary} />
          <Text style={styles.noteText}>
            Variables like {'{{user_name}}'} and {'{{amount}}'} are replaced dynamically at send time.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Template Editor Modal */}
      <Modal
        visible={!!selectedTemplate}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              {selectedTemplate && (
                <View style={[styles.modalHeaderIcon, { backgroundColor: selectedTemplate.iconColor + '18' }]}>
                  <Ionicons name={selectedTemplate.icon as any} size={20} color={selectedTemplate.iconColor} />
                </View>
              )}
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>{selectedTemplate?.title}</Text>
                <Text style={styles.modalTrigger}>{selectedTemplate?.trigger}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Channels */}
            <View style={styles.modalChannels}>
              <Text style={styles.fieldLabel}>Channels</Text>
              <View style={styles.channelsRow}>
                {selectedTemplate?.channels.map(ch => (
                  <View key={ch} style={[styles.channelChip, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={[styles.channelText, { color: colors.primary }]}>{ch}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Subject Line</Text>
              <TextInput
                style={styles.subjectInput}
                value={editedSubject}
                onChangeText={setEditedSubject}
                placeholder="Email subject..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Body */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Message Body</Text>
              <TextInput
                style={styles.bodyInput}
                value={editedBody}
                onChangeText={setEditedBody}
                placeholder="Notification body..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* No-save note */}
            <View style={styles.noSaveNote}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.noSaveText}>Mock editor — changes are not saved</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.previewBtn} onPress={closeModal}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.previewBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.primary + '12', padding: 14, borderRadius: 14, marginBottom: 20,
    borderWidth: 1, borderColor: colors.primary + '25',
  },
  infoText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 19, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 12, paddingHorizontal: 4,
  },

  templateCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10, ...shadows.card,
  },
  templateIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 },
  templateTrigger: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  channelsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  channelChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  channelText: { fontSize: 11, fontWeight: '700' },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.secondary + '12', padding: 14, borderRadius: 14, marginTop: 8,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.secondary, lineHeight: 19, fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  modalTrigger: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center', alignItems: 'center',
  },

  modalChannels: { marginBottom: 14 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5 },

  subjectInput: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  bodyInput: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
    minHeight: 120, maxHeight: 180,
  },

  noSaveNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14,
  },
  noSaveText: { fontSize: 12, color: colors.textTertiary, fontStyle: 'italic' },

  modalActions: {},
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary + '14', paddingVertical: 14, borderRadius: 14,
  },
  previewBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});

export default NotificationTemplatesScreen;
