import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { EstimatedEarnings } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface EstimatedEarningsCardProps {
  earnings: EstimatedEarnings;
  isLoading?: boolean;
}

const EarningsCard: React.FC<{
  title: string;
  amount: number;
  icon: string;
  gradient: readonly [string, string, ...string[]];
  isLoading?: boolean;
}> = ({ title, amount, icon, gradient, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.earningsCard, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: theme.colors.border }]} />
        </View>
        <View style={styles.earningsTextContainer}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonAmount, { backgroundColor: theme.colors.border }]} />
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.earningsCard}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.earningsTextContainer}>
        <Text style={styles.earningsTitle}>{title}</Text>
        <Text style={styles.earningsAmount}>₹{amount.toLocaleString()}</Text>
      </View>
    </LinearGradient>
  );
};

export const EstimatedEarningsCard: React.FC<EstimatedEarningsCardProps> = ({
  earnings,
  isLoading = false,
}) => {
  const theme = useTheme();

  const earningsCards = [
    {
      title: 'Monthly Potential',
      amount: earnings.monthlyPotentialRevenue,
      icon: 'calendar-outline',
      gradient: ['#3B82F6', '#1D4ED8'] as const, // blue gradient
    },
    {
      title: 'Quarterly Potential',
      amount: earnings.quarterlyPotentialRevenue,
      icon: 'bar-chart-outline',
      gradient: ['#10B981', '#047857'] as const, // green gradient
    },
    {
      title: 'Annual Potential',
      amount: earnings.annualPotentialRevenue,
      icon: 'trending-up-outline',
      gradient: ['#8B5CF6', '#6D28D9'] as const, // purple gradient
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Estimated Earnings</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Based on current conversion rates
        </Text>
      </View>

      <View style={styles.earningsGrid}>
        {earningsCards.map((card, index) => (
          <EarningsCard
            key={index}
            title={card.title}
            amount={card.amount}
            icon={card.icon}
            gradient={card.gradient}
            isLoading={isLoading}
          />
        ))}
      </View>

      <View style={[styles.studentValueCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.studentValueContent}>
          <View style={styles.studentValueLeft}>
            <View style={[styles.studentValueIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.studentValueText}>
              <Text style={[styles.studentValueTitle, { color: theme.colors.textSecondary }]}>
                Average Student Value
              </Text>
              <Text style={[styles.studentValueAmount, { color: theme.colors.text }]}>
                ₹{earnings.averageStudentValue.toLocaleString()}
              </Text>
            </View>
          </View>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
        </View>
      </View>
    </View>
  );
};

const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earningsCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earningsTextContainer: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentValueCard: {
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentValueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentValueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentValueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentValueText: {
    flex: 1,
  },
  studentValueTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  studentValueAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Skeleton loading styles
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonTitle: {
    width: 80,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonAmount: {
    width: 60,
    height: 18,
    borderRadius: 6,
  },
});
