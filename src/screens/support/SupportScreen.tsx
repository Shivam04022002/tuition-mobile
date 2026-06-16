import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface QuickAction {
  icon: string;
  label: string;
  subtitle: string;
  color: string;
  bg: string;
  onPress: () => void;
}

interface HelpTopic {
  icon: string;
  label: string;
  color: string;
}

const SupportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const quickActions: QuickAction[] = [
    {
      icon: 'create-outline',
      label: 'Raise Ticket',
      subtitle: 'Report an issue',
      color: colors.primary,
      bg: colors.primary + '14',
      onPress: () => navigation.navigate('CreateTicket', { role }),
    },
    {
      icon: 'list-outline',
      label: 'My Tickets',
      subtitle: 'Track your issues',
      color: colors.accent,
      bg: colors.accent + '14',
      onPress: () => navigation.navigate('MyTickets', { role }),
    },
    {
      icon: 'help-circle-outline',
      label: 'FAQs',
      subtitle: 'Common questions',
      color: colors.secondary,
      bg: colors.secondary + '14',
      onPress: () => navigation.navigate('SupportFAQ'),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: 'Contact Support',
      subtitle: 'Email or call us',
      color: colors.success,
      bg: colors.success + '14',
      onPress: () => Linking.openURL('mailto:support@tuitionapp.in'),
    },
  ];

  const helpTopics: HelpTopic[] = role === 'teacher'
    ? [
        { icon: 'key-outline',           label: 'Lead Unlock Issue',    color: colors.primary },
        { icon: 'shield-checkmark-outline', label: 'Profile Verification', color: colors.secondary },
        { icon: 'document-text-outline', label: 'Application Issue',    color: colors.accent },
        { icon: 'card-outline',          label: 'Payment Issue',         color: colors.success },
        { icon: 'construct-outline',     label: 'Technical Issue',       color: colors.info },
        { icon: 'person-outline',        label: 'Account Issues',        color: colors.pink },
      ]
    : [
        { icon: 'card-outline',          label: 'Payments',              color: colors.primary },
        { icon: 'refresh-outline',       label: 'Refunds',               color: colors.accent },
        { icon: 'people-outline',        label: 'Tutor Matching',        color: colors.secondary },
        { icon: 'videocam-outline',      label: 'Demo Classes',          color: colors.success },
        { icon: 'person-outline',        label: 'Profile Issues',        color: colors.pink },
        { icon: 'lock-closed-outline',   label: 'Account Issues',        color: colors.info },
      ];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Support Center</Text>
          <Text style={styles.headerSub}>We're here to help you</Text>
        </View>
        <View style={styles.headerIconBox}>
          <Ionicons name="headset-outline" size={28} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickCard}
                onPress={action.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIconBox, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon as any} size={26} color={action.color} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
                <Text style={styles.quickSub}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Help Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POPULAR HELP TOPICS</Text>
          <View style={styles.topicsCard}>
            {helpTopics.map((topic, idx) => (
              <React.Fragment key={topic.label}>
                <TouchableOpacity
                  style={styles.topicRow}
                  onPress={() => navigation.navigate('SupportFAQ')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.topicIcon, { backgroundColor: topic.color + '14' }]}>
                    <Ionicons name={topic.icon as any} size={20} color={topic.color} />
                  </View>
                  <Text style={styles.topicLabel}>{topic.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                {idx < helpTopics.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT US</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={[styles.topicIcon, { backgroundColor: colors.primary + '14' }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextBox}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@tuitionapp.in</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.contactRow}>
              <View style={[styles.topicIcon, { backgroundColor: colors.success + '14' }]}>
                <Ionicons name="time-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.contactTextBox}>
                <Text style={styles.contactLabel}>Support Hours</Text>
                <Text style={styles.contactValue}>Mon–Sat, 9 AM – 7 PM IST</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.contactRow}>
              <View style={[styles.topicIcon, { backgroundColor: colors.accent + '14' }]}>
                <Ionicons name="flash-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.contactTextBox}>
                <Text style={styles.contactLabel}>Response Time</Text>
                <Text style={styles.contactValue}>Typically within 24 hours</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    ...shadows.card,
  },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  quickSub: { fontSize: 12, color: colors.textSecondary },
  topicsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
  contactCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
  },
  contactTextBox: { flex: 1 },
  contactLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  contactValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
});

export default SupportScreen;
