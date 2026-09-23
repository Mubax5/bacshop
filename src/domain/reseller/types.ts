import type { ResellerTier } from "@/domain/access/types";

export type ResellerApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface ResellerIdentity {
  userId: string;
  status: ResellerApplicationStatus;
  tier?: ResellerTier;
}

export interface ResellerOrder {
  id: string;
  resellerId: string;
  targetCustomerId: string;
  lines: { sku: string; productName: string; quantity: number; resellerPrice: number }[];
  total: number;
  createdAt: string;
  status: "processing" | "fulfilled" | "issue";
  expiresAt?: string;
}

export interface ResellerCustomer {
  id: string;
  resellerId: string;
  name: string;
  contact: string;
  productName: string;
  expiresAt: string;
  status: "active" | "expiring" | "expired";
}

export type WalletEntryKind = "top-up" | "purchase" | "refund" | "credit";

export interface WalletLedgerEntry {
  id: string;
  resellerId: string;
  amount: number;
  direction: "credit" | "debit";
  kind: WalletEntryKind;
  reference: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  details: Readonly<Record<string, string | number | boolean>>;
  createdAt: string;
}
