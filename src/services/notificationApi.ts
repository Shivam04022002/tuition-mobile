import { apiConfig } from '../config/api';

const BASE = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationCategory = 'payment' | 'application' | 'demo' | 'lead' | 'admin' | 'system';

export interface AppNotification {
  _id: string;
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResult {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────────────────────────────────────
export async function getNotifications(
  token: string,
  opts?: { page?: number; limit?: number; category?: string; unreadOnly?: boolean },
): Promise<NotificationListResult> {
  const params = new URLSearchParams();
  if (opts?.page)       params.set('page',       String(opts.page));
  if (opts?.limit)      params.set('limit',      String(opts.limit));
  if (opts?.category)   params.set('category',   opts.category);
  if (opts?.unreadOnly) params.set('unreadOnly', 'true');

  const res = await fetch(`${BASE}/notifications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch notifications');
  return json.data as NotificationListResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// ─────────────────────────────────────────────────────────────────────────────
export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) return 0;
  return (json.data?.unreadCount as number) ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────
export async function markNotificationRead(token: string, id: string): Promise<void> {
  await fetch(`${BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
// ─────────────────────────────────────────────────────────────────────────────
export async function markAllNotificationsRead(token: string): Promise<void> {
  await fetch(`${BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteNotification(token: string, id: string): Promise<void> {
  await fetch(`${BASE}/notifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
