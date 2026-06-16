import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const mockTutors = [
  { id: '1', name: 'John Doe', subject: 'Mathematics', rating: 4.5 },
  { id: '2', name: 'Jane Smith', subject: 'Physics', rating: 4.8 },
  { id: '3', name: 'Bob Johnson', subject: 'Chemistry', rating: 4.2 },
];

const TutorsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleSearchPress = () => {
    navigation.navigate('TutorSearch');
  };

  const renderTutor = ({ item }: { item: typeof mockTutors[0] }) => (
    <TouchableOpacity style={styles.tutorCard}>
      <Text style={styles.tutorName}>{item.name}</Text>
      <Text style={styles.tutorSubject}>{item.subject}</Text>
      <Text style={styles.tutorRating}>⭐ {item.rating}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Tutors</Text>
      
      {/* Search Entry Point */}
      <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress} activeOpacity={0.7}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>Search tutors, subjects, cities...</Text>
      </TouchableOpacity>

      <FlatList
        data={mockTutors}
        renderItem={renderTutor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.card,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  tutorCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tutorSubject: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tutorRating: {
    fontSize: 14,
    color: colors.warning,
    marginTop: 4,
  },
});

export default TutorsScreen;
