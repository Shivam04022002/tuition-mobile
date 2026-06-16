import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ==================== TYPES ====================

export interface TeacherProfile {
  _id: string;
  userId: string;
  basicDetails: {
    fullName: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string;
    mobileNumber: string;
    email: string;
    languages: string[];
    profilePhoto: string;
  };
  education: {
    highestQualification: string;
    degree: string;
    university: string;
    yearOfCompletion: number;
    certifications: Array<{
      name: string;
      issuer: string;
      year: number;
      certificateUrl?: string;
    }>;
    status: 'completed' | 'pursuing';
  };
  teachingDetails: {
    subjects: string[];
    classes: string[];
    boards: string[];
    specialization: string;
    teachingModes: string[];
    groupTuitionOption: boolean;
    groupSize: number;
    groupRate: number;
    subjectExperience?: Array<{ subject: string; yearsExperience: number }>;
    studentTypes?: string[];
    teachingLevel?: string[];
    examPreparation?: string[];
  };
  locationAvailability: {
    address: string;
    city: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    preferredAreas: string[];
    preferredLocations?: Array<{
      area: string;
      city: string;
      latitude: number;
      longitude: number;
      radiusKm: number;
    }>;
    teachingRadius: number;
    availableDays: string[];
    availableTimeSlots: string[];
    vacationMode: boolean;
  };
  bio?: string;
  pricingRevenue: {
    hourlyRate: number;
    monthlyRate: number;
    currentRevenue: string;
    experienceYears: number;
    pricingStrategy: string;
    negotiationAllowed: boolean;
  };
  verificationDocuments: {
    aadhaarCard: string;
    panCard: string;
    qualificationDocuments: string[];
    introVideo?: string;
    portfolioPhotos: string[];
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  rejectionReason?: string;
  stats: {
    totalStudents: number;
    activeStudents: number;
    completedClasses: number;
    averageRating: number;
    totalReviews: number;
    totalEarnings: number;
    leadUnlocks: number;
    responseRate: number;
    responseTime: string;
  };
  preferences: {
    notifications: boolean;
    whatsappUpdates: boolean;
    emailUpdates: boolean;
    leadAlerts: boolean;
  };
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TutorMatch {
  _id: string;
  requirementId: string;
  matchId: string;
  overallScore: number;
  distanceKm?: number;
  teacherLocation?: {
    latitude: number;
    longitude: number;
  };
  teacherServiceRadius?: number;
  breakdown: {
    subjectScore: number;
    subjectMatchDetails: {
      requirementSubjects: string[];
      teacherSubjects: string[];
      matchedSubjects: string[];
      matchPercentage: number;
    };
    classScore: number;
    classMatchDetails: {
      requirementGrade: string;
      teacherClasses: string[];
      isMatch: boolean;
    };
    boardScore: number;
    budgetScore: number;
    locationScore: number;
    modeScore: number;
    timingScore: number;
  };
  status: 'recommended' | 'viewed' | 'applied' | 'shortlisted' | 'rejected' | 'hired' | 'expired';
  requirement?: {
    requirementId: string;
    studentDetails: {
      studentName: string;
      grade: string;
    };
    subjects: string[];
    board?: string;
    budget: {
      minAmount: number;
      maxAmount: number;
    };
    location: {
      city: string;
      pincode: string;
      latitude?: number;
      longitude?: number;
    };
    schedule: {
      daysPerWeek: string;
      preferredTimings: string[];
    };
    tuitionType: string;
  };
}

export interface TeacherApplication {
  _id: string;
  applicationId: string;
  parentRequirementId: string;
  teacherId: string;
  teacherProfileId: string;
  parentId: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  message?: string;
  proposedFee?: number;
  proposedSchedule?: {
    daysPerWeek: string;
    preferredTimeSlots: string[];
  };
  viewedByParent: boolean;
  viewedAt?: string;
  shortlistedAt?: string;
  rejectedAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  demoScheduled: boolean;
  demoId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentRequirement?: {
    requirementId: string;
    studentDetails: {
      studentName: string;
      grade: string;
    };
    subjects: string[];
    budget: {
      minAmount: number;
      maxAmount: number;
    };
    location: {
      city: string;
      address: string;
    };
    schedule: {
      daysPerWeek: string;
      preferredTimings: string[];
    };
    tuitionType: string;
  };
  parent?: {
    profile: {
      parentName: string;
      mobileNumber: string;
    };
  };
}

export interface DemoClass {
  _id: string;
  demoId: string;
  parentId: string;
  teacherId: string;
  teacherProfileId: string;
  requirementId: string;
  applicationId: string;
  studentDetails: {
    studentName: string;
    grade: string;
    subject: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  mode: 'online' | 'offline';
  meetingDetails?: {
    platform: string;
    meetingLink?: string;
    meetingId?: string;
    password?: string;
    address?: string;
  };
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  feedback?: {
    parentFeedback?: {
      rating: number;
      comment: string;
      isInterested: boolean;
      submittedAt: string;
    };
    teacherFeedback?: {
      rating: number;
      comment: string;
      isInterested: boolean;
      submittedAt: string;
    };
  };
  outcome?: 'interested' | 'not_interested' | 'pending';
  isActive: boolean;
  parent?: {
    profile: {
      parentName: string;
      mobileNumber: string;
    };
  };
  requirement?: {
    requirementId: string;
    subjects: string[];
  };
}

export interface DashboardStats {
  activeStudents: number;
  totalStudents: number;
  totalEarnings: number;
  averageRating: number;
  profileCompletion: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  tuitionRequestsAvailable: number;
  applicationsSent: number;
}

export interface DashboardData {
  stats: DashboardStats;
  matches: TutorMatch[];
  applications: TeacherApplication[];
  upcomingDemos: DemoClass[];
  activeStudents: any[];
}

// ==================== API FUNCTIONS ====================

// Get Teacher Profile
export const getTeacherProfile = async (token: string): Promise<TeacherProfile> => {
  const response = await fetch(`${API_BASE_URL}/teachers/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch profile');
  }
  const data = await response.json();
  return data.data || data;
};

// Get Teacher Dashboard Data
export const getTeacherDashboard = async (token: string): Promise<DashboardData> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/teacher`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch dashboard');
  }
  const data = await response.json();
  return data.data || data;
};

// Get Matching Leads for Teacher
export const getTeacherMatches = async (token: string, status?: string): Promise<TutorMatch[]> => {
  const url = status 
    ? `${API_BASE_URL}/matches/teacher?status=${status}`
    : `${API_BASE_URL}/matches/teacher`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch matches');
  }
  const data = await response.json();
  return data.data?.matches || [];
};

// Get Teacher Applications
export const getTeacherApplications = async (token: string, status?: string): Promise<TeacherApplication[]> => {
  const url = status 
    ? `${API_BASE_URL}/applications/teacher?status=${status}`
    : `${API_BASE_URL}/applications/teacher`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch applications');
  }
  const data = await response.json();
  return data.data?.applications || [];
};

// Get Teacher Demos
export const getTeacherDemos = async (token: string, status?: string): Promise<DemoClass[]> => {
  const url = status 
    ? `${API_BASE_URL}/demos/teacher?status=${status}`
    : `${API_BASE_URL}/demos/teacher`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch demos');
  }
  const data = await response.json();
  return data.data?.demos || [];
};

// Apply to Requirement
export const applyToRequirement = async (
  token: string, 
  requirementId: string, 
  payload?: { message?: string; proposedFee?: number; proposedSchedule?: any }
): Promise<{ applicationId: string }> => {
  const response = await fetch(`${API_BASE_URL}/applications/apply/${requirementId}`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 409) throw new Error('Already applied to this requirement');
    throw new Error('Failed to apply');
  }
  const data = await response.json();
  return data.data;
};

// Toggle Vacation Mode
export const toggleVacationMode = async (token: string): Promise<{ vacationMode: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/teachers/vacation-toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to toggle vacation mode');
  }
  const data = await response.json();
  return data.data;
};

// Withdraw Application
export const withdrawApplication = async (token: string, applicationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/withdraw`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to withdraw application');
  }
};
