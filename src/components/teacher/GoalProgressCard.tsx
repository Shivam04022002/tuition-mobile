import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface GoalProgressCardProps {
  title?: string;
  isLoading?: boolean;
  onGoalUpdate?: (goalType: string, value: number) => void;
}

interface GoalItem {
  type: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
}

const GoalItem: React.FC<{
  goal: GoalItem;
  onUpdate: (type: string, value: number) => void;
}> = ({ goal, onUpdate }) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const isCompleted = percentage >= 100;
  const progressColor = isCompleted ? theme.colors.success : theme.colors.primary;

  const handleUpdateGoal = () => {
    Alert.prompt(
      `Update ${goal.label} Goal`,
      `Set your new ${goal.label} goal:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (value) => {
            if (value && !isNaN(Number(value))) {
              onUpdate(goal.type, Number(value));
            }
          },
        },
      ],
      'plain-text',
      goal.target.toString()
    );
  };

  return (
    <View style={[styles.goalItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity
        style={styles.goalHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.goalInfo}>
          <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
            <Ionicons name={goal.icon as any} size={16} color={goal.color} />
          </View>
          <View style={styles.goalText}>
            <Text style={[styles.goalLabel, { color: theme.colors.text }]}>
              {goal.label}
            </Text>
            <Text style={[styles.goalProgress, { color: theme.colors.textSecondary }]}>
              {goal.current} / {goal.target} {goal.unit}
            </Text>
          </View>
        </View>
        
        <View style={styles.goalRight}>
          <Text style={[styles.percentage, { color: progressColor }]}>
            {Math.round(percentage)}%
          </Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={theme.colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar,
            { 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: progressColor
            }
          ]} 
        />
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.goalStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Current
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {goal.current}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Target
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {goal.target}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Remaining
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {Math.max(0, goal.target - goal.current)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleUpdateGoal}
          >
            <Ionicons name="create-outline" size={14} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>Update Goal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  title = 'Monthly Goals',
  isLoading = false,
  onGoalUpdate,
}) => {
  const theme = useTheme();

  // Mock data - in real implementation, this would come from API
  const goals: GoalItem[] = [
    {
      type: 'revenue',
      label: 'Monthly Revenue',
      current: 25000,
      target: 35000,
      unit: '₹',
      icon: 'wallet-outline',
      color: '#10B981',
    },
    {
      type: 'students',
      label: 'Student Acquisition',
      current: 8,
      target: 12,
      unit: 'students',
      icon: 'person-add-outline',
      color: '#3B82F6',
    },
    {
      type: 'conversion',
      label: 'Demo Conversion',
      current: 65,
      target: 75,
      unit: '%',
      icon: 'checkmark-circle-outline',
      color: '#8B5CF6',
    },
  ];

  const handleGoalUpdate = (goalType: string, value: number) => {
    if (onGoalUpdate) {
      onGoalUpdate(goalType, value);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
        </View>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.skeletonGoalItem}>
            <View style={styles.skeletonGoalHeader}>
              <View style={styles.skeletonGoalInfo}>
                <View style={[styles.skeletonGoalIcon, { backgroundColor: theme.colors.border }]} />
                <View style={styles.skeletonGoalText}>
                  <View style={[styles.skeletonGoalLabel, { backgroundColor: theme.colors.border }]} />
                  <View style={[styles.skeletonGoalProgress, { backgroundColor: theme.colors.border }]} />
                </View>
              </View>
              <View style={styles.skeletonGoalRight}>
                <View style={[styles.skeletonPercentage, { backgroundColor: theme.colors.border }]} />
                <View style={[styles.skeletonChevron, { backgroundColor: theme.colors.border }]} />
              </View>
            </View>
            <View style={[styles.skeletonProgressBar, { backgroundColor: theme.colors.border }]} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Track your progress towards monthly targets
        </Text>
      </View>

      <View style={styles.goalsList}>
        {goals.map((goal) => (
          <GoalItem
            key={goal.type}
            goal={goal}
            onUpdate={handleGoalUpdate}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Tap on goals to expand and update your targets
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  goalsList: {
    gap: 12,
  },
  goalItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalText: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '400',
  },
  goalRight: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Skeleton loading styles
  skeletonTitle: {
    width: 120,
    height: 18,
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: 80,
    height: 14,
    borderRadius: 6,
  },
  skeletonGoalItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  skeletonGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonGoalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skeletonGoalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  skeletonGoalText: {
    flex: 1,
  },
  skeletonGoalLabel: {
    width: 100,
    height: 16,
    borderRadius: 6,
    marginBottom: 2,
  },
  skeletonGoalProgress: {
    width: 60,
    height: 14,
    borderRadius: 6,
  },
  skeletonGoalRight: {
    alignItems: 'center',
  },
  skeletonPercentage: {
    width: 30,
    height: 16,
    borderRadius: 6,
    marginBottom: 2,
  },
  skeletonChevron: {
    width: 16,
    height: 16,
    borderRadius: 6,
  },
  skeletonProgressBar: {
    height: 6,
    borderRadius: 3,
  },
});
