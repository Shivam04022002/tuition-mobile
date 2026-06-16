import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const { width } = Dimensions.get('window');
const CARD_W = (width - 32 - 10) / 2;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  emoji: string;
  description: string;
  subTopics: string[];
}

const CATEGORIES: Category[] = [
  {
    id: 'math', name: 'Mathematics', icon: 'calculator-outline',
    color: colors.primary, emoji: '📐',
    description: 'Algebra, Geometry, Calculus and more',
    subTopics: ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
  },
  {
    id: 'science', name: 'Science', icon: 'flask-outline',
    color: colors.info, emoji: '🔬',
    description: 'Physics, Chemistry, Biology',
    subTopics: ['Physics', 'Chemistry', 'Biology', 'Environmental'],
  },
  {
    id: 'english', name: 'English', icon: 'book-outline',
    color: colors.success, emoji: '📖',
    description: 'Grammar, Writing, Literature',
    subTopics: ['Grammar', 'Writing', 'Literature', 'Comprehension'],
  },
  {
    id: 'coding', name: 'Coding', icon: 'code-slash-outline',
    color: colors.secondary, emoji: '💻',
    description: 'Python, Web Dev, App Dev',
    subTopics: ['Python', 'JavaScript', 'Web Dev', 'App Dev'],
  },
  {
    id: 'olympiad', name: 'Olympiad Prep', icon: 'trophy-outline',
    color: colors.accent, emoji: '🏆',
    description: 'IMO, NSO, IEO preparation',
    subTopics: ['IMO', 'NSO', 'IEO', 'NTSE'],
  },
  {
    id: 'competitive', name: 'Competitive Exams', icon: 'school-outline',
    color: colors.pink, emoji: '🎯',
    description: 'JEE, NEET, UPSC, Board Exams',
    subTopics: ['JEE', 'NEET', 'UPSC', 'Board Exams'],
  },
  {
    id: 'spoken', name: 'Spoken English', icon: 'mic-outline',
    color: colors.success, emoji: '🎤',
    description: 'Fluency, Pronunciation, Confidence',
    subTopics: ['Fluency', 'Pronunciation', 'Conversation', 'Accent'],
  },
  {
    id: 'personality', name: 'Personality Dev.', icon: 'person-outline',
    color: colors.secondary, emoji: '🌟',
    description: 'Leadership, Communication, Soft Skills',
    subTopics: ['Leadership', 'Communication', 'Confidence', 'Mindset'],
  },
];

const CourseCategoriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);
  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Stats strip */}
          <View style={styles.statsStrip}>
            {[
              { value: '8', label: 'Categories', icon: 'grid-outline', color: colors.secondary },
              { value: '0', label: 'Courses', icon: 'book-outline', color: colors.primary },
              { value: '0', label: 'Instructors', icon: 'school-outline', color: colors.success },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <Text style={styles.sectionLabel}>ALL CATEGORIES</Text>
          <View style={styles.grid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { width: CARD_W }]}
                onPress={() => navigation.navigate('CourseDetails', { categoryId: cat.id, categoryName: cat.name })}
                activeOpacity={0.82}
              >
                {/* Color bar */}
                <View style={[styles.colorBar, { backgroundColor: cat.color }]} />

                <View style={[styles.catIconWrap, { backgroundColor: cat.color + '15' }]}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text>

                <View style={styles.catSubTopics}>
                  {cat.subTopics.slice(0, 2).map(t => (
                    <View key={t} style={[styles.subTopicChip, { borderColor: cat.color + '40' }]}>
                      <Text style={[styles.subTopicText, { color: cat.color }]}>{t}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.catFooter}>
                  <Text style={styles.catCourseCount}>0 Courses</Text>
                  <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
                    <Text style={[styles.catBadgeText, { color: cat.color }]}>Soon</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Coming Soon banner */}
          <View style={styles.comingSoonBanner}>
            <Ionicons name="rocket-outline" size={20} color={colors.secondary} />
            <View style={styles.comingSoonText}>
              <Text style={styles.comingSoonTitle}>🚀 Marketplace Under Development</Text>
              <Text style={styles.comingSoonSub}>Progress: 85% · ETA: Q2 2027</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textWhite, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  statsStrip: { flexDirection: 'row', gap: 10 },
  statItem: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 5, ...shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary, textAlign: 'center' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, paddingHorizontal: 4,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden',
    paddingHorizontal: 14, paddingBottom: 14, ...shadows.card,
  },
  colorBar: { height: 4, marginHorizontal: -14, marginBottom: 14 },
  catIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  catEmoji: { fontSize: 26 },
  catName: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  catDesc: { fontSize: 11, color: colors.textSecondary, lineHeight: 16, marginBottom: 8 },
  catSubTopics: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  subTopicChip: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  subTopicText: { fontSize: 9, fontWeight: '700' },
  catFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catCourseCount: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  catBadgeText: { fontSize: 10, fontWeight: '800' },

  comingSoonBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.secondary + '12', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.secondary + '28',
  },
  comingSoonText: { flex: 1 },
  comingSoonTitle: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 2 },
  comingSoonSub: { fontSize: 12, color: colors.textSecondary },
});

export default CourseCategoriesScreen;
