import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { CustomTimeSlot, DEFAULT_TIME_SLOTS } from '../../services/teacherAvailabilityApi';

interface TimeSlotEditorProps {
  timeSlots: CustomTimeSlot[];
  dayTimeSlots: string[];
  onAddTimeSlot: (timeSlot: Omit<CustomTimeSlot, 'id'>) => Promise<void>;
  onUpdateTimeSlot: (id: string, timeSlot: Partial<CustomTimeSlot>) => Promise<void>;
  onRemoveTimeSlot: (id: string) => Promise<void>;
  onUpdateDayTimeSlots: (timeSlotIds: string[]) => Promise<void>;
  isLoading?: boolean;
  selectedDay?: string;
}

export const TimeSlotEditor: React.FC<TimeSlotEditorProps> = ({
  timeSlots,
  dayTimeSlots,
  onAddTimeSlot,
  onUpdateTimeSlot,
  onRemoveTimeSlot,
  onUpdateDayTimeSlots,
  isLoading = false,
  selectedDay,
}) => {
  const [newSlot, setNewSlot] = useState({
    label: '',
    startTime: '',
    endTime: '',
    isActive: true,
  });
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const availableTimeSlots = useMemo(() => {
    return timeSlots.filter(slot => slot.isActive);
  }, [timeSlots]);

  const selectedTimeSlots = useMemo(() => {
    return timeSlots.filter(slot => dayTimeSlots.includes(slot.id));
  }, [timeSlots, dayTimeSlots]);

  const handleAddTimeSlot = useCallback(async () => {
    if (!newSlot.label.trim() || !newSlot.startTime || !newSlot.endTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await onAddTimeSlot(newSlot);
      setNewSlot({ label: '', startTime: '', endTime: '', isActive: true });
      setShowAddForm(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add time slot');
    }
  }, [newSlot, onAddTimeSlot, fadeAnim]);

  const handleUpdateSlot = useCallback(async (id: string, updates: Partial<CustomTimeSlot>) => {
    try {
      await onUpdateTimeSlot(id, updates);
      setEditingSlot(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update time slot');
    }
  }, [onUpdateTimeSlot]);

  const handleRemoveSlot = useCallback(async (id: string) => {
    Alert.alert(
      'Remove Time Slot',
      'Are you sure you want to remove this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveTimeSlot(id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove time slot');
            }
          },
        },
      ]
    );
  }, [onRemoveTimeSlot]);

  const handleUseTemplate = useCallback((template: typeof DEFAULT_TIME_SLOTS[0]) => {
    setNewSlot({
      label: template.label,
      startTime: template.startTime,
      endTime: template.endTime,
      isActive: true,
    });
  }, []);

  const toggleTimeSlotForDay = useCallback((slotId: string) => {
    const updatedSlots = dayTimeSlots.includes(slotId)
      ? dayTimeSlots.filter(id => id !== slotId)
      : [...dayTimeSlots, slotId];
    
    onUpdateDayTimeSlots(updatedSlots);
  }, [dayTimeSlots, onUpdateDayTimeSlots]);

  const toggleAddForm = useCallback(() => {
    if (showAddForm) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowAddForm(false));
    } else {
      setShowAddForm(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showAddForm, fadeAnim]);

  const renderTimeSlot = useCallback((slot: CustomTimeSlot) => {
    const isEditing = editingSlot === slot.id;
    const isSelectedForDay = dayTimeSlots.includes(slot.id);

    return (
      <View
        key={slot.id}
        style={[
          styles.timeSlotCard,
          {
            backgroundColor: colors.card,
            borderColor: isSelectedForDay ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.timeSlotHeader}>
          {isEditing ? (
            <TextInput
              style={[
                styles.labelInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={slot.label}
              onChangeText={(text) => handleUpdateSlot(slot.id, { label: text })}
              placeholder="Slot label"
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <Text style={[styles.timeSlotLabel, { color: colors.text }]}>
              {slot.label}
            </Text>
          )}
          
          <View style={styles.timeSlotActions}>
            {selectedDay && (
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    backgroundColor: isSelectedForDay ? colors.primary : colors.background,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => toggleTimeSlotForDay(slot.id)}
                disabled={isLoading}
              >
                <Ionicons
                  name={isSelectedForDay ? 'checkmark' : 'add'}
                  size={16}
                  color={isSelectedForDay ? 'white' : colors.primary}
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.background }]}
              onPress={() => setEditingSlot(isEditing ? null : slot.id)}
              disabled={isLoading}
            >
              <Ionicons
                name={isEditing ? 'checkmark' : 'create'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
              onPress={() => handleRemoveSlot(slot.id)}
              disabled={isLoading}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timeRange}>
          {isEditing ? (
            <View style={styles.timeInputs}>
              <TextInput
                style={[
                  styles.timeInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                value={slot.startTime}
                onChangeText={(text) => handleUpdateSlot(slot.id, { startTime: text })}
                placeholder="Start (HH:mm)"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={[styles.timeSeparator, { color: colors.text }]}>to</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                value={slot.endTime}
                onChangeText={(text) => handleUpdateSlot(slot.id, { endTime: text })}
                placeholder="End (HH:mm)"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
            </View>
          ) : (
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {slot.startTime} - {slot.endTime}
            </Text>
          )}
        </View>
      </View>
    );
  }, [
    editingSlot,
    dayTimeSlots,
    selectedDay,
    colors,
    isLoading,
    handleUpdateSlot,
    toggleTimeSlotForDay,
    handleRemoveSlot,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Time Slots
        </Text>
        {selectedDay && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {selectedDay} - {selectedTimeSlots.length} selected
          </Text>
        )}
      </View>

      <ScrollView style={styles.timeSlotsList} showsVerticalScrollIndicator={false}>
        {availableTimeSlots.map(renderTimeSlot)}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={toggleAddForm}
        disabled={isLoading}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Time Slot</Text>
      </TouchableOpacity>

      {showAddForm && (
        <Animated.View
          style={[
            styles.addForm,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={[styles.formTitle, { color: colors.text }]}>
            Add New Time Slot
          </Text>

          <View style={styles.templates}>
            <Text style={[styles.templatesTitle, { color: colors.textSecondary }]}>
              Quick Templates:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DEFAULT_TIME_SLOTS.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.templateChip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => handleUseTemplate(template)}
                >
                  <Text style={[styles.templateText, { color: colors.textSecondary }]}>
                    {template.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={newSlot.label}
            onChangeText={(text) => setNewSlot({ ...newSlot, label: text })}
            placeholder="Slot label (e.g., Morning Session)"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.timeInputs}>
            <TextInput
              style={[
                styles.timeInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={newSlot.startTime}
              onChangeText={(text) => setNewSlot({ ...newSlot, startTime: text })}
              placeholder="Start (HH:mm)"
              placeholderTextColor={colors.textSecondary}
              maxLength={5}
            />
            <Text style={[styles.timeSeparator, { color: colors.text }]}>to</Text>
            <TextInput
              style={[
                styles.timeInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={newSlot.endTime}
              onChangeText={(text) => setNewSlot({ ...newSlot, endTime: text })}
              placeholder="End (HH:mm)"
              placeholderTextColor={colors.textSecondary}
              maxLength={5}
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={toggleAddForm}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleAddTimeSlot}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Add Slot</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  timeSlotsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  timeSlotCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSlotLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  labelInput: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeSlotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRange: {
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addForm: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  templates: {
    marginBottom: 16,
  },
  templatesTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  templateText: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
