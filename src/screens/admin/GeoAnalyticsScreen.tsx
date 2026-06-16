import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { SectionHeader, StatsCard } from '../../components/ui';

const { width, height } = Dimensions.get('window');

// Types
interface CityData {
  city: string;
  requirements?: number;
  teachers?: number;
  matches?: number;
  avgBudget?: number;
  avgHourlyRate?: number;
  latitude?: number;
  longitude?: number;
  status: 'high-demand' | 'high-supply' | 'balanced';
  demandSupplyRatio: number;
}

interface SubjectData {
  subject: string;
  demand?: number;
  supply?: number;
  gap?: number;
  gapPercentage?: number;
  status: 'shortage' | 'surplus' | 'balanced';
  avgBudget?: number;
  avgHourlyRate?: number;
}

interface GrowthCity {
  city: string;
  last7Days: number;
  last30Days: number;
  last90Days: number;
  growthRate30d?: number;
}

interface GeoAnalyticsData {
  cities: CityData[];
  totalCities: number;
  highDemandCities: number;
  balancedCities: number;
  topShortages: SubjectData[];
  topSurpluses: SubjectData[];
  fastGrowingCities: GrowthCity[];
}

const GeoAnalyticsScreen: React.FC = () => {
  const token = useAppSelector(selectAuthToken);
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GeoAnalyticsData | null>(null);
  const [activeSection, setActiveSection] = useState<'cities' | 'subjects' | 'growth'>('cities');

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Fetch geography analytics
      const geoRes = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/admin/analytics/geography`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch subject analytics
      const subjectRes = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/admin/analytics/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch supply-demand analytics for growth data
      const growthRes = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/admin/analytics/supply-demand?days=90`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const [geoData, subjectData, growthData] = await Promise.all([
        geoRes.json(),
        subjectRes.json(),
        growthRes.json(),
      ]);

      if (geoData.success && subjectData.success && growthData.success) {
        setData({
          cities: geoData.data.cities,
          totalCities: geoData.data.totalCities,
          highDemandCities: geoData.data.highDemandCities,
          balancedCities: geoData.data.balancedCities,
          topShortages: subjectData.data.topShortages,
          topSurpluses: subjectData.data.topSurpluses,
          fastGrowingCities: growthData.data.fastGrowingCities,
        });
      } else {
        setError('Failed to fetch analytics data');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('GeoAnalytics error:', err);
      setError(err.message || 'Failed to load analytics');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high-demand':
      case 'shortage':
        return colors.error;
      case 'balanced':
        return colors.success;
      case 'high-supply':
      case 'surplus':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'high-demand': return 'High Demand';
      case 'high-supply': return 'High Supply';
      case 'balanced': return 'Balanced';
      case 'shortage': return 'Shortage';
      case 'surplus': return 'Surplus';
      default: return status;
    }
  };

  // Render map with city markers
  const renderMap = () => {
    if (!data?.cities || data.cities.length === 0) return null;

    const citiesWithCoords = data.cities.filter(c => c.latitude && c.longitude && c.latitude !== 0);
    
    if (citiesWithCoords.length === 0) {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.mapPlaceholderText}>No coordinate data available</Text>
        </View>
      );
    }

    const initialRegion = {
      latitude: citiesWithCoords[0].latitude || 28.6139,
      longitude: citiesWithCoords[0].longitude || 77.209,
      latitudeDelta: 15,
      longitudeDelta: 15,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          provider={Platform.OS === 'android' ? 'google' : undefined}
        >
          {citiesWithCoords.map((city, index) => (
            <Marker
              key={`${city.city}-${index}`}
              coordinate={{
                latitude: city.latitude || 28.6139,
                longitude: city.longitude || 77.209,
              }}
              title={city.city}
              description={`Req: ${city.requirements || 0}, Teachers: ${city.teachers || 0}`}
            >
              <View style={[
                styles.markerContainer,
                { backgroundColor: getStatusColor(city.status) }
              ]}>
                <Text style={styles.markerText}>{city.city.substring(0, 3).toUpperCase()}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>High Demand</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Balanced</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={styles.legendText}>High Supply</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render city analytics section
  const renderCityAnalytics = () => (
    <View style={styles.section}>
      <SectionHeader title="City Overview" icon="location-outline" />
      
      <View style={styles.statsGrid}>
        <StatsCard
          label="Total Cities"
          value={data?.totalCities || 0}
          icon="business-outline"
          bgColor={colors.primary}
          style={styles.statCard}
        />
        <StatsCard
          label="High Demand"
          value={data?.highDemandCities || 0}
          icon="trending-up-outline"
          bgColor={colors.error}
          style={styles.statCard}
        />
        <StatsCard
          label="Balanced"
          value={data?.balancedCities || 0}
          icon="checkmark-circle-outline"
          bgColor={colors.success}
          style={styles.statCard}
        />
      </View>

      <SectionHeader title="Top Cities by Activity" icon="bar-chart-outline" />
      
      {data?.cities.slice(0, 10).map((city, index) => (
        <View key={city.city} style={styles.cityCard}>
          <View style={styles.cityHeader}>
            <View style={styles.cityRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.cityInfo}>
              <Text style={styles.cityName}>{city.city}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(city.status)}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(city.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(city.status) }]}>
                  {getStatusLabel(city.status)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cityStats}>
            <View style={styles.cityStat}>
              <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cityStatValue}>{city.requirements || 0}</Text>
              <Text style={styles.cityStatLabel}>Reqs</Text>
            </View>
            <View style={styles.cityStat}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cityStatValue}>{city.teachers || 0}</Text>
              <Text style={styles.cityStatLabel}>Teachers</Text>
            </View>
            <View style={styles.cityStat}>
              <Ionicons name="link-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cityStatValue}>{city.matches || 0}</Text>
              <Text style={styles.cityStatLabel}>Matches</Text>
            </View>
            <View style={styles.cityStat}>
              <Ionicons name="swap-horizontal-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cityStatValue}>{city.demandSupplyRatio.toFixed(1)}</Text>
              <Text style={styles.cityStatLabel}>Ratio</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Render subject analytics section
  const renderSubjectAnalytics = () => (
    <View style={styles.section}>
      <SectionHeader title="Subject Shortages (High Demand)" icon="alert-circle-outline" />
      
      {data?.topShortages.map((subject) => (
        <View key={subject.subject} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectName}>{subject.subject}</Text>
            <View style={[styles.subjectBadge, { backgroundColor: `${colors.error}20` }]}>
              <Text style={[styles.subjectBadgeText, { color: colors.error }]}>
                Gap: {subject.gap}
              </Text>
            </View>
          </View>
          
          <View style={styles.subjectStats}>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatLabel}>Demand</Text>
              <Text style={styles.subjectStatValue}>{subject.demand}</Text>
            </View>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatLabel}>Supply</Text>
              <Text style={styles.subjectStatValue}>{subject.supply}</Text>
            </View>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatLabel}>Gap %</Text>
              <Text style={[styles.subjectStatValue, { color: colors.error }]}>
                {subject.gapPercentage}%
              </Text>
            </View>
          </View>
        </View>
      ))}

      <SectionHeader title="Subject Surpluses (High Supply)" icon="checkmark-done-outline" />
      
      {data?.topSurpluses.map((subject) => (
        <View key={subject.subject} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectName}>{subject.subject}</Text>
            <View style={[styles.subjectBadge, { backgroundColor: `${colors.info}20` }]}>
              <Text style={[styles.subjectBadgeText, { color: colors.info }]}>
                Surplus: {Math.abs(subject.gap || 0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.subjectStats}>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatLabel}>Demand</Text>
              <Text style={styles.subjectStatValue}>{subject.demand}</Text>
            </View>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatLabel}>Supply</Text>
              <Text style={styles.subjectStatValue}>{subject.supply}</Text>
            </View>
            <View style={styles.subjectStat}>
              <Text style={styles.subjectStatLabel}>Rate</Text>
              <Text style={styles.subjectStatValue}>₹{subject.avgHourlyRate}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Render growth analytics section
  const renderGrowthAnalytics = () => (
    <View style={styles.section}>
      <SectionHeader title="Fast Growing Cities" icon="trending-up-outline" />
      
      {data?.fastGrowingCities.slice(0, 10).map((city, index) => (
        <View key={city.city} style={styles.growthCard}>
          <View style={styles.growthHeader}>
            <View style={styles.growthRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.growthCityName}>{city.city}</Text>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color={colors.success} />
              <Text style={styles.growthBadgeText}>
                {city.growthRate30d?.toFixed(0)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.growthBars}>
            <View style={styles.growthBar}>
              <Text style={styles.growthBarLabel}>7d</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${Math.min((city.last7Days / (city.last30Days || 1)) * 100, 100)}%`,
                      backgroundColor: colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.growthBarValue}>{city.last7Days}</Text>
            </View>
            
            <View style={styles.growthBar}>
              <Text style={styles.growthBarLabel}>30d</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${Math.min((city.last30Days / (city.last90Days || 1)) * 100 * 3, 100)}%`,
                      backgroundColor: colors.success 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.growthBarValue}>{city.last30Days}</Text>
            </View>
            
            <View style={styles.growthBar}>
              <Text style={styles.growthBarLabel}>90d</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: '100%',
                      backgroundColor: colors.textSecondary 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.growthBarValue}>{city.last90Days}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading geo analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAnalytics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Geo Analytics</Text>
        <Text style={styles.headerSubtitle}>Geographic demand & supply intelligence</Text>
      </View>

      {/* Map */}
      {renderMap()}

      {/* Section Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'cities' && styles.activeTab]}
          onPress={() => setActiveSection('cities')}
        >
          <Ionicons 
            name="location-outline" 
            size={18} 
            color={activeSection === 'cities' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeSection === 'cities' && styles.activeTabText]}>
            Cities
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'subjects' && styles.activeTab]}
          onPress={() => setActiveSection('subjects')}
        >
          <Ionicons 
            name="book-outline" 
            size={18} 
            color={activeSection === 'subjects' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeSection === 'subjects' && styles.activeTabText]}>
            Subjects
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'growth' && styles.activeTab]}
          onPress={() => setActiveSection('growth')}
        >
          <Ionicons 
            name="trending-up-outline" 
            size={18} 
            color={activeSection === 'growth' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeSection === 'growth' && styles.activeTabText]}>
            Growth
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Section Content */}
      {activeSection === 'cities' && renderCityAnalytics()}
      {activeSection === 'subjects' && renderSubjectAnalytics()}
      {activeSection === 'growth' && renderGrowthAnalytics()}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Map
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
    ...shadows.card,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },

  // Markers
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 42) / 3,
  },

  // City Cards
  cityCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...shadows.card,
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cityInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cityStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Subject Cards
  subjectCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...shadows.card,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectStat: {
    alignItems: 'center',
  },
  subjectStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  subjectStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  // Growth Cards
  growthCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...shadows.card,
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  growthRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  growthCityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  growthBars: {
    gap: 8,
  },
  growthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  growthBarLabel: {
    width: 24,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  growthBarValue: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },

  // Loading & Error
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomSpace: {
    height: 32,
  },
});

export default GeoAnalyticsScreen;
