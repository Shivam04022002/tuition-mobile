import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

interface StudentDetails {
  studentName: string;
  grade: string;
  board: string;
  genderPreference: string;
  multipleChildren: boolean;
  children: Array<{
    name: string;
    grade: string;
    board: string;
  }>;
}

type RootStackParamList = {
  Step2SubjectsPreferences: { studentDetails: StudentDetails };
};

type Step1NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step2SubjectsPreferences'>;

const Step1StudentDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<Step1NavigationProp>();
  
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [board, setBoard] = useState('');
  const [genderPreference, setGenderPreference] = useState('any');
  const [multipleChildren, setMultipleChildren] = useState(false);
  const [children, setChildren] = useState([{ name: '', grade: '', board: '' }]);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const grades = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ];

  const boards = [
    'CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'
  ];

  const genderOptions = [
    { value: 'any', label: 'No Preference' },
    { value: 'male', label: 'Male Tutor' },
    { value: 'female', label: 'Female Tutor' },
  ];

  const addChild = () => {
    setChildren([...children, { name: '', grade: '', board: '' }]);
  };

  const updateChild = (index: number, field: string, value: string) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (multipleChildren) {
      return children.every(child => child.name && child.grade && child.board);
    } else {
      return studentName && grade && board;
    }
  };

  const handleNext = () => {
    if (!validateForm()) {
      alert('Please fill all required fields');
      return;
    }

    const studentDetails: StudentDetails = {
      studentName,
      grade,
      board,
      genderPreference,
      multipleChildren,
      children,
    };

    navigation.navigate('Step2SubjectsPreferences', { studentDetails });
  };

  const renderChildForm = (child: typeof children[0], index: number) => (
    <Card key={index} variant="outlined" margin="small" style={styles.childCard}>
      <View style={styles.childHeader}>
        <Text style={[styles.childTitle, { color: theme.colors.text }]}>
          Child {index + 1}
        </Text>
        {multipleChildren && children.length > 1 && (
          <TouchableOpacity
            onPress={() => removeChild(index)}
            style={styles.removeButton}
          >
            <Text style={[styles.removeText, { color: theme.colors.error }]}>
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Input
        label="Student Name"
        placeholder="Enter student name"
        value={child.name}
        onChangeText={(value) => updateChild(index, 'name', value)}
        required
      />
      
      <Input
        label="Grade/Class"
        placeholder="Select grade"
        value={child.grade}
        onChangeText={setGrade}
      />
      
      <Input
        label="Board"
        placeholder="Select board"
        value={child.board}
        onChangeText={setBoard}
      />
    </Card>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: '20%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 1 of 5 - Student Details
        </Text>
      </View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Tell us about your child
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          This helps us find the perfect tutor for their learning needs
        </Text>
      </Animated.View>

      {/* Multiple Children Toggle */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card variant="outlined" margin="small">
          <TouchableOpacity
            style={styles.toggleOption}
            onPress={() => setMultipleChildren(!multipleChildren)}
          >
            <View style={[
              styles.checkbox,
              { 
                backgroundColor: multipleChildren ? theme.colors.primary : theme.colors.card,
                borderColor: theme.colors.border 
              }
            ]}>
              {multipleChildren && (
                <Text style={[styles.checkmark, { color: theme.colors.textWhite }]}>
                  ✓
                </Text>
              )}
            </View>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
              I need tutors for multiple children
            </Text>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      {/* Student Form(s) */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {multipleChildren ? (
          <View>
            {children.map((child, index) => renderChildForm(child, index))}
            <TouchableOpacity
              style={[styles.addChildButton, { borderColor: theme.colors.primary }]}
              onPress={addChild}
            >
              <Text style={[styles.addChildText, { color: theme.colors.primary }]}>
                + Add Another Child
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Card variant="outlined" margin="small">
            <Input
              label="Student Name"
              placeholder="Enter student name"
              value={studentName}
              onChangeText={setStudentName}
              required
            />
            
            <Input
              label="Grade/Class"
              placeholder="Select grade"
              value={grade}
              onChangeText={setGrade}
            />
            
            <Input
              label="Board"
              placeholder="Select board"
              value={board}
              onChangeText={setBoard}
            />
          </Card>
        )}
      </Animated.View>

      {/* Gender Preference */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Gender Preference (Optional)
        </Text>
        <Card variant="outlined" margin="small">
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.genderOption}
              onPress={() => setGenderPreference(option.value)}
            >
              <View style={[
                styles.radioCircle,
                { 
                  backgroundColor: genderPreference === option.value ? theme.colors.primary : theme.colors.card,
                  borderColor: theme.colors.border 
                }
              ]}>
                {genderPreference === option.value && (
                  <View style={[styles.radioDot, { backgroundColor: theme.colors.textWhite }]} />
                )}
              </View>
              <Text style={[styles.genderLabel, { color: theme.colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Button
          title="Continue to Subjects"
          variant="primary"
          size="large"
          onPress={handleNext}
          fullWidth
        />
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 16,
    flex: 1,
  },
  childCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  childTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addChildButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addChildText: {
    fontSize: 16,
    fontWeight: '600',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  genderLabel: {
    fontSize: 16,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step1StudentDetailsScreen;
