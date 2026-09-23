import { assertAccessContext, type AccessContext } from "@/domain/access/types";

/** Identity/authentication is intentionally injected by a future server auth adapter. */
export interface AuthenticatedIdentity {
  userId: string;
  role: "customer" | "reseller-pending" | "reseller-approved" | "reseller-suspended" | "admin";
  resellerTier?: "bronze" | "silver" | "gold";
}

export function resolveAccessContext(
  identity: AuthenticatedIdentity | null,
  surface: "retail-store" | "reseller-center" = "retail-store",
): AccessContext {
  if (!identity) return { kind: "guest" };
  if (identity.role === "reseller-approved") {
    if (!identity.resellerTier) throw new Error("An approved reseller must have an assigned tier");
    const context: AccessContext = {
      kind: "reseller-approved",
      userId: identity.userId,
      tier: identity.resellerTier,
      surface,
    };
    assertAccessContext(context);
    return context;
  }
  const context: AccessContext = { kind: identity.role, userId: identity.userId };
  assertAccessContext(context);
  return context;
}
