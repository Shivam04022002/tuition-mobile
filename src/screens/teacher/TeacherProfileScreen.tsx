import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import {
  getTeacherProfile,
  toggleVacationMode,
  TeacherProfile,
} from '../../services/teacherApi';
import MapPicker from '../../components/maps/MapPicker';
import { Coordinates, MapRegion, TeacherPreferredLocation } from '../../types/location';

const TeacherProfileScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [togglingVacation, setTogglingVacation] = useState(false);
  const [preferredLocations, setPreferredLocations] = useState<TeacherPreferredLocation[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationArea, setNewLocationArea] = useState('');
  const [newLocationCity, setNewLocationCity] = useState('');
  const [newLocationCoords, setNewLocationCoords] = useState<Coordinates | null>(null);
  const [newLocationRadius, setNewLocationRadius] = useState(5);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const data = await getTeacherProfile(token);
      setProfile(data);
      if (data.locationAvailability?.preferredLocations?.length) {
        const raw = data.locationAvailability.preferredLocations as TeacherPreferredLocation[];
        const seen = new Set<string>();
        const deduped = raw.filter(loc => {
          const key = `${loc.area.trim().toLowerCase()}|${loc.city.trim().toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setPreferredLocations(deduped);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        Alert.alert('Session Expired', 'Please login again');
      } else {
        setError(err.message || 'Failed to load profile');
      }
      setLoading(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleToggleVacationMode = async () => {
    try {
      if (!token) return;
      setTogglingVacation(true);
      const result = await toggleVacationMode(token);
      Alert.alert(
        'Success',
        `Vacation mode ${result.vacationMode ? 'enabled' : 'disabled'}`
      );
      loadProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle vacation mode');
    } finally {
      setTogglingVacation(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const getVerificationBadgeColor = () => {
    switch (profile?.verificationStatus) {
      case 'verified':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textTertiary;
    }
  };

  const getVerificationIcon = () => {
    switch (profile?.verificationStatus) {
      case 'verified':
        return 'verified';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const getVerificationText = () => {
    switch (profile?.verificationStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Verification';
      case 'rejected':
        return 'Verification Rejected';
      default:
        return 'Unknown';
    }
  };

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    const total = 8;
    if (profile.basicDetails?.fullName && profile.basicDetails?.mobileNumber) score++;
    if (profile.education?.highestQualification) score++;
    if (profile.teachingDetails?.subjects?.length) score++;
    if (profile.teachingDetails?.classes?.length) score++;
    if (profile.teachingDetails?.boards?.length) score++;
    if (profile.locationAvailability?.availableDays?.length && profile.locationAvailability?.availableTimeSlots?.length) score++;
    if (profile.pricingRevenue?.hourlyRate || profile.pricingRevenue?.monthlyRate) score++;
    if (profile.verificationDocuments?.aadhaarCard || profile.verificationDocuments?.qualificationDocuments?.length) score++;
    return Math.round((score / total) * 100);
  }, [profile]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadProfile}
          style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="person-remove-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Profile not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <Card variant="elevated" margin="medium" style={styles.headerCard}>
        <View style={styles.profileHeader}>
          {/* Profile Photo */}
          <View style={[styles.photoContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            {profile.basicDetails?.profilePhoto ? (
              <Image 
                source={{ uri: profile.basicDetails.profilePhoto }} 
                style={styles.profilePhoto}
              />
            ) : (
              <Ionicons name="person" size={48} color={theme.colors.primary} />
            )}
          </View>
          
          {/* Name & Verification */}
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {profile.basicDetails?.fullName || 'Teacher'}
            </Text>
            <View style={[
              styles.verificationBadge,
              { backgroundColor: getVerificationBadgeColor() + '20' }
            ]}>
              <Ionicons 
                name="shield-checkmark-outline" 
                size={14} 
                color={getVerificationBadgeColor()} 
              />
              <Text style={[
                styles.verificationText,
                { color: getVerificationBadgeColor() }
              ]}>
                {getVerificationText()}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        <View style={styles.completionContainer}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionLabel, { color: theme.colors.textSecondary }]}>
              Profile Completion
            </Text>
            <Text style={[styles.completionValue, { color: theme.colors.primary }]}>
              {profileCompletion}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${profileCompletion}%`,
                  backgroundColor: theme.colors.primary
                }
              ]} 
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
              {profile.stats?.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
              Rating
            </Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
              {profile.stats?.totalReviews || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
              Reviews
            </Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
              {profile.stats?.totalStudents || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
              Students
            </Text>
          </View>
        </View>
      </Card>

      {/* Personal Information */}
      <Card variant="outlined" margin="medium" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Personal Information
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Mobile</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.basicDetails?.mobileNumber || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.basicDetails?.email || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Gender</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.basicDetails?.gender?.charAt(0).toUpperCase() + profile.basicDetails?.gender?.slice(1) || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Languages</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.basicDetails?.languages?.join(', ') || 'Not provided'}
          </Text>
        </View>
      </Card>

      {/* Professional Details */}
      <Card variant="outlined" margin="medium" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Professional Details
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Qualification</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.education?.highestQualification || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>University</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.education?.university || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Experience</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.pricingRevenue?.experienceYears || 0} years
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Subjects</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.teachingDetails?.subjects?.join(', ') || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Classes</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.teachingDetails?.classes?.join(', ') || 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Boards</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.teachingDetails?.boards?.join(', ') || 'Not provided'}
          </Text>
        </View>
      </Card>

      {/* Availability */}
      <Card variant="outlined" margin="medium" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Availability
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Available Days</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.locationAvailability?.availableDays?.join(', ') || 'Not set'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Time Slots</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.locationAvailability?.availableTimeSlots?.join(', ') || 'Not set'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>City</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.locationAvailability?.city || 'Not set'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Teaching Radius</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.locationAvailability?.teachingRadius || 0} km
          </Text>
        </View>
      </Card>

      {/* Preferred Service Locations */}
      <Card variant="outlined" margin="medium" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Service Areas
          </Text>
          <TouchableOpacity
            style={[styles.addLocationBtn, { backgroundColor: theme.colors.primary + '18' }]}
            onPress={() => setShowAddLocation(v => !v)}
          >
            <Ionicons
              name={showAddLocation ? 'close-outline' : 'add-outline'}
              size={18}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {preferredLocations.length === 0 && !showAddLocation && (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No service areas added yet. Add locations where you are willing to travel.
          </Text>
        )}

        {preferredLocations.map((loc, idx) => (
          <View key={idx} style={[styles.locationChip, { borderColor: theme.colors.border }]}>
            <Ionicons name="location-outline" size={14} color={theme.colors.primary} />
            <View style={styles.locationChipText}>
              <Text style={[styles.locationArea, { color: theme.colors.text }]}>{loc.area}</Text>
              <Text style={[styles.locationCity, { color: theme.colors.textSecondary }]}>
                {loc.city} · {loc.radiusKm} km radius
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPreferredLocations(prev => prev.filter((_, i) => i !== idx))}
            >
              <Ionicons name="close-circle-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {showAddLocation && (
          <View style={styles.addLocationForm}>
            <TextInput
              style={[styles.locationInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Area name (e.g. Lajpat Nagar)"
              placeholderTextColor={theme.colors.textTertiary}
              value={newLocationArea}
              onChangeText={setNewLocationArea}
            />
            <TextInput
              style={[styles.locationInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="City"
              placeholderTextColor={theme.colors.textTertiary}
              value={newLocationCity}
              onChangeText={setNewLocationCity}
            />
            <Text style={[styles.mapLabel, { color: theme.colors.textSecondary }]}>
              Pin exact location on map:
            </Text>
            <MapPicker
              initialCoordinates={newLocationCoords ?? undefined}
              radiusKm={newLocationRadius}
              onLocationSelected={(coords: Coordinates, _region: MapRegion) => setNewLocationCoords(coords)}
              label="Tap to pin service area centre"
              showRadius
              height={200}
            />
            <View style={styles.radiusRow}>
              <Text style={[styles.radiusLabel, { color: theme.colors.textSecondary }]}>Radius:</Text>
              {[2, 3, 5, 8, 10, 15].map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNewLocationRadius(r)}
                  style={[
                    styles.radiusChip,
                    {
                      backgroundColor: newLocationRadius === r ? theme.colors.primary : theme.colors.backgroundSecondary,
                      borderColor: newLocationRadius === r ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.radiusChipText, { color: newLocationRadius === r ? '#FFF' : theme.colors.text }]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveLocationBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                if (!newLocationArea.trim() || !newLocationCity.trim() || !newLocationCoords) {
                  Alert.alert('Incomplete', 'Please fill area, city and pin a location on the map.');
                  return;
                }
                const areaKey = `${newLocationArea.trim().toLowerCase()}|${newLocationCity.trim().toLowerCase()}`;
                const isDuplicate = preferredLocations.some(
                  loc => `${loc.area.trim().toLowerCase()}|${loc.city.trim().toLowerCase()}` === areaKey
                );
                if (isDuplicate) {
                  Alert.alert('Duplicate', 'This area and city combination already exists.');
                  return;
                }
                const newLoc: TeacherPreferredLocation = {
                  area: newLocationArea.trim(),
                  city: newLocationCity.trim(),
                  latitude: newLocationCoords.latitude,
                  longitude: newLocationCoords.longitude,
                  radiusKm: newLocationRadius,
                };
                setPreferredLocations(prev => [...prev, newLoc]);
                setNewLocationArea('');
                setNewLocationCity('');
                setNewLocationCoords(null);
                setNewLocationRadius(5);
                setShowAddLocation(false);
              }}
            >
              <Text style={styles.saveLocationBtnText}>Save Area</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Pricing */}
      <Card variant="outlined" margin="medium" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Pricing
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Hourly Rate</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            ₹{profile.pricingRevenue?.hourlyRate || 0}/hour
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Monthly Rate</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            ₹{profile.pricingRevenue?.monthlyRate || 0}/month
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Negotiation</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {profile.pricingRevenue?.negotiationAllowed ? 'Allowed' : 'Not Allowed'}
          </Text>
        </View>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card variant="outlined" margin="medium" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              About
            </Text>
          </View>
          <Text style={[styles.bioText, { color: theme.colors.text }]}>
            {profile.bio}
          </Text>
        </Card>
      )}

      {/* Vacation Mode */}
      <Card variant="outlined" margin="medium" style={styles.vacationCard}>
        <View style={styles.vacationRow}>
          <View style={styles.vacationInfo}>
            <Ionicons 
              name="sunny-outline" 
              size={24} 
              color={profile.locationAvailability?.vacationMode ? theme.colors.warning : theme.colors.primary} 
            />
            <View style={styles.vacationTextContainer}>
              <Text style={[styles.vacationTitle, { color: theme.colors.text }]}>
                Vacation Mode
              </Text>
              <Text style={[styles.vacationSubtitle, { color: theme.colors.textSecondary }]}>
                {profile.locationAvailability?.vacationMode 
                  ? 'You are currently on vacation' 
                  : 'Enable to pause receiving new leads'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.vacationToggle,
              { 
                backgroundColor: profile.locationAvailability?.vacationMode 
                  ? theme.colors.warning + '20'
                  : theme.colors.success + '20'
              }
            ]}
            onPress={handleToggleVacationMode}
            disabled={togglingVacation}
          >
            {togglingVacation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[
                styles.vacationToggleText,
                { 
                  color: profile.locationAvailability?.vacationMode 
                    ? theme.colors.warning
                    : theme.colors.success
                }
              ]}>
                {profile.locationAvailability?.vacationMode ? 'ON' : 'OFF'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Card>

      {/* Complete Profile Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.logoutButton, profileCompletion < 100 && { borderWidth: 1, borderColor: colors.primary + '40', borderRadius: 14 }]}
          onPress={() => navigation.navigate('TeacherOnboarding')}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.logoutText, { color: colors.primary }]}>
              {profileCompletion >= 100 ? 'View Onboarding' : 'Complete Profile'}
            </Text>
            {profileCompletion < 100 && (
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                {profileCompletion}% complete · Tap to continue
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary + '80'} />
        </TouchableOpacity>
      </View>

      {/* Teaching Preferences Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { borderWidth: 1, borderColor: colors.accent + '40', borderRadius: 14 }]}
          onPress={() => navigation.navigate('TeacherPreferences')}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="options-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.logoutText, { color: colors.accent }]}>Teaching Preferences</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
              Subjects · Classes · Boards · Modes
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent + '80'} />
        </TouchableOpacity>
      </View>

      {/* Availability Settings Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { borderWidth: 1, borderColor: colors.info + '40', borderRadius: 14 }]}
          onPress={() => navigation.navigate('TeacherAvailability')}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.logoutText, { color: colors.info }]}>Availability Settings</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
              Schedule · Time Slots · Discoverability
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.info + '80'} />
        </TouchableOpacity>
      </View>

      {/* Subscription Plans Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { borderWidth: 1, borderColor: colors.warning + '40', borderRadius: 14 }]}
          onPress={() => navigation.navigate('TeacherSubscription')}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="diamond-outline" size={20} color={colors.warning} />
          </View>
          <Text style={[styles.logoutText, { color: colors.warning }]}>Subscription Plans</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.warning + '80'} />
        </TouchableOpacity>
      </View>

      {/* Credits Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { borderWidth: 1, borderColor: colors.success + '40', borderRadius: 14 }]}
          onPress={() => navigation.navigate('TeacherCredits')}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.success} />
          </View>
          <Text style={[styles.logoutText, { color: colors.success }]}>Credits & Unlocks</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.success + '80'} />
        </TouchableOpacity>
      </View>

      {/* Course Marketplace Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate('CourseMarketplace', { role: 'teacher' })}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.secondary + '15' }]}>
            <Ionicons name="storefront-outline" size={20} color={colors.secondary} />
          </View>
          <Text style={[styles.logoutText, { color: colors.secondary }]}>Course Marketplace</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.secondary + '80'} />
        </TouchableOpacity>
      </View>

      {/* Live Classes Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate('LiveClasses', { role: 'teacher' })}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="videocam-outline" size={20} color={colors.info} />
          </View>
          <Text style={[styles.logoutText, { color: colors.info }]}>Live Classes</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.info + '80'} />
        </TouchableOpacity>
      </View>

      {/* Wallet Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate('Wallet', { role: 'teacher' })}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.success} />
          </View>
          <Text style={[styles.logoutText, { color: colors.success }]}>Wallet</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.success + '80'} />
        </TouchableOpacity>
      </View>

      {/* Settings Button */}
      <View style={[styles.logoutSection, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate('Settings', { role: 'teacher' })}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="settings-outline" size={20} color={colors.info} />
          </View>
          <Text style={[styles.logoutText, { color: colors.info }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.info + '80'} />
        </TouchableOpacity>
      </View>

      {/* Support Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={[styles.logoutButton, { marginBottom: 10 }]}
          onPress={() => navigation.navigate('Support', { role: 'teacher' })}
          activeOpacity={0.82}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="headset-outline" size={20} color={colors.success} />
          </View>
          <Text style={[styles.logoutText, { color: colors.success }]}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.success + '80'} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.82}
        >
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.error + '80'} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  nameContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completionContainer: {
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 14,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  vacationCard: {
    padding: 16,
    borderRadius: 12,
  },
  vacationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vacationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vacationTextContainer: {
    flex: 1,
  },
  vacationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vacationSubtitle: {
    fontSize: 13,
  },
  vacationToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  vacationToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSection: { paddingHorizontal: 16, marginTop: 8 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 15,
    ...shadows.card,
  },
  logoutIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.error + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.error },
  bottomPadding: {
    height: 100,
  },
  addLocationBtn: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  locationChipText: {
    flex: 1,
  },
  locationArea: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationCity: {
    fontSize: 12,
    marginTop: 2,
  },
  addLocationForm: {
    gap: 10,
    paddingTop: 8,
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
  },
  mapLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  radiusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveLocationBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveLocationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TeacherProfileScreen;
