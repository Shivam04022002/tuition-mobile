import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeocodedAddress, PlaceSuggestion } from '../../types/location';
import * as locationApi from '../../services/locationApi';

interface LocationSearchProps {
  onLocationSelected: (result: GeocodedAddress) => void;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
}

// Both calls go through the backend (`/api/location/places/*`), which holds
// the Google API key admins manage from Settings > Location services — no
// key is ever bundled into the app, and rotating it needs no rebuild.
async function fetchSuggestions(query: string): Promise<PlaceSuggestion[]> {
  if (query.length < 3) return [];

  try {
    const res = await locationApi.searchPlaces(query);
    return res.data || [];
  } catch {
    return [];
  }
}

async function fetchPlaceDetails(placeId: string): Promise<GeocodedAddress | null> {
  try {
    const res = await locationApi.getPlaceDetails(placeId);
    return res.data || null;
  } catch {
    return null;
  }
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelected,
  placeholder = 'Search for an area or address…',
  initialValue = '',
  disabled = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (text.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        setLoading(true);
        const results = await fetchSuggestions(text);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setLoading(false);
      }, 400);
    },
    []
  );

  const handleSelectSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setQuery(suggestion.mainText);
      setSuggestions([]);
      setShowDropdown(false);
      Keyboard.dismiss();

      setLoading(true);
      const details = await fetchPlaceDetails(suggestion.placeId);
      setLoading(false);

      if (details) {
        onLocationSelected(details);
      }
    },
    [onLocationSelected]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          editable={!disabled}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 200);
          }}
        />
        {loading ? (
          <ActivityIndicator size="small" color="#0F766E" style={styles.rightIcon} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.rightIcon}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={item => item.placeId}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  index === suggestions.length - 1 && styles.lastItem,
                ]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={16} color="#0F766E" style={styles.suggestionIcon} />
                <View style={styles.suggestionText}>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  rightIcon: {
    marginLeft: 8,
    padding: 2,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  secondaryText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default LocationSearch;
