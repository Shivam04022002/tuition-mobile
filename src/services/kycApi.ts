import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type KycStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'reupload_required';

export type KycDocumentType =
  | 'PAN_CARD'
  | 'AADHAAR_FRONT'
  | 'AADHAAR_BACK'
  | 'BANK_PROOF'
  | 'ADDRESS_PROOF'
  | 'SELFIE_PHOTO';

export type KycDocumentStatus = 'pending' | 'verified' | 'rejected' | 'reupload_required';

export interface KycDocument {
  _id: string;
  documentType: KycDocumentType;
  documentUrl: string;
  cloudinaryPublicId: string;
  verificationStatus: KycDocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
  notes?: string;
}

export interface KycStatusData {
  kycId?: string;
  status: KycStatus;
  documentsUploaded: number;
  requiredDocuments: KycDocumentType[];
  missingDocuments: KycDocumentType[];
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  verificationNotes?: string;
  profileCompletion?: number;
  canSubmit: boolean;
}

export interface KycDetails {
  kycId: string;
  status: KycStatus;
  documents: KycDocument[];
  verificationNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: any;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KycQueueRecord {
  _id: string;
  kycId: string;
  status: string;
  documents: KycDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  verificationNotes?: string;
  teacherId: {
    _id: string;
    basicDetails?: {
      fullName: string;
      email: string;
      mobileNumber: string;
      profilePhoto?: string;
    };
    verificationStatus: string;
    userId?: {
      profile?: { firstName: string; lastName: string };
      email?: string;
      phoneNumber?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface KycQueueCounts {
  all: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  reupload_required: number;
}

export interface KycQueueResponse {
  records: KycQueueRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: KycQueueCounts;
}

export interface KycDetailAdminResponse {
  kyc: any;
  teacherProfile: any;
  profileCompletion: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher API functions
// ─────────────────────────────────────────────────────────────────────────────

export const getKycStatus = async (token: string): Promise<KycStatusData> => {
  const response = await fetch(`${API_BASE_URL}/kyc/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get KYC status');
  }

  const data = await response.json();
  return data.data;
};

export const getKycDetails = async (token: string): Promise<KycDetails | null> => {
  const response = await fetch(`${API_BASE_URL}/kyc/details`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get KYC details');
  }

  const data = await response.json();
  return data.data;
};

export const uploadKycDocument = async (
  token: string,
  documentType: KycDocumentType,
  fileUri: string,
  fileName: string,
): Promise<{ kycId: string; document: KycDocument }> => {
  const formData = new FormData();
  formData.append('documentType', documentType);

  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${API_BASE_URL}/kyc/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload document');
  }

  const data = await response.json();
  return data.data;
};

export const submitKyc = async (token: string): Promise<{ kycId: string; status: string; submittedAt: string }> => {
  const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit KYC');
  }

  const data = await response.json();
  return data.data;
};

export const updateKycDocument = async (
  token: string,
  documentId: string,
  fileUri: string,
  fileName: string,
): Promise<{ document: KycDocument }> => {
  const formData = new FormData();
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${API_BASE_URL}/kyc/document/${documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update document');
  }

  const data = await response.json();
  return data.data;
};

export const deleteKycDocument = async (token: string, documentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/kyc/document/${documentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete document');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin API functions
// ─────────────────────────────────────────────────────────────────────────────

export const getAdminKycQueue = async (
  token: string,
  params?: { status?: string; page?: number; limit?: number },
): Promise<KycQueueResponse> => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const response = await fetch(`${API_BASE_URL}/admin/kyc?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get KYC queue');
  }

  const data = await response.json();
  return data.data;
};

export const getAdminKycDetail = async (token: string, id: string): Promise<KycDetailAdminResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/kyc/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get KYC details');
  }

  const data = await response.json();
  return data.data;
};

export const approveKyc = async (token: string, id: string, notes?: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/kyc/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to approve KYC');
  }
};

export const rejectKyc = async (token: string, id: string, reason: string, notes?: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/kyc/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason, notes }),
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to reject KYC');
  }
};

export const requestKycReupload = async (
  token: string,
  id: string,
  notes: string,
  documentIds?: string[],
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/kyc/${id}/request-reupload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes, documentIds }),
  });

  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to request reupload');
  }
};
