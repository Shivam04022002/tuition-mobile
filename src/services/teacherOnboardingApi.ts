import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ==================== TYPES ====================

export interface ProfileCompletionSection {
  basicDetails: boolean;
  profilePhoto: boolean;
  education: boolean;
  subjects: boolean;
  classes: boolean;
  teachingModes: boolean;
  location: boolean;
  availability: boolean;
  pricing: boolean;
  documents: boolean;
}

export interface ProfileCompletionData {
  percentage: number;
  completedCount: number;
  totalCount: number;
  sections: ProfileCompletionSection;
  canApply: boolean;
  verificationStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  isVerified: boolean;
}

export interface BasicDetailsPayload {
  'basicDetails.fullName': string;
  'basicDetails.gender': string;
  'basicDetails.dateOfBirth': string;
  'basicDetails.mobileNumber': string;
  'basicDetails.email': string;
  'basicDetails.languages': string[];
  bio?: string;
}

export interface EducationPayload {
  'education.highestQualification': string;
  'education.degree': string;
  'education.university': string;
  'education.yearOfCompletion': number;
  'education.status': 'completed' | 'pursuing';
  'education.certifications'?: Array<{
    name: string;
    issuer: string;
    year: number;
    certificateUrl?: string;
  }>;
}

export interface TeachingDetailsPayload {
  'teachingDetails.subjects': string[];
  'teachingDetails.classes': string[];
  'teachingDetails.boards': string[];
  'teachingDetails.specialization': string;
  'teachingDetails.teachingModes': string[];
  'teachingDetails.groupTuitionOption': boolean;
  'teachingDetails.groupSize'?: number;
  'teachingDetails.groupRate'?: number;
}

export interface LocationAvailabilityPayload {
  'locationAvailability.address': string;
  'locationAvailability.city': string;
  'locationAvailability.pincode': string;
  'locationAvailability.teachingRadius': number;
  'locationAvailability.preferredAreas': string[];
  'locationAvailability.availableDays': string[];
  'locationAvailability.availableTimeSlots': string[];
}

export interface PricingPayload {
  'pricingRevenue.hourlyRate': number;
  'pricingRevenue.monthlyRate': number;
  'pricingRevenue.experienceYears': number;
  'pricingRevenue.negotiationAllowed': boolean;
  'pricingRevenue.pricingStrategy': string;
}

export type OnboardingUpdatePayload =
  | BasicDetailsPayload
  | EducationPayload
  | TeachingDetailsPayload
  | LocationAvailabilityPayload
  | PricingPayload
  | Record<string, any>;

// ==================== API FUNCTIONS ====================

// GET /api/teachers/completion
export const getProfileCompletion = async (token: string): Promise<ProfileCompletionData> => {
  const response = await fetch(`${API_BASE_URL}/teachers/completion`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch profile completion');
  }
  const data = await response.json();
  return data.data;
};

// PUT /api/teachers/profile — incremental section update
export const updateOnboardingSection = async (
  token: string,
  payload: OnboardingUpdatePayload
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/teachers/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update profile');
  }
};

// POST /api/teachers/upload-documents — multipart upload
export const uploadTeacherDocument = async (
  token: string,
  fieldName: 'certificates' | 'portfolio',
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<string[]> => {
  const formData = new FormData();
  formData.append(fieldName, {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${API_BASE_URL}/teachers/upload-documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to upload document');
  }
  const data = await response.json();
  return data.data?.[fieldName] || [];
};

// PUT /api/teachers/profile — profile photo via multipart
export const uploadProfilePhoto = async (
  token: string,
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('profilePicture', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${API_BASE_URL}/teachers/profile`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to upload profile photo');
  }
  const data = await response.json();
  return data.data?.basicDetails?.profilePhoto || fileUri;
};
