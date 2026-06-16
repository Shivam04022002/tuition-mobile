import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const mockLeads = [
  { id: '1', subject: 'Mathematics', location: 'Delhi', budget: '₹500/hr' },
  { id: '2', subject: 'Physics', location: 'Mumbai', budget: '₹600/hr' },
  { id: '3', subject: 'Chemistry', location: 'Bangalore', budget: '₹450/hr' },
];

const LeadsScreen: React.FC = () => {
  const renderLead = ({ item }: { item: typeof mockLeads[0] }) => (
    <TouchableOpacity style={styles.leadCard}>
      <Text style={styles.leadSubject}>{item.subject}</Text>
      <Text style={styles.leadLocation}>📍 {item.location}</Text>
      <Text style={styles.leadBudget}>{item.budget}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Leads</Text>
      <FlatList
        data={mockLeads}
        renderItem={renderLead}
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
  leadCard: {
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
  leadSubject: {
    fontSize: 18,
    fontWeight: '600',
  },
  leadLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  leadBudget: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default LeadsScreen;
