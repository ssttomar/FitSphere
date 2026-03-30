import { API_BASE_URL } from "./api";

export type AppNotification = {
  id: string;
  type: "like" | "comment" | "follow" | "follow_request" | "follow_accepted";
  message: string;
  time: number;
  read: boolean;
  fromUserId?: string;
  fromUserName?: string;
  relatedPostId?: string;
  relatedRequestId?: string;
};

const KEY = "fitsphere_notifications";

export function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

let _seq = 0;

export function addNotification(notif: Omit<AppNotification, "id" | "time" | "read">) {
  const notifications = getNotifications();
  const now = Date.now();
  const newNotif: AppNotification = {
    ...notif,
    id: `${now}-${++_seq}`,
    time: now,
    read: false,
  };
  notifications.unshift(newNotif);
  localStorage.setItem(KEY, JSON.stringify(notifications.slice(0, 50)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("fitsphere:notification", { detail: newNotif }));
  }
}

export function markAllRead() {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(KEY, JSON.stringify(notifications));
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Backend notification sync ──────────────────────────────────────────────────

type BackendNotif = {
  id: string;
  type: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  relatedPostId?: string;
  relatedRequestId?: string;
  read: boolean;
  time: number;
};

function mergeBackendNotifications(backendNotifs: BackendNotif[]) {
  const existing = getNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  let hasNew = false;

  const merged: AppNotification[] = [...existing];

  for (const bn of backendNotifs) {
    if (!existingIds.has(bn.id)) {
      merged.unshift({
        id: bn.id,
        type: bn.type as AppNotification["type"],
        message: bn.message,
        time: bn.time,
        read: bn.read,
        fromUserId: bn.fromUserId,
        fromUserName: bn.fromUserName,
        relatedPostId: bn.relatedPostId,
        relatedRequestId: bn.relatedRequestId,
      });
      hasNew = true;
    } else {
      // Sync read state from backend
      const idx = merged.findIndex((n) => n.id === bn.id);
      if (idx !== -1 && merged[idx].read !== bn.read) {
        merged[idx] = { ...merged[idx], read: bn.read };
      }
    }
  }

  // Keep backend IDs list to remove ones that were rejected/deleted
  const backendIds = new Set(backendNotifs.map((n) => n.id));
  const cleaned = merged.filter((n) => {
    // Remove follow_request notifications that the backend no longer has
    if (n.type === "follow_request" && !backendIds.has(n.id)) return false;
    return true;
  });

  localStorage.setItem(KEY, JSON.stringify(cleaned.slice(0, 50)));

  if (hasNew && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("fitsphere:notification", { detail: null }));
  }
}

export async function syncBackendNotifications(): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fitsphere_token") : null;
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as BackendNotif[];
    mergeBackendNotifications(data);
  } catch {
    // ignore network errors
  }
}

export async function markAllReadBackend(): Promise<void> {
  markAllRead();
  const token = typeof window !== "undefined" ? localStorage.getItem("fitsphere_token") : null;
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore
  }
}
