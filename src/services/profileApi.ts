import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ──────────────────────────────────────────────────────────────

export interface ParentProfileData {
  _id: string;
  email: string;
  phoneNumber: string;
  mobileNumber?: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    parentName?: string;
    mobileNumber?: string;
    email?: string;
    address?: {
      city?: string;
      state?: string;
    };
    profileImage?: string;
  };
  isActive?: boolean;
  profileCompleted?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string;
}

export interface TeacherProfileData {
  _id: string;
  userId: string;
  basicDetails: {
    fullName: string;
    gender: string;
    dateOfBirth?: string;
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
    certifications: Array<{ name: string; issuer: string; year: number; certificateUrl?: string }>;
    status: string;
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
  };
  locationAvailability: {
    address: string;
    city: string;
    pincode: string;
    coordinates: { latitude: number; longitude: number };
    preferredAreas: string[];
    preferredLocations?: Array<{ area: string; city: string; latitude: number; longitude: number; radiusKm: number }>;
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

export interface AdminProfileData {
  id: string;
  _id?: string;
  email: string;
  phoneNumber: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  profileCompleted?: boolean;
  onboardingCompleted?: boolean;
  createdAt: string;
}

export interface StaffProfileData {
  id: string;
  _id?: string;
  email: string;
  phoneNumber: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    profileImage?: string;
    department?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  profileCompleted?: boolean;
  onboardingCompleted?: boolean;
  createdAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

const handleResponse = async (res: Response) => {
  if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

// ── getProfile ───────────────────────────────────────────────────────────
// Works for all roles by delegating to the correct endpoint.

export const getProfile = async (
  token: string,
  role: 'parent' | 'teacher' | 'admin' | 'staff'
): Promise<ParentProfileData | TeacherProfileData | AdminProfileData | StaffProfileData> => {
  if (role === 'parent') {
    const res = await fetch(`${API_BASE_URL}/parents/profile/me`, { headers: authHeader(token) });
    const data = await handleResponse(res);
    return (data.data?.user ?? data) as ParentProfileData;
  }

  if (role === 'teacher') {
    const res = await fetch(`${API_BASE_URL}/teachers/profile/me`, { headers: authHeader(token) });
    const data = await handleResponse(res);
    return (data.data ?? data) as TeacherProfileData;
  }

  // admin and staff both use GET /api/auth/me
  const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: authHeader(token) });
  const data = await handleResponse(res);
  return (data.user ?? data) as AdminProfileData | StaffProfileData;
};

// ── updateProfile ────────────────────────────────────────────────────────

export const updateProfile = async (
  token: string,
  role: 'parent' | 'teacher' | 'admin' | 'staff',
  updates: Record<string, any>
): Promise<any> => {
  if (role === 'parent') {
    const res = await fetch(`${API_BASE_URL}/parents/profile`, {
      method: 'PUT',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await handleResponse(res);
    return data.data?.user ?? data;
  }

  if (role === 'teacher') {
    const res = await fetch(`${API_BASE_URL}/teachers/profile`, {
      method: 'PUT',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await handleResponse(res);
    return data.data ?? data;
  }

  // admin / staff: use auth profile endpoint
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await handleResponse(res);
  return data.user ?? data;
};

// ── uploadProfileImage ───────────────────────────────────────────────────
// For teacher: uploads via multipart form to PUT /teachers/profile (profilePicture field).
// For parent / admin / staff: updates profile.profileImage via JSON patch.

export const uploadProfileImage = async (
  token: string,
  role: 'parent' | 'teacher' | 'admin' | 'staff',
  imageUri: string,
  fileName: string = 'profile.jpg'
): Promise<string> => {
  if (role === 'teacher') {
    const formData = new FormData();
    formData.append('profilePicture', { uri: imageUri, name: fileName, type: 'image/jpeg' } as any);

    const res = await fetch(`${API_BASE_URL}/teachers/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await handleResponse(res);
    return data.data?.basicDetails?.profilePhoto ?? imageUri;
  }

  // For other roles, return the local URI (server-side image upload not yet wired for parent/admin/staff)
  return imageUri;
};
