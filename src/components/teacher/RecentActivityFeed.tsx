import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { RecentActivity } from '../../services/teacherAnalyticsApi';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
  isLoading?: boolean;
}

interface ActivityItemProps {
  activity: RecentActivity;
}

const getActivityIcon = (type: string): { name: string; color: string } => {
  switch (type) {
    case 'application_submitted':
      return { name: 'document-text-outline', color: '#3B82F6' };
    case 'application_shortlisted':
      return { name: 'star-outline', color: '#F59E0B' };
    case 'application_accepted':
      return { name: 'checkmark-circle-outline', color: '#10B981' };
    case 'demo_request':
      return { name: 'videocam-outline', color: '#8B5CF6' };
    case 'demo_completed':
      return { name: 'checkmark-done-outline', color: '#059669' };
    case 'requirement_saved':
      return { name: 'bookmark-outline', color: '#F97316' };
    case 'requirement_viewed':
      return { name: 'eye-outline', color: '#6366F1' };
    case 'profile_updated':
      return { name: 'person-outline', color: '#EF4444' };
    case 'review_received':
      return { name: 'chatbubble-outline', color: '#06B6D4' };
    default:
      return { name: 'information-circle-outline', color: '#6B7280' };
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const theme = useTheme();
  const { name, color } = getActivityIcon(activity.type);

  return (
    <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={name as any} size={16} color={color} />
      </View>
      
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
          {activity.title}
        </Text>
        <Text style={[styles.activityMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {activity.message}
        </Text>
        <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
          {formatTimeAgo(activity.createdAt)}
        </Text>
      </View>
      
      {!activity.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: color }]} />
      )}
    </View>
  );
};

const SkeletonActivityItem: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.skeletonIcon, { backgroundColor: theme.colors.border }]} />
      </View>
      
      <View style={styles.activityContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
        <View style={[styles.skeletonMessage, { backgroundColor: theme.colors.border }]} />
        <View style={[styles.skeletonTime, { backgroundColor: theme.colors.border }]} />
      </View>
    </View>
  );
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.skeletonHeaderTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonHeaderSubtitle, { backgroundColor: theme.colors.border }]} />
        </View>
        
        <View style={styles.feedContainer}>
          {[0, 1, 2, 3, 4].map((index) => (
            <SkeletonActivityItem key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Recent Activity</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your latest activities
          </Text>
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No recent activity
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
            Start applying to requirements and engaging with parents to see your activity here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Recent Activity</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your latest activities
        </Text>
      </View>
      
      <View style={styles.feedContainer}>
        <FlatList
          data={activities}
          renderItem={({ item }) => <ActivityItem activity={item} />}
          keyExtractor={(item, index) => `${item.type}-${item.createdAt}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
        />
      </View>
    </View>
  );
};

// Compact version for dashboard
export const CompactActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.compactHeader}>
          <View style={[styles.skeletonCompactTitle, { backgroundColor: theme.colors.border }]} />
        </View>
        
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.compactActivityItem}>
            <View style={[styles.compactIconContainer, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.skeletonCompactIcon, { backgroundColor: theme.colors.border }]} />
            </View>
            <View style={styles.compactActivityContent}>
              <View style={[styles.skeletonCompactTitle, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.skeletonCompactTime, { backgroundColor: theme.colors.border }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  const recentActivities = activities.slice(0, 3);

  return (
    <View style={[styles.compactContainer, { backgroundColor: theme.colors.card }]}>
      <View style={styles.compactHeader}>
        <Text style={[styles.compactTitle, { color: theme.colors.text }]}>Recent Activity</Text>
        {activities.length > 3 && (
          <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
            View all ({activities.length})
          </Text>
        )}
      </View>
      
      {recentActivities.length > 0 ? (
        recentActivities.map((activity, index) => {
          const { name, color } = getActivityIcon(activity.type);
          
          return (
            <View key={index} style={styles.compactActivityItem}>
              <View style={[styles.compactIconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={name as any} size={14} color={color} />
              </View>
              <View style={styles.compactActivityContent}>
                <Text style={[styles.compactActivityTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {activity.title}
                </Text>
                <Text style={[styles.compactActivityTime, { color: theme.colors.textSecondary }]}>
                  {formatTimeAgo(activity.createdAt)}
                </Text>
              </View>
              {!activity.isRead && (
                <View style={[styles.compactUnreadDot, { backgroundColor: color }]} />
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.compactEmptyState}>
          <Text style={[styles.compactEmptyText, { color: theme.colors.textSecondary }]}>
            No recent activity
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
    fontWeight: '400',
  },
  feedContainer: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityMessage: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '400',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Compact styles
  compactContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  compactIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  compactActivityContent: {
    flex: 1,
  },
  compactActivityTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactActivityTime: {
    fontSize: 11,
    fontWeight: '400',
  },
  compactUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  compactEmptyText: {
    fontSize: 13,
    fontWeight: '400',
  },
  // Skeleton styles
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  skeletonTitle: {
    width: 120,
    height: 14,
    borderRadius: 7,
    marginBottom: 2,
  },
  skeletonMessage: {
    width: '100%',
    height: 13,
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonTime: {
    width: 40,
    height: 11,
    borderRadius: 6,
  },
  skeletonHeaderTitle: {
    width: 120,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  skeletonHeaderSubtitle: {
    width: 100,
    height: 14,
    borderRadius: 7,
  },
  skeletonCompactIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  skeletonCompactTitle: {
    width: 80,
    height: 13,
    borderRadius: 6,
    marginBottom: 2,
  },
  skeletonCompactTime: {
    width: 30,
    height: 11,
    borderRadius: 6,
  },
});
