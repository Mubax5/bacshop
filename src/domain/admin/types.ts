import type { FulfillmentStatus, PaymentStatus, OrderStatus } from "@/domain/retail/types";

export type AdminRole = "super-admin" | "operations" | "finance" | "content";

export interface AdminSession {
  userId: string;
  role: "admin";
  adminRole: AdminRole;
  email: string;
  displayName: string;
  mfaVerified: true;
}

export type AdminPermission =
  | "catalog:read" | "catalog:write" | "pricing:read" | "pricing:write"
  | "orders:read" | "orders:write" | "resellers:read" | "resellers:write"
  | "balance:read" | "balance:write" | "promotions:read" | "promotions:write"
  | "support:read" | "support:write" | "audit:read";

export interface AdminOrderRecord {
  id: string;
  customerId: string;
  productName: string;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
}

export interface AdminResellerRecord {
  userId: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  tier?: "bronze" | "silver" | "gold";
}

export interface AdminPromotionRecord { id: string; name: string; status: "draft" | "scheduled" | "live" | "ended"; startsAt: string; endsAt: string; }
export interface AdminSupportRecord { id: string; customerId: string; subject: string; status: "open" | "pending" | "resolved"; priority: "low" | "normal" | "high"; }

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  "super-admin": ["catalog:read", "catalog:write", "pricing:read", "pricing:write", "orders:read", "orders:write", "resellers:read", "resellers:write", "balance:read", "balance:write", "promotions:read", "promotions:write", "support:read", "support:write", "audit:read"],
  operations: ["catalog:read", "orders:read", "orders:write", "resellers:read", "support:read", "support:write", "audit:read"],
  finance: ["pricing:read", "pricing:write", "orders:read", "balance:read", "balance:write", "audit:read"],
  content: ["catalog:read", "catalog:write", "promotions:read", "promotions:write", "support:read", "audit:read"],
};
