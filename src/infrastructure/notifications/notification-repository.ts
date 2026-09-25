import type { NotificationRecord } from "@/domain/notifications/types";

export interface NotificationRepository {
  listForUser(userId: string): Promise<NotificationRecord[]>;
  saveIfMissing(key: string, notification: Omit<NotificationRecord, "id">): Promise<NotificationRecord>;
}

export class DevelopmentNotificationRepository implements NotificationRepository {
  private readonly notifications = new Map<string, NotificationRecord>();

  async listForUser(userId: string) {
    return [...this.notifications.values()]
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveIfMissing(key: string, notification: Omit<NotificationRecord, "id">) {
    const existing = this.notifications.get(key);
    if (existing) return existing;
    const saved = { ...notification, id: `notification-${this.notifications.size + 1}` };
    this.notifications.set(key, saved);
    return saved;
  }
}

export const developmentNotifications = new DevelopmentNotificationRepository();
