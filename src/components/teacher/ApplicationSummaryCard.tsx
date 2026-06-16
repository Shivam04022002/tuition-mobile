import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface RequirementSummary {
  requirementId: string;
  studentDetails: {
    studentName?: string;
    grade: string;
    board: string;
  };
  subjects: string[];
  tuitionType: string;
  location: {
    city: string;
    address?: string;
  };
  budget: {
    minAmount: number;
    maxAmount: number;
    negotiationAllowed: boolean;
  };
  matchScore: number;
}

interface TeacherProfileSummary {
  fullName: string;
  subjects: string[];
  classes: string[];
  hourlyRate: number;
  experienceYears: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  profileCompletion: number;
}

interface ApplicationSummaryCardProps {
  requirement: RequirementSummary;
  teacherProfile: TeacherProfileSummary;
}

const getMatchColor = (score: number): string => {
  if (score >= 90) return colors.success;
  if (score >= 75) return colors.primary;
  if (score >= 60) return colors.accent;
  return colors.textSecondary;
};

const getMatchLabel = (score: number): string => {
  if (score >= 90) return 'Excellent Match';
  if (score >= 75) return 'Good Match';
  if (score >= 60) return 'Fair Match';
  return 'Low Match';
};

const tuitionLabel = (type: string): string =>
  ({ home: 'Home Tuition', online: 'Online', group: 'Group', crash: 'Crash Course' }[type] || type);

const ApplicationSummaryCard: React.FC<ApplicationSummaryCardProps> = ({
  requirement,
  teacherProfile,
}) => {
  const matchColor = getMatchColor(requirement.matchScore);
  const matchLabel = getMatchLabel(requirement.matchScore);

  return (
    <View style={styles.container}>
      {/* Match Score Header */}
      <View style={[styles.matchHeader, { borderColor: matchColor + '40' }]}>
        <View style={styles.matchLeft}>
          <Text style={styles.reqId}>{requirement.requirementId}</Text>
          <Text style={styles.reqSub}>
            {requirement.studentDetails.grade} • {requirement.subjects.slice(0, 2).join(', ')}
            {requirement.subjects.length > 2 && ` +${requirement.subjects.length - 2}`}
          </Text>
        </View>
        <View style={[styles.matchBadge, { backgroundColor: matchColor + '18', borderColor: matchColor + '40' }]}>
          <Text style={[styles.matchPct, { color: matchColor }]}>{requirement.matchScore}%</Text>
          <Text style={[styles.matchLabel, { color: matchColor }]}>{matchLabel}</Text>
        </View>
      </View>

      {/* Requirement Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school-outline" size={14} color={colors.primary} />
          <Text style={styles.sectionTitle}>Requirement</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mode</Text>
          <Text style={styles.detailValue}>{tuitionLabel(requirement.tuitionType)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{requirement.location.city}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Budget</Text>
          <Text style={styles.detailValue}>
            ₹{requirement.budget.minAmount.toLocaleString()}–₹{requirement.budget.maxAmount.toLocaleString()}/mo
            {requirement.budget.negotiationAllowed && (
              <Text style={styles.negotiable}> (Negotiable)</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Teacher Profile Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={14} color={colors.primary} />
          <Text style={styles.sectionTitle}>Your Profile</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{teacherProfile.fullName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Teaching</Text>
          <Text style={styles.detailValue}>
            {teacherProfile.subjects.slice(0, 3).join(', ')}
            {teacherProfile.subjects.length > 3 && ` +${teacherProfile.subjects.length - 3}`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rate</Text>
          <Text style={styles.detailValue}>₹{teacherProfile.hourlyRate.toLocaleString()}/hr</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Experience</Text>
          <Text style={styles.detailValue}>{teacherProfile.experienceYears} years</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  matchLeft: {
    flex: 1,
  },
  reqId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  reqSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  matchBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  matchPct: {
    fontSize: 18,
    fontWeight: '800',
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  negotiable: {
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
});

export default ApplicationSummaryCard;
