import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const mockTutors = [
  { id: '1', name: 'Dr. Sarah Johnson', subject: 'Mathematics', rating: 4.9, verified: true },
  { id: '2', name: 'Prof. Mike Chen', subject: 'Physics', rating: 4.7, verified: true },
  { id: '3', name: 'Emily Davis', subject: 'Chemistry', rating: 4.5, verified: false },
];

const AdminTutorsScreen: React.FC = () => {
  const renderTutor = ({ item }: { item: typeof mockTutors[0] }) => (
    <View style={styles.tutorCard}>
      <Text style={styles.tutorName}>{item.name}</Text>
      <Text style={styles.tutorSubject}>{item.subject}</Text>
      <View style={styles.tutorMeta}>
        <Text style={styles.tutorRating}>⭐ {item.rating}</Text>
        <Text style={[styles.verificationBadge, item.verified ? styles.verified : styles.pending]}>
          {item.verified ? 'Verified' : 'Pending'}
        </Text>
      </View>
      {!item.verified && (
        <TouchableOpacity style={styles.verifyButton}>
          <Text style={styles.verifyButtonText}>Verify Tutor</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tutor Management</Text>
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
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  tutorCard: {
    backgroundColor: '#fff',
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
  },
  tutorSubject: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tutorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  tutorRating: {
    fontSize: 14,
    color: '#f39c12',
  },
  verificationBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verified: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  pending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdminTutorsScreen;
