export type AppNotification = {
  id: string;
  type: "like" | "comment" | "follow";
  message: string;
  time: number;
  read: boolean;
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
  window.dispatchEvent(new CustomEvent("fitsphere:notification", { detail: newNotif }));
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
