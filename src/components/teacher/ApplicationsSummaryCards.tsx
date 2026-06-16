import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type ApplicationFilterType = 
  | 'all' 
  | 'pending' 
  | 'shortlisted' 
  | 'rejected' 
  | 'accepted'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'withdrawn';

export interface SummaryCounts {
  all: number;
  pending: number;
  shortlisted: number;
  rejected: number;
  accepted: number;
  demoScheduled: number;
  demoCompleted: number;
  withdrawn: number;
}

interface SummaryCard {
  key: ApplicationFilterType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const SUMMARY_CARDS: SummaryCard[] = [
  {
    key: 'all',
    label: 'Total',
    icon: 'layers-outline',
    color: '#6366F1',
    bgColor: '#6366F120',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: 'time-outline',
    color: '#F59E0B',
    bgColor: '#F59E0B20',
  },
  {
    key: 'shortlisted',
    label: 'Shortlisted',
    icon: 'star-outline',
    color: '#3B82F6',
    bgColor: '#3B82F620',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: 'close-circle-outline',
    color: '#EF4444',
    bgColor: '#EF444420',
  },
  {
    key: 'accepted',
    label: 'Selected',
    icon: 'checkmark-circle-outline',
    color: '#10B981',
    bgColor: '#10B98120',
  },
  {
    key: 'demo_scheduled',
    label: 'Demo Scheduled',
    icon: 'videocam-outline',
    color: '#8B5CF6',
    bgColor: '#8B5CF620',
  },
];

interface ApplicationsSummaryCardsProps {
  counts: SummaryCounts;
  selectedFilter: ApplicationFilterType;
  onSelectFilter: (filter: ApplicationFilterType) => void;
}

const ApplicationsSummaryCards: React.FC<ApplicationsSummaryCardsProps> = ({
  counts,
  selectedFilter,
  onSelectFilter,
}) => {
  const theme = useTheme();

  const getCountForCard = (key: ApplicationFilterType): number => {
    switch (key) {
      case 'all':
        return counts.all;
      case 'pending':
        return counts.pending;
      case 'shortlisted':
        return counts.shortlisted;
      case 'rejected':
        return counts.rejected;
      case 'accepted':
        return counts.accepted;
      case 'demo_scheduled':
        return counts.demoScheduled;
      case 'demo_completed':
        return counts.demoCompleted;
      case 'withdrawn':
        return counts.withdrawn;
      default:
        return 0;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SUMMARY_CARDS.map((card) => {
          const isSelected = selectedFilter === card.key;
          const count = getCountForCard(card.key);

          return (
            <TouchableOpacity
              key={card.key}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? card.bgColor : theme.colors.card,
                  borderColor: isSelected ? card.color : theme.colors.border,
                },
              ]}
              onPress={() => onSelectFilter(card.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected ? card.color + '30' : card.bgColor },
                ]}
              >
                <Ionicons
                  name={card.icon as any}
                  size={20}
                  color={card.color}
                />
              </View>
              <Text
                style={[
                  styles.count,
                  { color: isSelected ? card.color : theme.colors.text },
                ]}
              >
                {count}
              </Text>
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected ? card.color : theme.colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {card.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  card: {
    width: 90,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  count: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default React.memo(ApplicationsSummaryCards);
