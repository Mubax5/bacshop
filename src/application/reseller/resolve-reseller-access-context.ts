import { resolveAccessContext } from "@/application/access/resolve-access-context";
import type { ResellerIdentity } from "@/domain/reseller/types";
import type { AccessContext } from "@/domain/access/types";

export function resolveResellerAccessContext(
  identity: ResellerIdentity | null,
  requestedContext: "reseller-center" | "retail-store",
): Extract<AccessContext, { kind: "reseller-approved" }> {
  if (!identity || identity.status !== "approved" || !identity.tier) {
    throw new Error("Unauthorized reseller access");
  }
  if (requestedContext !== "reseller-center") {
    throw new Error("Unauthorized reseller access");
  }
  const context = resolveAccessContext({ userId: identity.userId, role: "reseller-approved", resellerTier: identity.tier }, "reseller-center");
  if (context.kind !== "reseller-approved") throw new Error("Unauthorized reseller access");
  return context;
}
