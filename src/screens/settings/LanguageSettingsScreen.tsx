import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  available: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', available: true },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', available: true },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳', available: false },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳', available: false },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳', available: false },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳', available: false },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', flag: '🇮🇳', available: false },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', flag: '🇮🇳', available: false },
];

const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [selected, setSelected] = useState<string>('en');

  const available = LANGUAGES.filter(l => l.available);
  const comingSoon = LANGUAGES.filter(l => !l.available);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current */}
        <View style={styles.currentCard}>
          <View style={styles.currentIconWrap}>
            <Text style={styles.currentFlag}>
              {LANGUAGES.find(l => l.code === selected)?.flag ?? '🌐'}
            </Text>
          </View>
          <View>
            <Text style={styles.currentLabel}>Current Language</Text>
            <Text style={styles.currentValue}>
              {LANGUAGES.find(l => l.code === selected)?.label ?? 'English'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>AVAILABLE LANGUAGES</Text>
        <View style={styles.card}>
          {available.map((lang, idx) => (
            <React.Fragment key={lang.code}>
              <TouchableOpacity
                style={styles.langRow}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.72}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langText}>
                  <Text style={styles.langLabel}>{lang.label}</Text>
                  <Text style={styles.langNative}>{lang.nativeLabel}</Text>
                </View>
                <View style={[
                  styles.radio,
                  selected === lang.code && styles.radioSelected,
                ]}>
                  {selected === lang.code && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>
              {idx < available.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>COMING SOON</Text>
        <View style={styles.card}>
          {comingSoon.map((lang, idx) => (
            <React.Fragment key={lang.code}>
              <View style={[styles.langRow, styles.disabledRow]}>
                <Text style={[styles.langFlag, styles.disabledFlag]}>{lang.flag}</Text>
                <View style={styles.langText}>
                  <Text style={[styles.langLabel, styles.disabledText]}>{lang.label}</Text>
                  <Text style={[styles.langNative, styles.disabledText]}>{lang.nativeLabel}</Text>
                </View>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              </View>
              {idx < comingSoon.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="globe-outline" size={16} color={colors.secondary} />
          <Text style={styles.noteText}>
            More regional languages are being added. We'll notify you when your language is available.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  currentCard: {
    backgroundColor: colors.primary + '12', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '30',
  },
  currentIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center',
    ...shadows.sm,
  },
  currentFlag: { fontSize: 26 },
  currentLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', marginBottom: 2 },
  currentValue: { fontSize: 17, fontWeight: '800', color: colors.primary },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4,
  },
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadows.card },

  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  disabledRow: { opacity: 0.5 },
  langFlag: { fontSize: 26, width: 36, textAlign: 'center' },
  disabledFlag: { opacity: 0.6 },
  langText: { flex: 1 },
  langLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  langNative: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  disabledText: { color: colors.textTertiary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  comingSoonBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  comingSoonText: { fontSize: 11, fontWeight: '700', color: colors.accent },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.secondary + '12', padding: 14, borderRadius: 14, marginTop: 20,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.secondary, lineHeight: 19, fontWeight: '500' },
});

export default LanguageSettingsScreen;
