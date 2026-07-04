import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme';
import { selectAuthToken } from '../redux/slices/authSlice';
import NotificationBell from '../components/common/NotificationBell';

// Import Screens
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';
import GeoAnalyticsScreen from '../screens/admin/GeoAnalyticsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import ParentsManagementScreen from '../screens/admin/ParentsManagementScreen';
import TeachersManagementScreen from '../screens/admin/TeachersManagementScreen';
import TeacherDetailScreen from '../screens/admin/TeacherDetailScreen';
import DataImportScreen from '../screens/admin/DataImportScreen';
import NotificationFeedScreen from '../screens/admin/NotificationFeedScreen';
import TicketDashboardScreen from '../screens/admin/TicketDashboardScreen';
import TicketDetailScreen from '../screens/admin/TicketDetailScreen';

// Settings Screens
import SystemSettingsScreen from '../screens/settings/SystemSettingsScreen';
import MaintenanceModeScreen from '../screens/settings/MaintenanceModeScreen';
import NotificationTemplatesScreen from '../screens/settings/NotificationTemplatesScreen';
import SmtpConfigScreen from '../screens/admin/SmtpConfigScreen';
import ComingSoonScreen from '../screens/settings/ComingSoonScreen';

// Revenue Dashboard
import AdminRevenueDashboardScreen from '../screens/admin/AdminRevenueDashboardScreen';

// Wallet Screens
import AdminWalletDashboardScreen from '../screens/wallet/AdminWalletDashboardScreen';

// Live Classes Screens
import AdminLiveClassesDashboardScreen from '../screens/liveClasses/AdminLiveClassesDashboardScreen';

// Course Marketplace Screens
import AdminCourseDashboardScreen from '../screens/courses/AdminCourseDashboardScreen';

// KYC Screens
import AdminKycQueueScreen from '../screens/admin/AdminKycQueueScreen';
import AdminKycDetailScreen from '../screens/admin/AdminKycDetailScreen';

// Subscription & Credit Management Screens
import AdminSubscriptionsScreen from '../screens/admin/AdminSubscriptionsScreen';
import AdminSubscriptionDetailScreen from '../screens/admin/AdminSubscriptionDetailScreen';
import AdminCreditsManagementScreen from '../screens/admin/AdminCreditsManagementScreen';
import AdminCreditHistoryScreen from '../screens/admin/AdminCreditHistoryScreen';

// Campaign Management Screens
import AdminCampaignsScreen from '../screens/admin/AdminCampaignsScreen';
import AdminCampaignDetailScreen from '../screens/admin/AdminCampaignDetailScreen';
import AdminCampaignAnalyticsScreen from '../screens/admin/AdminCampaignAnalyticsScreen';

// Hiring Analytics Screen (Sprint 3.21)
import AdminHiringAnalyticsScreen from '../screens/admin/AdminHiringAnalyticsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bell header button
const AdminBellButton: React.FC = () => {
  const theme = useTheme();
  const token = useSelector(selectAuthToken) ?? '';
  const nav   = useNavigation<any>();
  return (
    <NotificationBell
      token={token}
      color={theme.colors.text}
      onPress={() => nav.navigate('AdminNotifications')}
    />
  );
};

// Admin Tab Navigator
const AdminTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      id="AdminTabNavigator"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home-outline';
              break;
            case 'Parents':
              iconName = 'people-outline';
              break;
            case 'Teachers':
              iconName = 'school-outline';
              break;
            case 'Import':
              iconName = 'cloud-upload-outline';
              break;
            case 'Analytics':
              iconName = 'bar-chart-outline';
              break;
            case 'Notifications':
              iconName = 'notifications-outline';
              break;
            case 'Settings':
              iconName = 'settings-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.secondary,
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
          fontSize: 12,
          fontFamily: theme.typography.fontFamily.medium,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Parents" 
        component={ParentsManagementScreen}
        options={{ tabBarLabel: 'Parents' }}
      />
      <Tab.Screen 
        name="Teachers" 
        component={TeachersManagementScreen}
        options={{ tabBarLabel: 'Teachers' }}
      />
      <Tab.Screen 
        name="Import" 
        component={DataImportScreen}
        options={{ tabBarLabel: 'Import' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationFeedScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={AdminSettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Admin Stack Navigator
const AdminNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <Stack.Navigator
      id="AdminStackNavigator"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="AdminMain" 
        component={AdminTabNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="TeacherDetail"
        component={TeacherDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminNotifications"
        component={NotificationFeedScreen}
        options={{
          headerShown: true,
          title: 'Notification Feed',
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text,
          headerRight: () => <AdminBellButton />,
        }}
      />
      <Stack.Screen
        name="GeoAnalytics"
        component={GeoAnalyticsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TicketDashboard"
        component={TicketDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SystemSettings"
        component={SystemSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MaintenanceMode"
        component={MaintenanceModeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationTemplates"
        component={NotificationTemplatesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SmtpConfig"
        component={SmtpConfigScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ComingSoon"
        component={ComingSoonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminWalletDashboard"
        component={AdminWalletDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminLiveClassesDashboard"
        component={AdminLiveClassesDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCourseDashboard"
        component={AdminCourseDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminRevenueDashboard"
        component={AdminRevenueDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminKycQueue"
        component={AdminKycQueueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminKycDetail"
        component={AdminKycDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminSubscriptions"
        component={AdminSubscriptionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminSubscriptionDetail"
        component={AdminSubscriptionDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCreditsManagement"
        component={AdminCreditsManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCreditHistory"
        component={AdminCreditHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCampaigns"
        component={AdminCampaignsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCampaignDetail"
        component={AdminCampaignDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCampaignAnalytics"
        component={AdminCampaignAnalyticsScreen}
        options={{ headerShown: false }}
      />
      {/* Hiring Analytics Screen (Sprint 3.21) */}
      <Stack.Screen
        name="AdminHiringAnalytics"
        component={AdminHiringAnalyticsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
