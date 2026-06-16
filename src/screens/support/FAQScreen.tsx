import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { MOCK_FAQS, FaqCategory, FaqItem } from '../../data/mockFaqs';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQAccordionItem: React.FC<{ faq: FaqItem; isOpen: boolean; onToggle: () => void }> = ({
  faq,
  isOpen,
  onToggle,
}) => {
  return (
    <View style={accordionStyles.item}>
      <TouchableOpacity style={accordionStyles.question} onPress={onToggle} activeOpacity={0.75}>
        <Text style={accordionStyles.questionText}>{faq.question}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={accordionStyles.answer}>
          <Text style={accordionStyles.answerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );
};

const accordionStyles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  answer: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: colors.backgroundSecondary,
  },
  answerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

const FAQScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  const [selectedCategory, setSelectedCategory] = useState<string>(MOCK_FAQS[0].id);
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set());

  const activeCategoryData: FaqCategory =
    MOCK_FAQS.find((c) => c.id === selectedCategory) ?? MOCK_FAQS[0];

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>FAQs</Text>
          <Text style={styles.headerSub}>Frequently asked questions</Text>
        </View>
        <View style={styles.headerIconBox}>
          <Ionicons name="help-circle-outline" size={28} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {MOCK_FAQS.map((cat) => {
            const isActive = cat.id === selectedCategory;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isActive && { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setOpenFaqIds(new Set());
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : colors.textSecondary}
                />
                <Text style={[styles.chipText, isActive && { color: '#FFFFFF' }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* FAQ List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.categoryHeader}>
          <View style={[styles.catIconBox, { backgroundColor: activeCategoryData.color + '14' }]}>
            <Ionicons name={activeCategoryData.icon as any} size={22} color={activeCategoryData.color} />
          </View>
          <Text style={styles.categoryTitle}>{activeCategoryData.label}</Text>
          <Text style={styles.categoryCount}>{activeCategoryData.faqs.length} questions</Text>
        </View>

        <View style={styles.faqCard}>
          {activeCategoryData.faqs.map((faq, idx) => (
            <React.Fragment key={faq.id}>
              <FAQAccordionItem
                faq={faq}
                isOpen={openFaqIds.has(faq.id)}
                onToggle={() => toggleFaq(faq.id)}
              />
              {idx === activeCategoryData.faqs.length - 1 && (
                <View style={{ height: 0, borderBottomWidth: 0 }} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Still need help */}
        <View style={styles.needHelp}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.primary} />
          <Text style={styles.needHelpTitle}>Still need help?</Text>
          <Text style={styles.needHelpSub}>
            Our support team is available Mon–Sat, 9 AM – 7 PM IST
          </Text>
          <TouchableOpacity
            style={styles.raiseBtn}
            onPress={() => navigation.navigate('CreateTicket')}
            activeOpacity={0.8}
          >
            <Text style={styles.raiseBtnText}>Raise a Ticket</Text>
          </TouchableOpacity>
        </View>

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
  chipRow: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipScroll: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  scroll: { padding: 16 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  categoryCount: { fontSize: 13, color: colors.textTertiary, fontWeight: '600' },
  faqCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
    marginBottom: 24,
  },
  needHelp: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...shadows.card,
  },
  needHelpTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  needHelpSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  raiseBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  raiseBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default FAQScreen;
