import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../redux/hooks';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { apiConfig } from '../../config/api';

interface Application {
  _id: string;
  applicationId: string;
  status: string;
  viewedByParent: boolean;
  teacherProfileId: {
    _id: string;
    basicDetails: {
      fullName: string;
      profilePhoto?: string;
    };
    stats: {
      averageRating: number;
    };
  };
}

interface Requirement {
  _id: string;
  requirementId: string;
  studentDetails: {
    studentName: string;
    grade: string;
  };
  subjects: string[];
  status: string;
  applicationsCount: number;
  shortlistedCount: number;
  demosScheduledCount: number;
  hiredTeacherId?: string;
}

interface FunnelStats {
  total: number;
  pending: number;
  viewed: number;
  shortlisted: number;
  demo_scheduled: number;
  demo_completed: number;
  selected: number;
  hired: number;
  rejected: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  viewed: '#3B82F6',
  shortlisted: '#8B5CF6',
  rejected: '#EF4444',
  demo_scheduled: '#10B981',
  demo_completed: '#059669',
  selected: '#6366F1',
  hired: '#10B981',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  viewed: 'Viewed',
  shortlisted: 'Shortlisted',
  rejected: 'Not Selected',
  demo_scheduled: 'Demo Scheduled',
  demo_completed: 'Demo Completed',
  selected: 'Selected',
  hired: 'Hired',
};

export default function ParentHiringDashboardScreen() {
  const navigation = useNavigation();
  const token = useAppSelector(selectAuthToken);

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequirements = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiConfig.baseURL}/parents/my-requirements`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        // Filter to only show active hiring requirements
        const activeReqs = data.data.requirements.filter((r: Requirement) =>
          ['published', 'receiving_applications', 'shortlisted', 'demo_scheduled', 'teacher_selected'].includes(r.status)
        );
        setRequirements(activeReqs);
        if (activeReqs.length > 0 && !selectedRequirement) {
          setSelectedRequirement(activeReqs[0]);
        }
      }
    } catch (error) {
      console.error('Fetch requirements error:', error);
    }
  }, [token, selectedRequirement]);

  const fetchApplications = useCallback(async (reqId: string) => {
    try {
      const response = await fetch(
        `${apiConfig.baseURL}/parents/requirements/${reqId}/applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setApplications(data.data.applications);
        // Calculate funnel stats
        const stats: FunnelStats = {
          total: data.data.pagination.total,
          pending: 0,
          viewed: 0,
          shortlisted: 0,
          demo_scheduled: 0,
          demo_completed: 0,
          selected: 0,
          hired: 0,
          rejected: 0,
        };
        data.data.applications.forEach((app: Application) => {
          if (stats[app.status as keyof FunnelStats] !== undefined) {
            stats[app.status as keyof FunnelStats]++;
          }
        });
        setFunnelStats(stats);
      }
    } catch (error) {
      console.error('Fetch applications error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  useEffect(() => {
    if (selectedRequirement) {
      fetchApplications(selectedRequirement._id);
    }
  }, [selectedRequirement, fetchApplications]);

  const renderFunnelBar = () => {
    if (!funnelStats || funnelStats.total === 0) return null;

    const stages = ['pending', 'viewed', 'shortlisted', 'demo_scheduled', 'selected', 'hired'];
    const maxWidth = 100;

    return (
      <View style={styles.funnelContainer}>
        <Text style={styles.funnelTitle}>Hiring Funnel</Text>
        {stages.map((stage) => {
          const count = funnelStats[stage as keyof FunnelStats];
          const percentage = funnelStats.total > 0 ? (count / funnelStats.total) * 100 : 0;
          const width = Math.max(percentage, 5);

          return (
            <View key={stage} style={styles.funnelRow}>
              <Text style={styles.funnelLabel}>{STATUS_LABELS[stage]}</Text>
              <View style={styles.funnelBarContainer}>
                <View
                  style={[
                    styles.funnelBar,
                    { width: `${width}%`, backgroundColor: STATUS_COLORS[stage] },
                  ]}
                />
              </View>
              <Text style={styles.funnelCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderApplicationCard = ({ item }: { item: Application }) => {
    const statusColor = STATUS_COLORS[item.status] || '#6B7280';

    return (
      <TouchableOpacity
        style={styles.applicationCard}
        onPress={() =>
          (navigation as any).navigate('ParentApplicationReview', {
            requirementId: selectedRequirement?._id,
            applicationId: item._id,
          })
        }
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <View style={styles.applicationContent}>
          <Text style={styles.teacherName}>
            {item.teacherProfileId?.basicDetails?.fullName || 'Unknown'}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {item.teacherProfileId?.stats?.averageRating?.toFixed(1) || '0.0'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.status] || item.status}
              </Text>
            </View>
            {item.viewedByParent && (
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hiring Dashboard</Text>
        <View style={styles.headerRight} />
      </View>

      {requirements.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Active Requirements</Text>
          <Text style={styles.emptyText}>
            Post a requirement to start receiving applications from tutors
          </Text>
          <TouchableOpacity
            style={styles.postButton}
            onPress={() => navigation.navigate('PostRequirement' as never)}
          >
            <Text style={styles.postButtonText}>Post Requirement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchRequirements();
              }}
            />
          }
        >
          {/* Requirement Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.requirementSelector}
            contentContainerStyle={styles.requirementSelectorContent}
          >
            {requirements.map((req) => (
              <TouchableOpacity
                key={req._id}
                style={[
                  styles.requirementChip,
                  selectedRequirement?._id === req._id && styles.requirementChipActive,
                ]}
                onPress={() => setSelectedRequirement(req)}
              >
                <Text
                  style={[
                    styles.requirementChipText,
                    selectedRequirement?._id === req._id && styles.requirementChipTextActive,
                  ]}
                >
                  {req.studentDetails.studentName} - {req.subjects[0]}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{req.applicationsCount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Requirement Summary */}
          {selectedRequirement && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Requirement Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{selectedRequirement.applicationsCount}</Text>
                  <Text style={styles.summaryLabel}>Applications</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{selectedRequirement.shortlistedCount}</Text>
                  <Text style={styles.summaryLabel}>Shortlisted</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{selectedRequirement.demosScheduledCount}</Text>
                  <Text style={styles.summaryLabel}>Demos</Text>
                </View>
              </View>
            </View>
          )}

          {/* Funnel Visualization */}
          {renderFunnelBar()}

          {/* Applications List */}
          <View style={styles.applicationsSection}>
            <Text style={styles.sectionTitle}>Applications</Text>
            {applications.length === 0 ? (
              <View style={styles.noApplications}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noApplicationsText}>No applications yet</Text>
              </View>
            ) : (
              <FlatList
                data={applications}
                renderItem={renderApplicationCard}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
  },
  requirementSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    maxHeight: 70,
  },
  requirementSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  requirementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  requirementChipActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  requirementChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  requirementChipTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  funnelContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  funnelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  funnelLabel: {
    width: 100,
    fontSize: 12,
    color: '#6B7280',
  },
  funnelBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: 4,
  },
  funnelCount: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  applicationsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  applicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  applicationContent: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noApplications: {
    alignItems: 'center',
    padding: 32,
  },
  noApplicationsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  postButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
