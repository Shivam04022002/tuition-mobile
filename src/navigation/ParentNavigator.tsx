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
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import TutorsScreen from '../screens/parent/TutorsScreen';
import RequirementsScreen from '../screens/parent/RequirementsScreen';
import NotificationsScreen from '../screens/parent/NotificationsScreen';
import ParentProfileScreen from '../screens/parent/ParentProfileScreen';
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
import ComingSoonScreen from '../screens/settings/ComingSoonScreen';

// Wallet Screens
import WalletScreen from '../screens/wallet/WalletScreen';
import WalletHistoryScreen from '../screens/wallet/WalletHistoryScreen';

// Live Classes Screens
import LiveClassesScreen from '../screens/liveClasses/LiveClassesScreen';
import UpcomingClassesScreen from '../screens/liveClasses/UpcomingClassesScreen';
import ClassHistoryScreen from '../screens/liveClasses/ClassHistoryScreen';

// Requirement Form & Detail
import ParentRequirementFormScreen from '../screens/parent/ParentRequirementFormScreen';
import RequirementDetailScreen from '../screens/parent/RequirementDetailScreen';

// Application Screens
import ApplicationsListScreen from '../screens/parent/ApplicationsListScreen';
import ApplicationDetailScreen from '../screens/parent/ApplicationDetailScreen';
import DemoSchedulingScreen from '../screens/parent/DemoSchedulingScreen';

// Hiring Workflow Screens (Sprint 3.21)
import ParentHiringDashboardScreen from '../screens/parent/ParentHiringDashboardScreen';
import ParentApplicationReviewScreen from '../screens/parent/ParentApplicationReviewScreen';

// Recommended Tutors Screens
import RecommendedTutorsScreen from '../screens/parent/RecommendedTutorsScreen';
import TutorProfileScreen from '../screens/parent/TutorProfileScreen';
import TutorSearchScreen from '../screens/parent/TutorSearchScreen';
import TutorReviewsScreen from '../screens/parent/TutorReviewsScreen';

// Shortlisted & Demo Classes Screens
import ShortlistedTutorsScreen from '../screens/parent/ShortlistedTutorsScreen';
import DemoClassesScreen from '../screens/parent/DemoClassesScreen';

// Contact History Screen
import ContactHistoryScreen from '../screens/parent/ContactHistoryScreen';

// Course Marketplace Screens
import CourseMarketplaceScreen from '../screens/courses/CourseMarketplaceScreen';
import CourseCategoriesScreen from '../screens/courses/CourseCategoriesScreen';
import CourseDetailsScreen from '../screens/courses/CourseDetailsScreen';
import MyCoursesScreen from '../screens/courses/MyCoursesScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Bell header button
const ParentBellButton: React.FC = () => {
  const token = useSelector(selectAuthToken) ?? '';
  const nav   = useNavigation<any>();
  return (
    <NotificationBell
      token={token}
      color={colors.text}
      onPress={() => nav.navigate('ParentNotifications')}
    />
  );
};

const TAB_ICONS: Record<string, string> = {
  Home: 'home',
  Tutors: 'search',
  Requirements: 'document-text',
  Notifications: 'notifications',
  Profile: 'person',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Tutors: 'Tutors',
  Requirements: 'Jobs',
  Notifications: 'Alerts',
  Profile: 'Profile',
};

// Bottom Tab Navigator
const ParentTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 16);
  return (
    <Tab.Navigator
      id="ParentTabNavigator"
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
      <Tab.Screen name="Home" component={ParentDashboardScreen} />
      <Tab.Screen name="Tutors" component={TutorsScreen} />
      <Tab.Screen name="Requirements" component={RequirementsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ParentProfileScreen} />
    </Tab.Navigator>
  );
};

// Drawer Navigator
const ParentDrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      id="ParentDrawerNavigator"
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
        name="ParentTabs" 
        component={ParentTabNavigator}
        options={{ drawerLabel: () => null }}
      />
    </Drawer.Navigator>
  );
};

// Stack Navigator for modal screens
const ParentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id="ParentStackNavigator"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ParentMain" 
        component={ParentDrawerNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="ParentNotifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerRight: () => <ParentBellButton />,
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
        name="ParentRequirementForm"
        component={ParentRequirementFormScreen}
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="RequirementDetail"
        component={RequirementDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Applications"
        component={ApplicationsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplicationDetail"
        component={ApplicationDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DemoScheduling"
        component={DemoSchedulingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecommendedTutors"
        component={RecommendedTutorsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TutorProfile"
        component={TutorProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TutorReviews"
        component={TutorReviewsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TutorSearch"
        component={TutorSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Shortlisted"
        component={ShortlistedTutorsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DemoClasses"
        component={DemoClassesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactHistory"
        component={ContactHistoryScreen}
        options={{ headerShown: false }}
      />
      {/* Hiring Workflow Screens (Sprint 3.21) */}
      <Stack.Screen
        name="ParentHiringDashboard"
        component={ParentHiringDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ParentApplicationReview"
        component={ParentApplicationReviewScreen}
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

export default ParentNavigator;
