import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTeacherPreferences } from '../../hooks/useTeacherPreferences';
import SubjectsSelector from '../../components/teacher/SubjectsSelector';
import ClassesSelector from '../../components/teacher/ClassesSelector';
import BoardsSelector from '../../components/teacher/BoardsSelector';
import TeachingModesSelector from '../../components/teacher/TeachingModesSelector';
import ExperienceMatrix from '../../components/teacher/ExperienceMatrix';
import { SubjectExperience } from '../../services/teacherPreferencesApi';

type SectionKey =
  | 'subjects'
  | 'classes'
  | 'boards'
  | 'modes'
  | 'experience';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string; color: string }> = [
  { key: 'subjects', label: 'Subjects', icon: 'book-outline', color: colors.primary },
  { key: 'classes', label: 'Classes', icon: 'school-outline', color: colors.secondary },
  { key: 'boards', label: 'Boards', icon: 'ribbon-outline', color: colors.info },
  { key: 'modes', label: 'Modes & Types', icon: 'options-outline', color: colors.success },
  { key: 'experience', label: 'Experience', icon: 'star-outline', color: colors.warning },
];

const TeacherPreferencesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const {
    preferences,
    referenceData,
    classesData,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    saveError,
    refresh,
    retry,
    savePreferences,
    clearSaveError,
  } = useTeacherPreferences();

  const [activeSection, setActiveSection] = useState<SectionKey>('subjects');

  // Local draft state — applied on Save
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [boards, setBoards] = useState<string[]>([]);
  const [teachingModes, setTeachingModes] = useState<string[]>([]);
  const [studentTypes, setStudentTypes] = useState<string[]>([]);
  const [teachingLevel, setTeachingLevel] = useState<string[]>([]);
  const [examPreparation, setExamPreparation] = useState<string[]>([]);
  const [subjectExperience, setSubjectExperience] = useState<SubjectExperience[]>([]);
  const [initialised, setInitialised] = useState(false);

  // Sync from server on first load
  React.useEffect(() => {
    if (preferences && !initialised) {
      setSubjects(preferences.subjects);
      setClasses(preferences.classes);
      setBoards(preferences.boards);
      setTeachingModes(preferences.teachingModes);
      setStudentTypes(preferences.studentTypes);
      setTeachingLevel(preferences.teachingLevel);
      setExamPreparation(preferences.examPreparation);
      setSubjectExperience(preferences.subjectExperience);
      const known = referenceData.subjects;
      setCustomSubjects(preferences.subjects.filter(s => !known.includes(s)));
      setInitialised(true);
    }
  }, [preferences, initialised, referenceData.subjects]);

  // Completion scoring
  const completionItems = useMemo(() => [
    { label: 'Subjects', done: subjects.length > 0, points: 10 },
    { label: 'Classes', done: classes.length > 0, points: 10 },
    { label: 'Boards', done: boards.length > 0, points: 5 },
    { label: 'Teaching Mode', done: teachingModes.length > 0, points: 5 },
    { label: 'Student Types', done: studentTypes.length > 0, points: 5 },
  ], [subjects, classes, boards, teachingModes, studentTypes]);

  const totalPoints = completionItems.reduce((s, i) => s + (i.done ? i.points : 0), 0);
  const maxPoints = completionItems.reduce((s, i) => s + i.points, 0);

  // Validation
  const validate = (): string | null => {
    if (subjects.length === 0) return 'Please select at least one subject';
    if (classes.length === 0) return 'Please select at least one class group';
    if (teachingModes.length === 0) return 'Please select at least one teaching mode';
    return null;
  };

  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }

    const ok = await savePreferences({
      subjects,
      classes,
      boards,
      teachingModes,
      studentTypes,
      teachingLevel,
      examPreparation,
      subjectExperience,
    });

    if (ok) {
      if (__DEV__) console.log('[TeacherPreferences] Preferences Updated');
      Alert.alert(
        'Saved!',
        'Your teaching preferences have been updated. This improves your match quality with parents.',
        [{ text: 'Great', style: 'default' }]
      );
    }
  }, [
    subjects, classes, boards, teachingModes, studentTypes,
    teachingLevel, examPreparation, subjectExperience, savePreferences,
  ]);

  const handleCustomSubjectAdd = useCallback((subject: string) => {
    setCustomSubjects(prev => prev.includes(subject) ? prev : [...prev, subject]);
  }, []);

  const getSectionCount = useCallback((key: SectionKey): number => {
    switch (key) {
      case 'subjects': return subjects.length;
      case 'classes': return classes.length;
      case 'boards': return boards.length;
      case 'modes': return teachingModes.length + studentTypes.length + teachingLevel.length + examPreparation.length;
      case 'experience': return subjectExperience.filter(e => e.yearsExperience > 0).length;
      default: return 0;
    }
  }, [subjects, classes, boards, teachingModes, studentTypes, teachingLevel, examPreparation, subjectExperience]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.centreBox, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  // Error state
  if (error && !preferences) {
    return (
      <View style={[styles.centreBox, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={retry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Teaching Preferences</Text>
          <Text style={styles.headerSubtitle}>Powers matching & search results</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Completion progress bar */}
      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(totalPoints / maxPoints) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          +{totalPoints}% profile boost
        </Text>
      </View>

      {/* Save error banner */}
      {saveError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.error} />
          <Text style={styles.errorBannerText} numberOfLines={2}>{saveError}</Text>
          <TouchableOpacity onPress={clearSaveError}>
            <Ionicons name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {SECTIONS.map((section) => {
          const count = getSectionCount(section.key);
          const isActive = activeSection === section.key;
          return (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.tab,
                isActive && { backgroundColor: section.color, borderColor: section.color },
              ]}
              onPress={() => setActiveSection(section.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={section.icon as any}
                size={15}
                color={isActive ? colors.textWhite : section.color}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {section.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : section.color }]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeSection === 'subjects' && (
          <View>
            <SectionHeader
              icon="book-outline"
              color={colors.primary}
              title="Subjects You Teach"
              subtitle="Select from the list or add custom subjects"
            />
            <SubjectsSelector
              allSubjects={referenceData.subjects}
              selected={subjects}
              onChange={setSubjects}
              customSubjects={customSubjects}
              onCustomSubjectAdd={handleCustomSubjectAdd}
            />
          </View>
        )}

        {activeSection === 'classes' && (
          <View>
            <SectionHeader
              icon="school-outline"
              color={colors.secondary}
              title="Classes You Teach"
              subtitle="Select individual classes or entire groups"
            />
            <ClassesSelector
              classGroups={classesData.classGroups}
              selected={classes}
              onChange={setClasses}
            />
          </View>
        )}

        {activeSection === 'boards' && (
          <View>
            <SectionHeader
              icon="ribbon-outline"
              color={colors.info}
              title="Preferred Boards"
              subtitle="Select the curriculum boards you teach"
            />
            <BoardsSelector
              boards={referenceData.boards}
              selected={boards}
              onChange={setBoards}
            />
          </View>
        )}

        {activeSection === 'modes' && (
          <View>
            <SectionHeader
              icon="options-outline"
              color={colors.success}
              title="Teaching Modes & Preferences"
              subtitle="Configure how you teach and who you prefer to teach"
            />
            <TeachingModesSelector
              selectedModes={teachingModes}
              selectedStudentTypes={studentTypes}
              selectedLevels={teachingLevel}
              selectedExamPrep={examPreparation}
              onModesChange={setTeachingModes}
              onStudentTypesChange={setStudentTypes}
              onLevelsChange={setTeachingLevel}
              onExamPrepChange={setExamPreparation}
            />
          </View>
        )}

        {activeSection === 'experience' && (
          <View>
            <SectionHeader
              icon="star-outline"
              color={colors.warning}
              title="Experience by Subject"
              subtitle="Set years of experience for each subject you teach"
            />
            <ExperienceMatrix
              subjects={subjects}
              subjectExperience={subjectExperience}
              onChange={setSubjectExperience}
            />
          </View>
        )}

        {/* Completion checklist */}
        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>Profile Completion Boost</Text>
          {completionItems.map(item => (
            <View key={item.label} style={styles.completionRow}>
              <Ionicons
                name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={item.done ? colors.success : colors.textTertiary}
              />
              <Text style={[styles.completionLabel, item.done && styles.completionLabelDone]}>
                {item.label}
              </Text>
              <Text style={[styles.completionPoints, item.done && styles.completionPointsDone]}>
                +{item.points}%
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating save button */}
      <View style={[styles.floatingSave, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.floatingSaveBtn, isSaving && styles.floatingSaveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={colors.textWhite} />
              <Text style={styles.floatingSaveBtnText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface SectionHeaderProps {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, color, title, subtitle }) => (
  <View style={[sectionHeaderStyles.container, { borderLeftColor: color }]}>
    <View style={[sectionHeaderStyles.iconBox, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View style={sectionHeaderStyles.text}>
      <Text style={sectionHeaderStyles.title}>{title}</Text>
      <Text style={sectionHeaderStyles.subtitle}>{subtitle}</Text>
    </View>
  </View>
);

const sectionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centreBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    ...shadows.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textWhite,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 56,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textWhite,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primaryDark,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    minWidth: 80,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
  },
  tabs: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textWhite,
  },
  tabBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textWhite,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 4,
  },
  completionCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  completionLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  completionLabelDone: {
    color: colors.text,
    fontWeight: '500',
  },
  completionPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  completionPointsDone: {
    color: colors.success,
  },
  floatingSave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(248,250,252,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  floatingSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    ...shadows.md,
  },
  floatingSaveBtnDisabled: {
    opacity: 0.6,
  },
  floatingSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textWhite,
  },
});

export default TeacherPreferencesScreen;
