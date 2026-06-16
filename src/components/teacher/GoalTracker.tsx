import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { GoalProgress, Goals } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface GoalTrackerProps {
  goals: Goals;
  goalProgress: {
    applications: GoalProgress;
    demos: GoalProgress;
    conversions: GoalProgress;
  };
  isLoading?: boolean;
}

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  percentage: number;
  icon: string;
  color: string;
  isLoading?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({
  title,
  current,
  target,
  percentage,
  icon,
  color,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.goalCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <View style={[styles.skeletonIcon, { backgroundColor: theme.colors.border }]} />
          </View>
          <View style={styles.goalInfo}>
            <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
            <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.skeletonProgress, { backgroundColor: theme.colors.border }]} />
        </View>
        
        <View style={styles.goalStats}>
          <View style={[styles.skeletonStat, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonStat, { backgroundColor: theme.colors.border }]} />
        </View>
      </View>
    );
  }

  const getStatusColor = () => {
    if (percentage >= 100) return '#10B981'; // green - completed
    if (percentage >= 75) return '#3B82F6'; // blue - on track
    if (percentage >= 50) return '#F59E0B'; // amber - progress
    return '#EF4444'; // red - behind
  };

  const statusColor = getStatusColor();
  const progressWidth = Math.min(percentage, 100);

  return (
    <View style={[styles.goalCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.goalHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.goalInfo}>
          <Text style={[styles.goalTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.goalSubtitle, { color: theme.colors.textSecondary }]}>
            Monthly Goal
          </Text>
        </View>
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentage, { color: statusColor }]}>
            {percentage}%
          </Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <LinearGradient
            colors={percentage >= 100 ? [color, statusColor] : [statusColor, statusColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${progressWidth}%` },
            ]}
          />
        </View>
      </View>
      
      <View style={styles.goalStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Current</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{current}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Target</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{target}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
          <Text style={[styles.statValue, { color: statusColor }]}>
            {Math.max(0, target - current)}
          </Text>
        </View>
      </View>
      
      {percentage >= 100 && (
        <View style={[styles.completedBadge, { backgroundColor: `${color}20` }]}>
          <Ionicons name="checkmark-circle" size={16} color={color} />
          <Text style={[styles.completedText, { color: color }]}>Goal Achieved!</Text>
        </View>
      )}
    </View>
  );
};

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  goals,
  goalProgress,
  isLoading = false,
}) => {
  const theme = useTheme();

  const goalCards = [
    {
      title: 'Applications',
      current: goalProgress.applications.current,
      target: goalProgress.applications.target,
      percentage: goalProgress.applications.percentage,
      icon: 'document-text-outline',
      color: '#3B82F6', // blue
    },
    {
      title: 'Demo Sessions',
      current: goalProgress.demos.current,
      target: goalProgress.demos.target,
      percentage: goalProgress.demos.percentage,
      icon: 'videocam-outline',
      color: '#8B5CF6', // violet
    },
    {
      title: 'Conversions',
      current: goalProgress.conversions.current,
      target: goalProgress.conversions.target,
      percentage: goalProgress.conversions.percentage,
      icon: 'checkmark-done-outline',
      color: '#10B981', // green
    },
  ];

  // Calculate overall progress
  const overallProgress = Math.round(
    (goalProgress.applications.percentage + 
     goalProgress.demos.percentage + 
     goalProgress.conversions.percentage) / 3
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Monthly Goals</Text>
        <View style={styles.overallProgress}>
          <Text style={[styles.overallLabel, { color: theme.colors.textSecondary }]}>
            Overall Progress
          </Text>
          <Text style={[styles.overallValue, { color: theme.colors.text }]}>
            {overallProgress}%
          </Text>
        </View>
      </View>
      
      <View style={styles.goalsContainer}>
        {goalCards.map((goal, index) => (
          <GoalCard
            key={index}
            title={goal.title}
            current={goal.current}
            target={goal.target}
            percentage={goal.percentage}
            icon={goal.icon}
            color={goal.color}
            isLoading={isLoading}
          />
        ))}
      </View>
      
      <View style={[styles.footer, { backgroundColor: `${theme.colors.card}80` }]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Goals are automatically calculated based on your monthly targets. Keep up the great work!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  overallProgress: {
    alignItems: 'flex-end',
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  overallValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  goalsContainer: {
    marginBottom: 16,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  percentageContainer: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 16,
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
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  // Skeleton styles
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  skeletonTitle: {
    width: 80,
    height: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  skeletonSubtitle: {
    width: 60,
    height: 12,
    borderRadius: 6,
  },
  skeletonProgress: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  skeletonStat: {
    width: 30,
    height: 14,
    borderRadius: 7,
  },
});
