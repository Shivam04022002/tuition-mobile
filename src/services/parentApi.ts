import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// Types
export interface ParentProfile {
  id: string;
  role: string;
  profile: {
    parentName: string;
    mobileNumber: string;
    email: string;
  };
  isProfileComplete: boolean;
}

export interface Requirement {
  id: string;
  requirementId: string;
  studentDetails: {
    studentName: string;
    age: number;
    grade: string;
    board: string;
    schoolName: string;
    genderPreference: string;
  };
  subjects: string[];
  tuitionType: string;
  location: {
    city: string;
    teachingRadius: number;
  };
  schedule: {
    daysPerWeek: string;
    preferredTimings: string[];
  };
  budget: {
    minAmount: number;
    maxAmount: number;
  };
  status: 'active' | 'closed' | 'in_progress';
  createdAt: string;
}

export interface TutorApplication {
  id: string;
  tutorId: string;
  tutorName: string;
  qualification: string;
  experience: number;
  rating: number;
  subjects: string[];
  profileImage: string;
  appliedDate: string;
  status: 'pending' | 'shortlisted' | 'rejected';
}

export interface DashboardStats {
  activeRequirements: number;
  applicationsReceived: number;
  shortlistedTutors: number;
  demosScheduled: number;
}

export interface UpcomingDemo {
  id: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// API Functions
export const getParentProfile = async (token: string): Promise<ParentProfile> => {
  const response = await fetch(`${API_BASE_URL}/parents/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

export const getParentRequirements = async (token: string): Promise<Requirement[]> => {
  const response = await fetch(`${API_BASE_URL}/parents/requirements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch requirements');
  return response.json();
};

export const getParentApplications = async (token: string): Promise<TutorApplication[]> => {
  const response = await fetch(`${API_BASE_URL}/applications/parent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch applications');
  const data = await response.json();
  return data.data?.applications || [];
};

export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/applications/stats/parent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  const data = await response.json();
  return data.data || {};
};

export const getParentDashboard = async (token: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/parent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  const data = await response.json();
  return data.data || {};
};

export const getUpcomingDemos = async (token: string): Promise<UpcomingDemo[]> => {
  const response = await fetch(`${API_BASE_URL}/demo-classes/parent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch demos');
  const data = await response.json();
  return data.data || [];
};

// Get AI-recommended tutors from TutorMatch collection (verified tutors only)
export const getRecommendedTutors = async (token: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/matches/parent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch recommended tutors');
  const data = await response.json();
  return data.data || [];
};

export const closeRequirement = async (token: string, requirementId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parents/requirements/${requirementId}/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to close requirement');
};

export const shortlistTutor = async (token: string, applicationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parents/applications/${applicationId}/shortlist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to shortlist tutor');
};

export const rejectTutor = async (token: string, applicationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parents/applications/${applicationId}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to reject tutor');
};

export const rescheduleDemo = async (token: string, demoId: string, newDate: string, newTime: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parents/demos/${demoId}/reschedule`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date: newDate, time: newTime }),
  });
  if (!response.ok) throw new Error('Failed to reschedule demo');
};

export const cancelDemo = async (token: string, demoId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parents/demos/${demoId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to cancel demo');
};
