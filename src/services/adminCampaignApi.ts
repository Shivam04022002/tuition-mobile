import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type CampaignType =
  | 'broadcast'
  | 'scheduled'
  | 'triggered'
  | 'promotional'
  | 'system'
  | 'transactional';

export type CampaignAudience =
  | 'all_users'
  | 'all_teachers'
  | 'all_parents'
  | 'verified_teachers'
  | 'premium_teachers'
  | 'free_teachers'
  | 'kyc_pending'
  | 'active_parents'
  | 'inactive_users'
  | 'custom_segment';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface CampaignDeliveryStats {
  totalTargeted: number;
  sent:          number;
  delivered:     number;
  opened:        number;
  clicked:       number;
  failed:        number;
  openRate:      number;
  ctr:           number;
}

export interface CustomSegment {
  roles?:            string[];
  cities?:           string[];
  subjects?:         string[];
  planNames?:        string[];
  kycStatus?:        string[];
  registeredAfter?:  string;
  registeredBefore?: string;
  lastActiveAfter?:  string;
  lastActiveBefore?: string;
}

export interface Campaign {
  _id:             string;
  campaignId:      string;
  title:           string;
  message:         string;
  imageUrl?:       string;
  deepLinkScreen?: string;
  deepLinkParams?: Record<string, any>;
  campaignType:    CampaignType;
  targetAudience:  CampaignAudience;
  customSegment?:  CustomSegment;
  status:          CampaignStatus;
  scheduledAt?:    string;
  sentAt?:         string;
  deliveryStats:   CampaignDeliveryStats;
  createdBy:       { _id: string; name: string; email: string } | string;
  cancelReason?:   string;
  createdAt:       string;
  updatedAt:       string;
}

export interface CreateCampaignInput {
  title:           string;
  message:         string;
  imageUrl?:       string;
  deepLinkScreen?: string;
  deepLinkParams?: Record<string, any>;
  campaignType?:   CampaignType;
  targetAudience:  CampaignAudience;
  customSegment?:  CustomSegment;
  scheduledAt?:    string;
}

export interface CampaignsSummary {
  byStatus:  Record<string, number>;
  byType:    Record<string, number>;
  totals:    {
    totalSent:       number;
    totalDelivered:  number;
    totalOpened:     number;
    totalFailed:     number;
    overallOpenRate: number;
  };
  total: number;
}

export interface CampaignStatsResult {
  campaign:   Campaign;
  stats:      CampaignDeliveryStats;
  dailyTrend: { date: string; opened: number }[];
}

export interface CampaignsListResult {
  campaigns:  Campaign[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function apiCall<T>(url: string, options: RequestInit): Promise<T> {
  const res  = await fetch(url, options);
  const json = await res.json();
  if (json.success === false) throw new Error(json.message || 'Request failed');
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────────────────────

export async function getCampaignsSummary(
  token: string,
): Promise<{ success: boolean; data: CampaignsSummary }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/summary`, {
    headers: authHeaders(token),
  });
}

export async function listCampaigns(
  token: string,
  params?: { page?: number; limit?: number; status?: string; type?: string },
): Promise<{ success: boolean; data: CampaignsListResult }> {
  const qs = new URLSearchParams();
  if (params?.page)   qs.set('page',   String(params.page));
  if (params?.limit)  qs.set('limit',  String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.type)   qs.set('type',   params.type);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiCall(`${API_BASE_URL}/admin/campaigns${query}`, {
    headers: authHeaders(token),
  });
}

export async function createCampaign(
  token: string,
  input: CreateCampaignInput,
): Promise<{ success: boolean; data: Campaign }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns`, {
    method:  'POST',
    headers: authHeaders(token),
    body:    JSON.stringify(input),
  });
}

export async function updateCampaign(
  token: string,
  id: string,
  input: Partial<CreateCampaignInput>,
): Promise<{ success: boolean; data: Campaign }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/${id}`, {
    method:  'PUT',
    headers: authHeaders(token),
    body:    JSON.stringify(input),
  });
}

export async function deleteCampaign(
  token: string,
  id: string,
): Promise<{ success: boolean; message: string }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/${id}`, {
    method:  'DELETE',
    headers: authHeaders(token),
  });
}

export async function sendCampaign(
  token: string,
  id: string,
): Promise<{ success: boolean; data: Campaign }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/${id}/send`, {
    method:  'POST',
    headers: authHeaders(token),
  });
}

export async function cancelCampaign(
  token: string,
  id: string,
  reason?: string,
): Promise<{ success: boolean; data: Campaign }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/${id}/cancel`, {
    method:  'POST',
    headers: authHeaders(token),
    body:    JSON.stringify({ reason }),
  });
}

export async function duplicateCampaign(
  token: string,
  id: string,
): Promise<{ success: boolean; data: Campaign }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/${id}/duplicate`, {
    method:  'POST',
    headers: authHeaders(token),
  });
}

export async function getCampaignStats(
  token: string,
  id: string,
): Promise<{ success: boolean; data: CampaignStatsResult }> {
  return apiCall(`${API_BASE_URL}/admin/campaigns/${id}/stats`, {
    headers: authHeaders(token),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────────────────────
export function campaignStatusColor(status: CampaignStatus): string {
  switch (status) {
    case 'draft':     return '#6B7280';
    case 'scheduled': return '#3B82F6';
    case 'sending':   return '#F59E0B';
    case 'sent':      return '#10B981';
    case 'failed':    return '#EF4444';
    case 'cancelled': return '#9CA3AF';
    default:          return '#6B7280';
  }
}

export function campaignStatusLabel(status: CampaignStatus): string {
  switch (status) {
    case 'draft':     return 'Draft';
    case 'scheduled': return 'Scheduled';
    case 'sending':   return 'Sending…';
    case 'sent':      return 'Sent';
    case 'failed':    return 'Failed';
    case 'cancelled': return 'Cancelled';
    default:          return status;
  }
}

export function audienceLabel(audience: CampaignAudience): string {
  switch (audience) {
    case 'all_users':        return 'All Users';
    case 'all_teachers':     return 'All Teachers';
    case 'all_parents':      return 'All Parents';
    case 'verified_teachers':return 'Verified Teachers';
    case 'premium_teachers': return 'Premium Teachers';
    case 'free_teachers':    return 'Free Teachers';
    case 'kyc_pending':      return 'KYC Pending';
    case 'active_parents':   return 'Active Parents';
    case 'inactive_users':   return 'Inactive Users';
    case 'custom_segment':   return 'Custom Segment';
    default:                 return audience;
  }
}

export function campaignTypeLabel(type: CampaignType): string {
  switch (type) {
    case 'broadcast':     return 'Broadcast';
    case 'scheduled':     return 'Scheduled';
    case 'triggered':     return 'Triggered';
    case 'promotional':   return 'Promotional';
    case 'system':        return 'System';
    case 'transactional': return 'Transactional';
    default:              return type;
  }
}
