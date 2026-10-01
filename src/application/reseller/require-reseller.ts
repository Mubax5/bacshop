import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { resolveResellerAccessContext } from "@/application/reseller/resolve-reseller-access-context";
import { sessionCookieName } from "@/application/auth/require-customer";
import { developmentResellerAdapter } from "@/infrastructure/auth/development-reseller-adapter";
import type { ResellerIdentity } from "@/domain/reseller/types";

export async function getResellerIdentity(): Promise<ResellerIdentity | null> {
  const token = (await cookies()).get(sessionCookieName("customer"))?.value;
  if (!token) return null;
  if (usesDatabaseIdentity()) {
    const session = await getIdentityService().readSession(token);
    if (!session || session.kind !== "customer" || !session.reseller) return null;
    const status = session.reseller.status.toLowerCase() as ResellerIdentity["status"];
    const tier = session.reseller.tierCode?.toLowerCase() as ResellerIdentity["tier"];
    return { userId: session.userId, status, ...(tier ? { tier } : {}) };
  }
  return developmentResellerAdapter.readIdentity(token);
}

export function resellerRouteRedirect(identity: ResellerIdentity | null, returnTo: string): string | null {
  if (!identity) return `/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
  if (identity.status !== "approved") return `/reseller/access?status=${identity.status}`;
  return null;
}

export async function requireResellerContext(returnTo: string) {
  const identity = await getResellerIdentity();
  const destination = resellerRouteRedirect(identity, returnTo);
  if (destination) redirect(destination);
  return resolveResellerAccessContext(identity, "reseller-center");
}
