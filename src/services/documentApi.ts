import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ==================== TYPES ====================

export type DocumentType =
  | 'profile_photo'
  | 'government_id'
  | 'aadhaar'
  | 'pan'
  | 'driving_license'
  | 'passport'
  | 'degree_certificate'
  | 'teaching_certificate'
  | 'experience_certificate';

export type DocumentStatus = 'draft' | 'pending' | 'verified' | 'rejected';
export type FileType = 'jpg' | 'png' | 'pdf';
export type DocumentCategory = 'identity' | 'qualification' | 'profile';

export interface TeacherDocument {
  _id: string;
  type: DocumentType;
  name: string;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  fileType: FileType;
  fileSize: number;
  category: DocumentCategory;
}

export interface DocumentSummary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  draft: number;
  completionPercentage: number;
}

export interface DocumentsResponse {
  documents: TeacherDocument[];
  grouped: {
    identity: TeacherDocument[];
    qualification: TeacherDocument[];
    profile: TeacherDocument[];
  };
  summary: DocumentSummary;
}

export interface RequirementCheck {
  required: boolean;
  met: boolean;
  documents: TeacherDocument[];
}

export interface VerificationRequirements {
  identityDocument: RequirementCheck;
  qualificationDocument: RequirementCheck;
  profilePhoto: RequirementCheck;
}

export interface TimelineEvent {
  date: string;
  event: string;
  description: string;
  documentId?: string;
  reason?: string;
}

export interface DocumentsByCategory {
  identity: TeacherDocument[];
  qualification: TeacherDocument[];
  profile: TeacherDocument[];
}

export interface DocumentStats {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  draft: number;
  byCategory: DocumentsByCategory;
}

export interface VerificationStatusResponse {
  status: DocumentStatus;
  isVerified: boolean;
  submittedAt?: string;
  rejectionReason?: string;
  verificationNotes?: string;
  requirements: VerificationRequirements;
  documents: DocumentStats;
  timeline: TimelineEvent[];
  canSubmit: boolean;
  requiredActions: string[];
}

// ==================== API FUNCTIONS ====================

/**
 * GET /api/teachers/documents
 * Get all documents for the authenticated teacher
 */
export const getDocuments = async (token: string): Promise<DocumentsResponse> => {
  const response = await fetch(`${API_BASE_URL}/teachers/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch documents');
  }

  const data = await response.json();
  return data.data;
};

/**
 * POST /api/teachers/documents
 * Upload a new document
 */
export const uploadDocument = async (
  token: string,
  type: DocumentType,
  name: string,
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<TeacherDocument> => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('name', name);
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${API_BASE_URL}/teachers/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload document');
  }

  const data = await response.json();
  return data.data.document;
};

/**
 * PUT /api/teachers/documents/:id
 * Update/replace a document
 */
export const updateDocument = async (
  token: string,
  documentId: string,
  updates: { name?: string; fileUri?: string; fileName?: string; mimeType?: string }
): Promise<TeacherDocument> => {
  const formData = new FormData();

  if (updates.name) {
    formData.append('name', updates.name);
  }

  if (updates.fileUri) {
    formData.append('file', {
      uri: updates.fileUri,
      name: updates.fileName || 'document',
      type: updates.mimeType || 'application/octet-stream',
    } as any);
  }

  const response = await fetch(`${API_BASE_URL}/teachers/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update document');
  }

  const data = await response.json();
  return data.data.document;
};

/**
 * DELETE /api/teachers/documents/:id
 * Delete a document
 */
export const deleteDocument = async (
  token: string,
  documentId: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/teachers/documents/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete document');
  }
};

/**
 * POST /api/teachers/verification/submit
 * Submit profile for verification
 */
export const submitForVerification = async (
  token: string
): Promise<{ verificationStatus: DocumentStatus; submittedAt: string; estimatedReviewTime: string }> => {
  const response = await fetch(`${API_BASE_URL}/teachers/documents/verification/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit for verification');
  }

  const data = await response.json();
  return data.data;
};

/**
 * GET /api/teachers/verification/status
 * Get detailed verification status
 */
export const getVerificationStatus = async (
  token: string
): Promise<VerificationStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/teachers/documents/verification/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch verification status');
  }

  const data = await response.json();
  return data.data;
};

// ==================== HELPERS ====================

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  profile_photo: 'Profile Photo',
  government_id: 'Government ID',
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  driving_license: 'Driving License',
  passport: 'Passport',
  degree_certificate: 'Degree Certificate',
  teaching_certificate: 'Teaching Certificate',
  experience_certificate: 'Experience Certificate',
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  profile_photo: 'person',
  government_id: 'card',
  aadhaar: 'id-card',
  pan: 'document-text',
  driving_license: 'car',
  passport: 'airplane',
  degree_certificate: 'school',
  teaching_certificate: 'ribbon',
  experience_certificate: 'briefcase',
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: '#6B7280',
  pending: '#F59E0B',
  verified: '#10B981',
  rejected: '#EF4444',
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
};

export const getDocumentCategory = (type: DocumentType): DocumentCategory => {
  if (type === 'profile_photo') return 'profile';
  if (['aadhaar', 'pan', 'driving_license', 'passport', 'government_id'].includes(type)) {
    return 'identity';
  }
  return 'qualification';
};

export const isValidFileType = (mimeType: string): boolean => {
  return ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(mimeType);
};

export const getFileTypeFromMime = (mimeType: string): FileType => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
