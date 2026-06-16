import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { DAYS_OF_WEEK } from '../../services/teacherAvailabilityApi';

const { width } = Dimensions.get('window');

interface AvailabilityCalendarProps {
  weeklySchedule: Record<string, { isEnabled: boolean; timeSlots: string[] }>;
  onToggleDay: (day: string, isEnabled: boolean) => void;
  onSelectDay: (day: string) => void;
  selectedDay?: string;
  isLoading?: boolean;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  weeklySchedule,
  onToggleDay,
  onSelectDay,
  selectedDay,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleDayPress = useCallback((day: string) => {
    if (isLoading) return;

    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSelectDay(day);
  }, [isLoading, onSelectDay, scaleAnim]);

  const handleToggleDay = useCallback((day: string, isEnabled: boolean) => {
    if (isLoading) return;
    onToggleDay(day, isEnabled);
  }, [isLoading, onToggleDay]);

  const dayStats = useMemo(() => {
    const stats: Record<string, { enabled: boolean; timeSlotCount: number }> = {};
    
    DAYS_OF_WEEK.forEach(day => {
      const schedule = weeklySchedule[day];
      stats[day] = {
        enabled: schedule?.isEnabled || false,
        timeSlotCount: schedule?.timeSlots?.length || 0,
      };
    });

    return stats;
  }, [weeklySchedule]);

  const getDayColor = useCallback((day: string) => {
    const stats = dayStats[day];
    
    if (!stats.enabled) {
      return colors.border;
    }
    
    if (stats.timeSlotCount === 0) {
      return colors.warning; // Orange for enabled but no time slots
    }
    
    return colors.success; // Green for enabled with time slots
  }, [dayStats, colors]);

  const getDayTextColor = useCallback((day: string) => {
    const stats = dayStats[day];
    
    if (!stats.enabled) {
      return colors.textSecondary;
    }
    
    return colors.text;
  }, [dayStats, colors]);

  const renderDay = useCallback((day: string, index: number) => {
    const stats = dayStats[day];
    const isSelected = selectedDay === day;
    const isEnabled = stats.enabled;

    return (
      <Animated.View
        key={day}
        style={[
          styles.dayContainer,
          {
            borderColor: getDayColor(day),
            backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
            transform: [{ scale: isSelected ? scaleAnim : 1 }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dayButton,
            {
              backgroundColor: isEnabled ? getDayColor(day) + '20' : 'transparent',
            },
          ]}
          onPress={() => handleDayPress(day)}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayText,
              {
                color: getDayTextColor(day),
                fontWeight: isEnabled ? '600' : '400',
              },
            ]}
          >
            {day.slice(0, 3).toUpperCase()}
          </Text>
          
          {stats.timeSlotCount > 0 && (
            <View style={[
              styles.timeSlotBadge,
              { backgroundColor: getDayColor(day) }
            ]}>
              <Text style={[styles.timeSlotText, { color: 'white' }]}>
                {stats.timeSlotCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: isEnabled ? getDayColor(day) : colors.border,
            },
          ]}
          onPress={() => handleToggleDay(day, !isEnabled)}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isEnabled ? 'checkmark' : 'close'}
            size={12}
            color="white"
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [
    dayStats,
    selectedDay,
    scaleAnim,
    colors,
    getDayColor,
    getDayTextColor,
    handleDayPress,
    handleToggleDay,
    isLoading,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Weekly Schedule
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Toggle days to set availability
        </Text>
      </View>

      <View style={styles.calendarGrid}>
        {DAYS_OF_WEEK.map((day, index) => renderDay(day, index))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Unavailable
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Available (No Slots)
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Available (With Slots)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
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
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayContainer: {
    width: (width - 48) / 4 - 8,
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    position: 'relative',
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeSlotBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  timeSlotText: {
    fontSize: 10,
    fontWeight: '600',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
