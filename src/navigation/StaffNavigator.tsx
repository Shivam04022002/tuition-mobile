import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

// Staff Screens
import StaffDashboardScreen from '../screens/staff/StaffDashboardScreen';
import StaffTicketsScreen from '../screens/staff/StaffTicketsScreen';
import StaffVerificationQueueScreen from '../screens/staff/StaffVerificationQueueScreen';
import StaffReportsScreen from '../screens/staff/StaffReportsScreen';
import StaffProfileScreen from '../screens/staff/StaffProfileScreen';
import TicketDetailScreen from '../screens/admin/TicketDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const StaffTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      id="StaffTabNavigator"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'StaffDashboard':
              iconName = 'home-outline';
              break;
            case 'StaffTickets':
              iconName = 'ticket-outline';
              break;
            case 'StaffVerification':
              iconName = 'shield-checkmark-outline';
              break;
            case 'StaffReports':
              iconName = 'bar-chart-outline';
              break;
            case 'StaffProfile':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.info,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          elevation: 8,
          shadowColor: 'rgba(45, 10, 125, 0.12)',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: theme.typography.fontFamily.medium,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="StaffDashboard"
        component={StaffDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="StaffTickets"
        component={StaffTicketsScreen}
        options={{ tabBarLabel: 'Tickets' }}
      />
      <Tab.Screen
        name="StaffVerification"
        component={StaffVerificationQueueScreen}
        options={{ tabBarLabel: 'Verify' }}
      />
      <Tab.Screen
        name="StaffReports"
        component={StaffReportsScreen}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="StaffProfile"
        component={StaffProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const StaffNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id="StaffStackNavigator"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="StaffMain"
        component={StaffTabNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="StaffTicketDetail"
        component={TicketDetailScreen}
      />
    </Stack.Navigator>
  );
};

export default StaffNavigator;
