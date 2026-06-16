import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

interface TutorQualificationsProps {
  highestQualification: string;
  degree: string;
  university: string;
  yearOfCompletion?: number;
  certifications: Certification[];
}

const TutorQualifications: React.FC<TutorQualificationsProps> = ({
  highestQualification,
  degree,
  university,
  yearOfCompletion,
  certifications,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Qualifications</Text>

      {/* Primary Education */}
      <View style={styles.educationCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="school-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.educationInfo}>
          <Text style={styles.degreeName}>{degree || highestQualification}</Text>
          <Text style={styles.universityName}>{university}</Text>
          {yearOfCompletion ? (
            <Text style={styles.yearText}>Completed {yearOfCompletion}</Text>
          ) : null}
        </View>
      </View>

      {/* Certifications */}
      {certifications.length > 0 && (
        <View style={styles.certSection}>
          <Text style={styles.certTitle}>Certifications</Text>
          {certifications.map((cert, index) => (
            <View key={`cert-${index}`} style={styles.certItem}>
              <Ionicons name="ribbon-outline" size={16} color={colors.accent} />
              <View style={styles.certInfo}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certIssuer}>
                  {cert.issuer} • {cert.year}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  educationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  degreeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  universityName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  yearText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  certSection: {
    marginTop: 16,
  },
  certTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  certInfo: {
    marginLeft: 10,
    flex: 1,
  },
  certName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  certIssuer: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
});

export default memo(TutorQualifications);
