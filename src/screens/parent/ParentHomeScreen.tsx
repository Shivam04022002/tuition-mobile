import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectUserProfile } from '../../redux/slices/userSlice';
import { useTheme } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const { width } = Dimensions.get('window');

interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  classes: string[];
  rating: number;
  experience: number;
  price: number;
  distance: number;
  verified: boolean;
  responseTime: string;
  profileImage: string;
}

interface Requirement {
  id: string;
  subject: string;
  class: string;
  status: string;
  postedDate: string;
  responses: number;
}

const ParentHomeScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const verifiedTutors: Tutor[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      subjects: ['Mathematics', 'Physics'],
      classes: ['Class 10', 'Class 11'],
      rating: 4.8,
      experience: 5,
      price: 500,
      distance: 2.5,
      verified: true,
      responseTime: '30 min',
      profileImage: 'https://via.placeholder.com/60',
    },
    {
      id: '2',
      name: 'Rahul Verma',
      subjects: ['Chemistry', 'Biology'],
      classes: ['Class 9', 'Class 10'],
      rating: 4.9,
      experience: 7,
      price: 600,
      distance: 3.2,
      verified: true,
      responseTime: '15 min',
      profileImage: 'https://via.placeholder.com/60',
    },
  ];

  const recommendedTutors: Tutor[] = [
    {
      id: '3',
      name: 'Anjali Patel',
      subjects: ['English', 'History'],
      classes: ['Class 8', 'Class 9'],
      rating: 4.7,
      experience: 4,
      price: 450,
      distance: 1.8,
      verified: true,
      responseTime: '45 min',
      profileImage: 'https://via.placeholder.com/60',
    },
    {
      id: '4',
      name: 'Vikram Singh',
      subjects: ['Mathematics', 'Science'],
      classes: ['Class 6', 'Class 7'],
      rating: 4.6,
      experience: 3,
      price: 400,
      distance: 4.1,
      verified: false,
      responseTime: '1 hour',
      profileImage: 'https://via.placeholder.com/60',
    },
  ];

  const recentRequirements: Requirement[] = [
    {
      id: '1',
      subject: 'Mathematics',
      class: 'Class 10',
      status: 'Active',
      postedDate: '2 days ago',
      responses: 5,
    },
    {
      id: '2',
      subject: 'Physics',
      class: 'Class 11',
      status: 'Closed',
      postedDate: '1 week ago',
      responses: 8,
    },
  ];

  const promotionalBanners = [
    {
      id: '1',
      title: 'Summer Special',
      subtitle: 'Get 20% off on first month',
      color: theme.colors.primary,
    },
    {
      id: '2',
      title: 'Verified Tutors',
      subtitle: 'Learn from the best',
      color: theme.colors.secondary,
    },
  ];

  const quickActions = [
    { id: '1', title: 'Post Requirement', icon: 'add-circle', color: theme.colors.primary },
    { id: '2', title: 'Find Tutors', icon: 'search', color: theme.colors.secondary },
    { id: '3', title: 'My Requirements', icon: 'assignment', color: theme.colors.accent },
    { id: '4', title: 'Shortlisted', icon: 'favorite', color: theme.colors.error },
  ];

  const renderTutorCard = (tutor: Tutor, index: number) => (
    <Card key={tutor.id} variant="elevated" margin="small" style={styles.tutorCard}>
      <View style={styles.tutorCardHeader}>
        <Image source={{ uri: tutor.profileImage }} style={styles.tutorImage} />
        <View style={styles.tutorInfo}>
          <View style={styles.tutorNameRow}>
            <Text style={[styles.tutorName, { color: theme.colors.text }]}>
              {tutor.name}
            </Text>
            {tutor.verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={[styles.verifiedText, { color: theme.colors.textWhite }]}>
                  ✓ Verified
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tutorSubjects, { color: theme.colors.textSecondary }]}>
            {tutor.subjects.join(', ')}
          </Text>
          <Text style={[styles.tutorClasses, { color: theme.colors.textTertiary }]}>
            {tutor.classes.join(', ')}
          </Text>
        </View>
      </View>
      
      <View style={styles.tutorStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ⭐ {tutor.rating}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Rating
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {tutor.experience}y
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Experience
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ₹{tutor.price}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            /hour
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {tutor.distance}km
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Distance
          </Text>
        </View>
      </View>
      
      <View style={styles.tutorActions}>
        <Text style={[styles.responseTime, { color: theme.colors.textSecondary }]}>
          Responds in {tutor.responseTime}
        </Text>
        <View style={styles.actionButtons}>
          <Button
            title="View Profile"
            variant="outline"
            size="small"
            onPress={() => console.log('View profile:', tutor.id)}
          />
          <Button
            title="Shortlist"
            variant="primary"
            size="small"
            onPress={() => console.log('Shortlist:', tutor.id)}
          />
        </View>
      </View>
    </Card>
  );

  const renderRequirementCard = (requirement: Requirement) => (
    <Card key={requirement.id} variant="outlined" margin="small" style={styles.requirementCard}>
      <View style={styles.requirementHeader}>
        <Text style={[styles.requirementSubject, { color: theme.colors.text }]}>
          {requirement.subject}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: requirement.status === 'Active' ? theme.colors.success : theme.colors.textLight }
        ]}>
          <Text style={[
            styles.statusText,
            { color: requirement.status === 'Active' ? theme.colors.textWhite : theme.colors.textTertiary }
          ]}>
            {requirement.status}
          </Text>
        </View>
      </View>
      <Text style={[styles.requirementClass, { color: theme.colors.textSecondary }]}>
        {requirement.class}
      </Text>
      <View style={styles.requirementFooter}>
        <Text style={[styles.requirementDate, { color: theme.colors.textTertiary }]}>
          {requirement.postedDate}
        </Text>
        <Text style={[styles.requirementResponses, { color: theme.colors.primary }]}>
          {requirement.responses} responses
        </Text>
      </View>
    </Card>
  );

  const renderBanner = (banner: typeof promotionalBanners[0]) => (
    <Card key={banner.id} margin="small" style={[styles.banner, { backgroundColor: banner.color }]}>
      <Text style={[styles.bannerTitle, { color: theme.colors.textWhite }]}>
        {banner.title}
      </Text>
      <Text style={[styles.bannerSubtitle, { color: theme.colors.textWhite }]}>
        {banner.subtitle}
      </Text>
    </Card>
  );

  const renderQuickAction = (action: typeof quickActions[0]) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickAction, { backgroundColor: action.color }]}
      onPress={() => console.log('Quick action:', action.title)}
    >
      <Text style={[styles.quickActionIcon, { color: theme.colors.textWhite }]}>
        {action.icon}
      </Text>
      <Text style={[styles.quickActionTitle, { color: theme.colors.textWhite }]}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Welcome Header */}
      <View style={[styles.welcomeHeader, { backgroundColor: theme.colors.card }]}>
        <View>
          <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {userProfile?.firstName || 'Parent'}!
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationBell}>
          <Text style={[styles.bellIcon, { color: theme.colors.text }]}>
            🔔
          </Text>
          <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={[styles.badgeText, { color: theme.colors.textWhite }]}>
              3
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search for tutors, subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          variant="outlined"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>
      </View>

      {/* Promotional Banners */}
      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {promotionalBanners.map(renderBanner)}
        </ScrollView>
      </View>

      {/* Verified Tutors Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Verified Tutors
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={verifiedTutors}
          renderItem={({ item, index }) => renderTutorCard(item, index)}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Recommended Tutors Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recommended for You
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recommendedTutors}
          renderItem={({ item, index }) => renderTutorCard(item, index)}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Recent Requirements Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Requirements
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentRequirements}
          renderItem={({ item }) => renderRequirementCard(item)}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationBell: {
    position: 'relative',
  },
  bellIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  quickAction: {
    width: (width - 60) / 2,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  banner: {
    width: width - 40,
    height: 120,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  tutorCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tutorCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tutorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  tutorInfo: {
    flex: 1,
  },
  tutorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tutorSubjects: {
    fontSize: 14,
    marginBottom: 2,
  },
  tutorClasses: {
    fontSize: 12,
  },
  tutorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  tutorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseTime: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  requirementCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementSubject: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementClass: {
    fontSize: 14,
    marginBottom: 8,
  },
  requirementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requirementDate: {
    fontSize: 12,
  },
  requirementResponses: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ParentHomeScreen;
