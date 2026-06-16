import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { TRAVEL_DISTANCE_OPTIONS, TRAVEL_MODE_OPTIONS } from '../../services/teacherAvailabilityApi';

interface LocationCoverage {
  state: string;
  city: string;
  areas: string[];
  pincodes: string[];
}

interface TravelSettings {
  maxTravelDistance: number;
  preferredTravelModes: string[];
}

interface LocationCoverageCardProps {
  locationCoverage: LocationCoverage;
  travelSettings: TravelSettings;
  onUpdateLocationCoverage: (coverage: Partial<LocationCoverage>) => Promise<void>;
  onUpdateTravelSettings: (settings: Partial<TravelSettings>) => Promise<void>;
  isLoading?: boolean;
}

export const LocationCoverageCard: React.FC<LocationCoverageCardProps> = ({
  locationCoverage,
  travelSettings,
  onUpdateLocationCoverage,
  onUpdateTravelSettings,
  isLoading = false,
}) => {
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [newPincode, setNewPincode] = useState('');

  const handleAddArea = useCallback(async () => {
    if (!newArea.trim()) {
      Alert.alert('Error', 'Please enter an area name');
      return;
    }

    try {
      await onUpdateLocationCoverage({
        areas: [...locationCoverage.areas, newArea.trim()],
      });
      setNewArea('');
      setShowAreaModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add area');
    }
  }, [newArea, locationCoverage.areas, onUpdateLocationCoverage]);

  const handleRemoveArea = useCallback(async (index: number) => {
    Alert.alert(
      'Remove Area',
      'Are you sure you want to remove this area?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAreas = locationCoverage.areas.filter((_, i) => i !== index);
              await onUpdateLocationCoverage({ areas: updatedAreas });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove area');
            }
          },
        },
      ]
    );
  }, [locationCoverage.areas, onUpdateLocationCoverage]);

  const handleAddPincode = useCallback(async () => {
    if (!newPincode.trim() || !/^\d{6}$/.test(newPincode.trim())) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    try {
      await onUpdateLocationCoverage({
        pincodes: [...locationCoverage.pincodes, newPincode.trim()],
      });
      setNewPincode('');
      setShowPincodeModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add pincode');
    }
  }, [newPincode, locationCoverage.pincodes, onUpdateLocationCoverage]);

  const handleRemovePincode = useCallback(async (index: number) => {
    Alert.alert(
      'Remove Pincode',
      'Are you sure you want to remove this pincode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPincodes = locationCoverage.pincodes.filter((_, i) => i !== index);
              await onUpdateLocationCoverage({ pincodes: updatedPincodes });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove pincode');
            }
          },
        },
      ]
    );
  }, [locationCoverage.pincodes, onUpdateLocationCoverage]);

  const handleUpdateTravelDistance = useCallback(async (distance: number) => {
    try {
      await onUpdateTravelSettings({ maxTravelDistance: distance });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update travel distance');
    }
  }, [onUpdateTravelSettings]);

  const handleToggleTravelMode = useCallback(async (mode: string) => {
    const currentModes = travelSettings.preferredTravelModes || [];
    const updatedModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];

    try {
      await onUpdateTravelSettings({ preferredTravelModes: updatedModes });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update travel modes');
    }
  }, [travelSettings.preferredTravelModes, onUpdateTravelSettings]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Location Coverage
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Define where you teach
        </Text>
      </View>

      {/* Basic Location Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Basic Location
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>State</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={locationCoverage.state}
            onChangeText={(text) => onUpdateLocationCoverage({ state: text })}
            placeholder="Enter state"
            placeholderTextColor={colors.textSecondary}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={locationCoverage.city}
            onChangeText={(text) => onUpdateLocationCoverage({ city: text })}
            placeholder="Enter city"
            placeholderTextColor={colors.textSecondary}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Travel Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Travel Settings
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Maximum Travel Distance
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TRAVEL_DISTANCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.distanceChip,
                  {
                    backgroundColor: travelSettings.maxTravelDistance === option.value
                      ? colors.primary
                      : colors.background,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => handleUpdateTravelDistance(option.value)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.distanceText,
                    {
                      color: travelSettings.maxTravelDistance === option.value
                        ? 'white'
                        : colors.primary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Preferred Travel Modes
          </Text>
          <View style={styles.travelModesGrid}>
            {TRAVEL_MODE_OPTIONS.map((option) => {
              const isSelected = travelSettings.preferredTravelModes?.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.travelModeChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleToggleTravelMode(option.value)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={getTravelModeIcon(option.value)}
                    size={16}
                    color={isSelected ? 'white' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.travelModeText,
                      {
                        color: isSelected ? 'white' : colors.primary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Areas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Service Areas ({locationCoverage.areas.length})
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAreaModal(true)}
            disabled={isLoading}
          >
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {locationCoverage.areas.map((area, index) => (
            <View
              key={index}
              style={[
                styles.areaChip,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.areaText, { color: colors.text }]}>
                {area}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveArea(index)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={14} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Pincodes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Service Pincodes ({locationCoverage.pincodes.length})
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowPincodeModal(true)}
            disabled={isLoading}
          >
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {locationCoverage.pincodes.map((pincode, index) => (
            <View
              key={index}
              style={[
                styles.pincodeChip,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.pincodeText, { color: colors.text }]}>
                {pincode}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePincode(index)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={14} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Add Area Modal */}
      <Modal
        visible={showAreaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAreaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Service Area
            </Text>
            
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={newArea}
              onChangeText={setNewArea}
              placeholder="Enter area name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowAreaModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddArea}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Pincode Modal */}
      <Modal
        visible={showPincodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPincodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Service Pincode
            </Text>
            
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={newPincode}
              onChangeText={setNewPincode}
              placeholder="Enter 6-digit pincode"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowPincodeModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddPincode}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getTravelModeIcon = (mode: string): keyof typeof Ionicons.glyphMap => {
  switch (mode) {
    case 'walking': return 'walk';
    case 'cycling': return 'bicycle';
    case 'public_transport': return 'bus';
    case 'car': return 'car';
    case 'bike': return 'bicycle';
    default: return 'help';
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  distanceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  travelModesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  travelModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  travelModeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  areaText: {
    fontSize: 14,
    marginRight: 6,
  },
  pincodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  pincodeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginRight: 6,
  },
  removeButton: {
    padding: 2,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
