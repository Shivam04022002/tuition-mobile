import { apiConfig } from '../config/api';

const BASE = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParentProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  role: string;
}

export interface NotificationSummary {
  count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * Normalise the raw User document returned by GET /api/parents/profile/me
 * into a flat ParentProfile shape consumed by the header.
 */
function normaliseProfile(raw: Record<string, any>): ParentProfile {
  const user: Record<string, any> = raw?.data?.user ?? raw?.data ?? raw ?? {};

  // Resolve name: try profile.firstName+lastName, profile.parentName, top-level name
  const firstName: string = user?.profile?.firstName ?? '';
  const lastName: string = user?.profile?.lastName ?? '';
  const fullName = firstName && lastName
    ? `${firstName} ${lastName}`.trim()
    : (firstName || user?.profile?.parentName || user?.name || '').trim();

  // Resolve phone
  const phone: string =
    user?.phoneNumber ??
    user?.phone ??
    user?.profile?.mobileNumber ??
    user?.profile?.phone ??
    '';

  // Resolve email
  const email: string =
    user?.email ?? user?.profile?.email ?? '';

  // Resolve profile image
  const profileImage: string | null =
    user?.profile?.profileImage ?? user?.profileImage ?? null;

  return {
    _id: user?._id ?? user?.id ?? '',
    name: fullName || 'Parent',
    email,
    phone,
    profileImage,
    role: user?.role ?? 'parent',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/parents/profile/me
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchParentProfile(token: string): Promise<ParentProfile> {
  const res = await fetch(`${BASE}/parents/profile/me`, {
    headers: authHeader(token),
  });

  if (res.status === 401) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Profile fetch failed (${res.status})`);
  }

  const json = await res.json();
  return normaliseProfile(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchNotificationCount(token: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/notifications/unread-count`, {
      headers: authHeader(token),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    // Backend may return { success, data: { unreadCount } } or { success, count }
    return (
      (json?.data?.unreadCount as number) ??
      (json?.count as number) ??
      0
    );
  } catch {
    return 0;
  }
}
