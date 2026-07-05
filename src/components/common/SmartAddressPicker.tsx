import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import * as locationApi from '../../services/locationApi';

interface LocationSelection {
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface SmartAddressPickerProps {
  address: string;
  city: string;
  pincode: string;
  onAddressTextChange: (text: string) => void;
  onCityChange: (text: string) => void;
  onPincodeChange: (text: string) => void;
  onLocationSelect: (data: LocationSelection) => void;
  errors?: { address?: string; city?: string; pincode?: string };
}

const SEARCH_DEBOUNCE_MS = 400;

const SmartAddressPicker: React.FC<SmartAddressPickerProps> = ({
  address,
  city,
  pincode,
  onAddressTextChange,
  onCityChange,
  onPincodeChange,
  onLocationSelect,
  errors,
}) => {
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState<locationApi.PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddressChange = (text: string) => {
    onAddressTextChange(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await locationApi.searchPlaces(text.trim());
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSelectSuggestion = async (suggestion: locationApi.PlaceSuggestion) => {
    setShowSuggestions(false);
    setIsSearching(true);
    try {
      const res = await locationApi.getPlaceDetails(suggestion.placeId);
      const details = res.data;
      onLocationSelect({
        address: details.formattedAddress,
        city: details.city,
        pincode: details.pincode,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    } catch {
      Alert.alert('Error', 'Could not load details for that address. Please try another.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to use your current location.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      const res = await locationApi.reverseGeocodeCoords(latitude, longitude);
      const result = res.data;
      onLocationSelect({
        address: result.formattedAddress,
        city: result.city,
        pincode: result.pincode,
        latitude,
        longitude,
      });
    } catch {
      Alert.alert('Error', 'Could not fetch your current location. Please enter your address manually.');
    } finally {
      setIsLocating(false);
    }
  }, [onLocationSelect]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.currentLocationBtn, { borderColor: theme.colors.primary }]}
        onPress={handleUseCurrentLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons name="locate" size={18} color={theme.colors.primary} />
        )}
        <Text style={[styles.currentLocationText, { color: theme.colors.primary }]}>
          Use My Current Location
        </Text>
      </TouchableOpacity>

      <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>or type your address</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Start typing your address..."
          placeholderTextColor={theme.colors.textLight}
          value={address}
          onChangeText={handleAddressChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          multiline
        />
        {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.searchSpinner} />}
      </View>
      {!!errors?.address && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.address}</Text>}

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {suggestions.map(s => (
            <TouchableOpacity key={s.placeId} style={styles.suggestionRow} onPress={() => handleSelectSuggestion(s)}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.suggestionMain, { color: theme.colors.text }]}>{s.mainText}</Text>
                {!!s.secondaryText && (
                  <Text style={[styles.suggestionSecondary, { color: theme.colors.textSecondary }]}>{s.secondaryText}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>City</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            value={city}
            onChangeText={onCityChange}
            placeholder="City"
            placeholderTextColor={theme.colors.textLight}
          />
          {!!errors?.city && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.city}</Text>}
        </View>
        <View style={styles.halfInput}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Pincode</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            value={pincode}
            onChangeText={t => onPincodeChange(t.replace(/[^0-9]/g, ''))}
            placeholder="6 digits"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="numeric"
            maxLength={6}
          />
          {!!errors?.pincode && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.pincode}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  currentLocationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, marginBottom: 10,
  },
  currentLocationText: { fontSize: 14, fontWeight: '700' },
  orText: { textAlign: 'center', fontSize: 12, marginBottom: 10 },
  inputWrapper: { position: 'relative' },
  input: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, marginBottom: 4,
  },
  searchSpinner: { position: 'absolute', right: 14, top: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  errorText: { fontSize: 12, marginBottom: 8 },
  suggestionsBox: {
    borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  suggestionMain: { fontSize: 14, fontWeight: '600' },
  suggestionSecondary: { fontSize: 12, marginTop: 1 },
  rowInputs: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfInput: { flex: 1 },
});

export default SmartAddressPicker;
