import { createHash } from "node:crypto";
import type { Prisma, PrismaClient, NotificationType } from "@/generated/prisma/client";
import type { NotificationRecord, NotificationKind } from "@/domain/notifications/types";
import type { NotificationRepository } from "@/infrastructure/notifications/notification-repository";

type NotificationRow = Prisma.NotificationGetPayload<{ select: { id: true; userId: true; orderId: true; type: true; title: true; body: true; readAt: true; createdAt: true } }>;

const notificationTypes: Record<NotificationKind, NotificationType> = { payment: "PAYMENT_RECEIVED", processing: "PROCESSING", activation: "ACTIVATION_READY", issue: "PAYMENT_ISSUE", expiry: "EXPIRY_REMINDER" };
const typeFor = (kind: NotificationKind): NotificationType => notificationTypes[kind];

const kindFor = (type: string): NotificationKind => {
  switch (type) {
    case "PAYMENT_RECEIVED":
    case "REFUND":
      return "payment";
    case "PROCESSING":
      return "processing";
    case "ACTIVATION_READY":
      return "activation";
    case "PAYMENT_ISSUE":
    case "CUSTOMER_INPUT_REQUIRED":
    case "FULFILLMENT_ISSUE":
    case "SYSTEM":
      return "issue";
    case "EXPIRY_REMINDER":
      return "expiry";
    default:
      throw new Error("Unsupported persisted notification type");
  }
};

function deduplicationKey(userId: string, key: string): string {
  return createHash("sha256").update(`${userId}\0${key}`).digest("hex");
}

function mapNotification(row: NonNullable<NotificationRow>): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    ...(row.orderId ? { orderId: row.orderId } : {}),
    kind: kindFor(row.type),
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    ...(row.readAt ? { readAt: row.readAt.toISOString() } : {}),
  };
}

/** Durable in-app notification adapter with atomic user-scoped deduplication. */
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly database: PrismaClient) {}

  async listForUser(userId: string): Promise<NotificationRecord[]> {
    const rows = await this.database.notification.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    return rows.map(mapNotification);
  }

  async saveIfMissing(key: string, notification: Omit<NotificationRecord, "id">): Promise<NotificationRecord> {
    if (!key || key.length > 255) throw new Error("Invalid notification deduplication key");
    if (!notification.userId || !notification.title || !notification.body) throw new Error("Invalid notification");
    const createdAt = new Date(notification.createdAt);
    if (!Number.isFinite(createdAt.getTime())) throw new Error("Invalid notification timestamp");
    const persistedKey = deduplicationKey(notification.userId, key);
    // PostgreSQL ON CONFLICT avoids Prisma's read-then-insert upsert race.
    await this.database.notification.createMany({
      data: [{ userId: notification.userId, orderId: notification.orderId ?? null, type: typeFor(notification.kind), channel: "IN_APP", status: "PENDING", deduplicationKey: persistedKey, title: notification.title, body: notification.body, createdAt }],
      skipDuplicates: true,
    });
    const row = await this.database.notification.findUniqueOrThrow({ where: { deduplicationKey: persistedKey } });
    if (row.userId !== notification.userId || row.type !== typeFor(notification.kind) || row.orderId !== (notification.orderId ?? null) || row.title !== notification.title || row.body !== notification.body) throw new Error("Notification deduplication conflict");
    return mapNotification(row);
  }
}
