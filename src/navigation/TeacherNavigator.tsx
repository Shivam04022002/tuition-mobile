import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../redux/slices/authSlice';
import NotificationBell from '../components/common/NotificationBell';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

// Import Screens
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import LeadMarketplaceScreen from '../screens/teacher/LeadMarketplaceScreen';
import TeacherRequirementsScreen from '../screens/teacher/TeacherRequirementsScreen';
import TeacherApplicationsScreen from '../screens/teacher/TeacherApplicationsScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import NotificationsScreen from '../screens/parent/NotificationsScreen';
import TutorDemoRequestsScreen from '../screens/teacher/TutorDemoRequestsScreen';
import TeacherDemoRequestsDashboardScreen from '../screens/teacher/TeacherDemoRequestsDashboardScreen';
import TeacherDemoRequestDetailScreen from '../screens/teacher/TeacherDemoRequestDetailScreen';
import TeacherDemoCalendarScreen from '../screens/teacher/TeacherDemoCalendarScreen';
import TeacherOnboardingNavigator from '../screens/teacher/TeacherOnboardingNavigator';
import TeacherOnboardingScreen from '../screens/onboarding/TeacherOnboardingScreen';
import LocationMapScreen from '../screens/maps/LocationMapScreen';
import SupportScreen from '../screens/support/SupportScreen';
import FAQScreen from '../screens/support/FAQScreen';
import CreateTicketScreen from '../screens/support/CreateTicketScreen';
import MyTicketsScreen from '../screens/support/MyTicketsScreen';

// Import Drawer Components
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';

// Settings Screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import LanguageSettingsScreen from '../screens/settings/LanguageSettingsScreen';
import DataManagementScreen from '../screens/settings/DataManagementScreen';
import AvailabilitySettingsScreen from '../screens/settings/AvailabilitySettingsScreen';
import ComingSoonScreen from '../screens/settings/ComingSoonScreen';

// Wallet Screens
import WalletScreen from '../screens/wallet/WalletScreen';
import WalletHistoryScreen from '../screens/wallet/WalletHistoryScreen';

// Live Classes Screens
import LiveClassesScreen from '../screens/liveClasses/LiveClassesScreen';
import UpcomingClassesScreen from '../screens/liveClasses/UpcomingClassesScreen';
import ClassHistoryScreen from '../screens/liveClasses/ClassHistoryScreen';

// Course Marketplace Screens
import CourseMarketplaceScreen from '../screens/courses/CourseMarketplaceScreen';
import CourseCategoriesScreen from '../screens/courses/CourseCategoriesScreen';
import CourseDetailsScreen from '../screens/courses/CourseDetailsScreen';
import MyCoursesScreen from '../screens/courses/MyCoursesScreen';

// Document & Verification Screens
import TeacherDocumentsScreen from '../screens/teacher/TeacherDocumentsScreen';
import TeacherVerificationScreen from '../screens/teacher/TeacherVerificationScreen';

// Preferences Screen
import TeacherPreferencesScreen from '../screens/teacher/TeacherPreferencesScreen';

// KYC Screens
import TeacherKycScreen from '../screens/teacher/TeacherKycScreen';
import TeacherKycStatusScreen from '../screens/teacher/TeacherKycStatusScreen';

// Availability Screen
import { TeacherAvailabilityScreen } from '../screens/teacher/TeacherAvailabilityScreen';

// Requirement Detail Screen
import TeacherRequirementDetailScreen from '../screens/teacher/TeacherRequirementDetailScreen';

// Analytics Screen
import TeacherAnalyticsDashboardScreen from '../screens/teacher/TeacherAnalyticsDashboardScreen';
import TeacherEarningsDashboardScreen from '../screens/teacher/TeacherEarningsDashboardScreen';

// Subscription Screen
import TeacherSubscriptionScreen from '../screens/teacher/TeacherSubscriptionScreen';

// Credits Screen
import TeacherCreditsScreen from '../screens/teacher/TeacherCreditsScreen';
import CreditPacksScreen from '../screens/teacher/CreditPacksScreen';

// Application Screens
import ApplyToRequirementScreen from '../screens/teacher/ApplyToRequirementScreen';
import TeacherApplicationDetailScreen from '../screens/teacher/TeacherApplicationDetailScreen';
import TeacherApplicationsDashboardScreen from '../screens/teacher/TeacherApplicationsDashboardScreen';
import ApplicationSuccessScreen from '../screens/teacher/ApplicationSuccessScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Bell header button component
const BellButton: React.FC = () => {
  const token = useSelector(selectAuthToken) ?? '';
  const nav   = useNavigation<any>();
  return (
    <NotificationBell
      token={token}
      color={colors.text}
      onPress={() => nav.navigate('TeacherNotifications')}
    />
  );
};

const TAB_ICONS: Record<string, string> = {
  Home: 'home',
  Leads: 'people',
  Applications: 'document-text',
  Notifications: 'notifications',
  Profile: 'person',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Leads: 'Leads',
  Applications: 'Applied',
  Notifications: 'Alerts',
  Profile: 'Profile',
};

// Bottom Tab Navigator
const TeacherTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 16);
  return (
    <Tab.Navigator
      id="TeacherTabNavigator"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const iconName = TAB_ICONS[route.name] || 'help-circle';
          return (
            <View style={focused ? tabStyles.activeIcon : tabStyles.inactiveIcon}>
              <Ionicons
                name={iconName as any}
                size={22}
                color={focused ? '#FFFFFF' : colors.textSecondary}
              />
            </View>
          );
        },
        tabBarLabel: TAB_LABELS[route.name] || route.name,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [tabStyles.bar, { bottom: bottomOffset }],
        tabBarLabelStyle: tabStyles.label,
        tabBarItemStyle: tabStyles.item,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={TeacherDashboardScreen} />
      <Tab.Screen name="Leads" component={TeacherRequirementsScreen} />
      <Tab.Screen name="Applications" component={TeacherApplicationsDashboardScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} />
    </Tab.Navigator>
  );
};

// Drawer Navigator
const TeacherDrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      id="TeacherDrawerNavigator"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: colors.card,
          width: 280,
        },
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        headerShown: false,
      }}
    >
      <Drawer.Screen 
        name="TeacherTabs" 
        component={TeacherTabNavigator}
        options={{ drawerLabel: () => null }}
      />
    </Drawer.Navigator>
  );
};

// Stack Navigator for modal screens
const TeacherNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id="TeacherStackNavigator"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="TeacherMain" 
        component={TeacherDrawerNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="TeacherNotifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerRight: () => <BellButton />,
        }}
      />
      <Stack.Screen
        name="LocationMap"
        component={LocationMapScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupportFAQ"
        component={FAQScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTicket"
        component={CreateTicketScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DataManagement"
        component={DataManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AvailabilitySettings"
        component={AvailabilitySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ComingSoon"
        component={ComingSoonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WalletHistory"
        component={WalletHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LiveClasses"
        component={LiveClassesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpcomingClasses"
        component={UpcomingClassesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClassHistory"
        component={ClassHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseMarketplace"
        component={CourseMarketplaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseCategories"
        component={CourseCategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseDetails"
        component={CourseDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyCourses"
        component={MyCoursesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DemoRequests"
        component={TutorDemoRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DemoRequestsDashboard"
        component={TeacherDemoRequestsDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DemoRequestDetail"
        component={TeacherDemoRequestDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DemoCalendar"
        component={TeacherDemoCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherOnboarding"
        component={TeacherOnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherOnboardingSteps"
        component={TeacherOnboardingNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherDocuments"
        component={TeacherDocumentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherVerification"
        component={TeacherVerificationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherPreferences"
        component={TeacherPreferencesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherAvailability"
        component={TeacherAvailabilityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RequirementDetail"
        component={TeacherRequirementDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplyToRequirement"
        component={ApplyToRequirementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplicationDetail"
        component={TeacherApplicationDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplicationSuccess"
        component={ApplicationSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherSubscription"
        component={TeacherSubscriptionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherCredits"
        component={TeacherCreditsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreditPacks"
        component={CreditPacksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherAnalytics"
        component={TeacherAnalyticsDashboardScreen}
        options={{
          headerShown: true,
          title: 'Analytics Dashboard',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerRight: () => <BellButton />,
        }}
      />
      <Stack.Screen
        name="TeacherEarnings"
        component={TeacherEarningsDashboardScreen}
        options={{
          headerShown: true,
          title: 'Earnings Dashboard',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerRight: () => <BellButton />,
        }}
      />
      <Stack.Screen
        name="TeacherKyc"
        component={TeacherKycScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherKycStatus"
        component={TeacherKycStatusScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: 0,
    ...shadows.float,
  },
  item: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeacherNavigator;
