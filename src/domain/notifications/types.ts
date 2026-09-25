export type NotificationKind = "payment" | "processing" | "activation" | "issue" | "expiry";

export interface NotificationRecord {
  id: string;
  userId: string;
  orderId?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}
