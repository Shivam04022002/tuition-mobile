import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ==================== TYPES ====================

export interface SubjectExperience {
  subject: string;
  yearsExperience: number;
}

export interface TeachingPreferences {
  subjects: string[];
  classes: string[];
  boards: string[];
  teachingModes: string[];
  subjectExperience: SubjectExperience[];
  studentTypes: string[];
  teachingLevel: string[];
  examPreparation: string[];
  specialization: string;
  groupTuitionOption: boolean;
  groupSize: number;
  groupRate: number;
  experienceYears?: number;
}

export interface ClassGroup {
  group: string;
  values: string[];
}

export interface ReferenceData {
  subjects: string[];
  boards: string[];
  teachingModes: string[];
  studentTypes: string[];
  teachingLevels: string[];
  examPreparation: string[];
}

export interface ClassesReferenceData {
  classGroups: ClassGroup[];
  allClasses: string[];
}

// ==================== API FUNCTIONS ====================

export const getPreferences = async (token: string): Promise<TeachingPreferences> => {
  const response = await fetch(`${API_BASE_URL}/teachers/preferences`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();

  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to load teaching preferences');
  }

  return json.data as TeachingPreferences;
};

export const updatePreferences = async (
  token: string,
  updates: Partial<TeachingPreferences>
): Promise<TeachingPreferences> => {
  const response = await fetch(`${API_BASE_URL}/teachers/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const json = await response.json();

  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to update teaching preferences');
  }

  return json.data as TeachingPreferences;
};

export const getSubjectsReference = async (): Promise<ReferenceData> => {
  const response = await fetch(`${API_BASE_URL}/teachers/subjects`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to load subjects reference');
  }

  return json.data as ReferenceData;
};

export const getClassesReference = async (): Promise<ClassesReferenceData> => {
  const response = await fetch(`${API_BASE_URL}/teachers/classes`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to load classes reference');
  }

  return json.data as ClassesReferenceData;
};

// ==================== STATIC FALLBACK DATA ====================
// Used as offline / before-fetch fallback so selectors never render empty

export const FALLBACK_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
  'Science', 'Social Studies', 'Computer Science', 'Accounts', 'Economics',
  'Business Studies', 'History', 'Geography', 'Civics', 'French', 'German',
  'Sanskrit', 'Physical Education', 'Arts', 'Environmental Studies',
  'IELTS', 'Spoken English', 'Coding', 'Robotics',
];

export const FALLBACK_BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'NIOS'];

export const FALLBACK_CLASS_GROUPS: ClassGroup[] = [
  { group: 'Class 1–5', values: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
  { group: 'Class 6–8', values: ['Class 6', 'Class 7', 'Class 8'] },
  { group: 'Class 9–10', values: ['Class 9', 'Class 10'] },
  { group: 'Class 11–12', values: ['Class 11', 'Class 12'] },
  { group: 'College', values: ['College Level', 'Undergraduate', 'Postgraduate'] },
  { group: 'Competitive Exams', values: ['JEE', 'NEET', 'CUET', 'UPSC', 'SSC', 'Banking', 'State Exams'] },
];

export const TEACHING_MODE_OPTIONS = [
  { value: 'online', label: 'Online', icon: 'laptop-outline', description: 'Teach from anywhere' },
  { value: 'student_home', label: "Student's Home", icon: 'home-outline', description: "Visit student's location" },
  { value: 'own_home', label: 'Your Home', icon: 'business-outline', description: 'Students come to you' },
  { value: 'group', label: 'Group Classes', icon: 'people-outline', description: 'Multiple students together' },
];

export const STUDENT_TYPE_OPTIONS = [
  { value: 'school_students', label: 'School Students', icon: 'school-outline' },
  { value: 'college_students', label: 'College Students', icon: 'library-outline' },
  { value: 'competitive_exams', label: 'Competitive Exams', icon: 'trophy-outline' },
  { value: 'working_professionals', label: 'Working Professionals', icon: 'briefcase-outline' },
];

export const TEACHING_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner', color: '#10B981' },
  { value: 'intermediate', label: 'Intermediate', color: '#F59E0B' },
  { value: 'advanced', label: 'Advanced', color: '#EF4444' },
];

export const EXAM_PREPARATION_OPTIONS = [
  'JEE', 'NEET', 'CUET', 'UPSC', 'SSC', 'Banking', 'State Exams',
];
