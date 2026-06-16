import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useTeacherAvailability } from '../../hooks/useTeacherAvailability';
import { AvailabilityCalendar } from '../../components/teacher/AvailabilityCalendar';
import { TimeSlotEditor } from '../../components/teacher/TimeSlotEditor';
import { LocationCoverageCard } from '../../components/teacher/LocationCoverageCard';
import { DiscoverabilityCard } from '../../components/teacher/DiscoverabilityCard';

export const TeacherAvailabilityScreen: React.FC = () => {
  const {
    availability,
    discoverability,
    matchingEligibility,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    saveError,
    refresh,
    retry,
    updateAvailabilityData,
    addTimeSlot,
    updateTimeSlot,
    removeTimeSlot,
    toggleDay,
    updateTimeSlotForDay,
    updateMaxStudents,
    toggleVacationMode,
    updateDiscoverabilityData,
    toggleAvailableForNewStudents,
    toggleVisibleInMarketplace,
    updateOnlineStatus,
    updateTravelSettings,
    updateLocationCoverage,
    clearSaveError,
    validateAvailability,
  } = useTeacherAvailability();

  const [selectedDay, setSelectedDay] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'calendar' | 'timeslots' | 'location' | 'discoverability'>('calendar');

  // Reset selected day when availability changes
  useEffect(() => {
    if (availability?.availableDays && availability?.availableDays.length > 0) {
      if (!selectedDay || !availability.availableDays.includes(selectedDay)) {
        setSelectedDay(availability.availableDays[0]);
      }
    } else {
      setSelectedDay('');
    }
  }, [availability, selectedDay]);

  // Refresh screen when focused
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleSaveAll = useCallback(async () => {
    if (!availability || !discoverability) {
      Alert.alert('Error', 'Data not loaded yet');
      return;
    }

    // Validate availability
    const validationErrors = validateAvailability();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }

    try {
      // Save everything
      await Promise.all([
        updateAvailabilityData(availability),
        updateDiscoverabilityData(discoverability),
      ]);

      Alert.alert('Success', 'Your availability settings have been saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    }
  }, [availability, discoverability, validateAvailability, updateAvailabilityData, updateDiscoverabilityData]);

  const handleSectionPress = useCallback((section: typeof activeSection) => {
    setActiveSection(section);
  }, []);

  const getSectionIcon = useCallback((section: string): keyof typeof Ionicons.glyphMap => {
    switch (section) {
      case 'calendar': return 'calendar';
      case 'timeslots': return 'time';
      case 'location': return 'location';
      case 'discoverability': return 'eye';
      default: return 'help';
    }
  }, []);

  const getSectionTitle = useCallback((section: string): string => {
    switch (section) {
      case 'calendar': return 'Weekly Schedule';
      case 'timeslots': return 'Time Slots';
      case 'location': return 'Location Coverage';
      case 'discoverability': return 'Discoverability';
      default: return 'Unknown';
    }
  }, []);

  const renderSectionNavigation = useCallback(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sectionNavigation}
      contentContainerStyle={styles.sectionNavigationContent}
    >
      {(['calendar', 'timeslots', 'location', 'discoverability'] as const).map((section) => (
        <TouchableOpacity
          key={section}
          style={[
            styles.sectionNavButton,
            {
              backgroundColor: activeSection === section ? colors.primary : colors.background,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => handleSectionPress(section)}
        >
          <Ionicons
            name={getSectionIcon(section)}
            size={16}
            color={activeSection === section ? 'white' : colors.primary}
          />
          <Text
            style={[
              styles.sectionNavText,
              {
                color: activeSection === section ? 'white' : colors.primary,
              },
            ]}
          >
            {getSectionTitle(section)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  ), [activeSection, colors, handleSectionPress, getSectionIcon, getSectionTitle]);

  const renderContent = useCallback(() => {
    if (error && !availability) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Failed to Load
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={retry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!availability || !discoverability) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading availability data...
          </Text>
        </View>
      );
    }

    switch (activeSection) {
      case 'calendar':
        return (
          <AvailabilityCalendar
            weeklySchedule={availability.weeklySchedule}
            onToggleDay={toggleDay}
            onSelectDay={setSelectedDay}
            selectedDay={selectedDay}
            isLoading={isSaving}
          />
        );

      case 'timeslots':
        return (
          <TimeSlotEditor
            timeSlots={availability.customTimeSlots}
            dayTimeSlots={availability.weeklySchedule[selectedDay]?.timeSlots || []}
            onAddTimeSlot={addTimeSlot}
            onUpdateTimeSlot={updateTimeSlot}
            onRemoveTimeSlot={removeTimeSlot}
            onUpdateDayTimeSlots={(slotIds) => updateTimeSlotForDay(selectedDay, slotIds)}
            isLoading={isSaving}
            selectedDay={selectedDay}
          />
        );

      case 'location':
        return (
          <LocationCoverageCard
            locationCoverage={discoverability.locationCoverage}
            travelSettings={discoverability.travelSettings}
            onUpdateLocationCoverage={updateLocationCoverage}
            onUpdateTravelSettings={updateTravelSettings}
            isLoading={isSaving}
          />
        );

      case 'discoverability':
        return (
          <DiscoverabilityCard
            discoverability={discoverability}
            matchingEligibility={matchingEligibility}
            onUpdateDiscoverability={updateDiscoverabilityData}
            isLoading={isSaving}
          />
        );

      default:
        return null;
    }
  }, [
    error,
    availability,
    discoverability,
    colors,
    activeSection,
    selectedDay,
    matchingEligibility,
    isSaving,
    toggleDay,
    addTimeSlot,
    updateTimeSlot,
    removeTimeSlot,
    updateTimeSlotForDay,
    updateLocationCoverage,
    updateTravelSettings,
    updateDiscoverabilityData,
    retry,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Availability Settings
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your teaching schedule and visibility
        </Text>

        {/* Status Bar */}
        {matchingEligibility && (
          <View style={[
            styles.statusBar,
            {
              backgroundColor: matchingEligibility.isEligible 
                ? colors.success + '20' 
                : colors.warning + '20',
              borderColor: matchingEligibility.isEligible 
                ? colors.success 
                : colors.warning,
            },
          ]}>
            <Ionicons
              name={matchingEligibility.isEligible ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={matchingEligibility.isEligible ? colors.success : colors.warning}
            />
            <Text style={[
              styles.statusText,
              {
                color: matchingEligibility.isEligible ? colors.success : colors.warning,
              },
            ]}>
              {matchingEligibility.isEligible 
                ? 'Eligible for matching' 
                : 'Not eligible for matching'}
            </Text>
          </View>
        )}
      </View>

      {/* Section Navigation */}
      {renderSectionNavigation()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}

        {/* Save Error Banner */}
        {saveError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '10' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>
              {saveError}
            </Text>
            <TouchableOpacity onPress={clearSaveError}>
              <Ionicons name="close" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Save Button */}
      {availability && discoverability && (
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: isSaving ? colors.textSecondary : colors.primary,
            },
          ]}
          onPress={handleSaveAll}
          disabled={isSaving}
        >
          <Ionicons name="save" size={20} color="white" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionNavigation: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionNavigationContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  sectionNavText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Space for floating button
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    marginTop: 0,
  },
  errorBannerText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
