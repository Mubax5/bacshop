import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DevelopmentAuthAdapter, type CustomerSession, type PlatformSession } from "@/infrastructure/auth/auth-provider";
import { getIdentityService, usesDatabaseIdentity } from "./identity";
import { validateReturnPath } from "./return-path";

export const SESSION_COOKIE = "bacshop-session";
export const PRODUCTION_SESSION_COOKIE = "__Host-bacshop-session";
export const ADMIN_SESSION_COOKIE = "bacshop-admin-session";
export const PRODUCTION_ADMIN_SESSION_COOKIE = "__Host-bacshop-admin-session";
const authAdapter = new DevelopmentAuthAdapter();

export function sessionCookieName(kind: "customer" | "admin" = "customer"): string {
  if (kind === "admin") return process.env.NODE_ENV === "production" ? PRODUCTION_ADMIN_SESSION_COOKIE : ADMIN_SESSION_COOKIE;
  return process.env.NODE_ENV === "production" ? PRODUCTION_SESSION_COOKIE : SESSION_COOKIE;
}

type Resolved = Awaited<ReturnType<ReturnType<typeof getIdentityService>["readSession"]>>;

function customerFromResolved(session: Resolved): CustomerSession | null {
  if (!session || session.kind !== "customer") return null;
  const approvedTier = session.reseller?.status === "APPROVED" ? session.reseller.tierCode : null;
  return { userId: session.userId, role: approvedTier ? "reseller-approved" : "customer", email: session.email, displayName: session.displayName ?? session.email.split("@")[0], ...(approvedTier ? { resellerTier: approvedTier.toLowerCase() as "bronze" | "silver" | "gold" } : {}) };
}

function platformFromResolved(session: Resolved): PlatformSession | null {
  if (!session) return null;
  if (session.kind === "customer") return customerFromResolved(session);
  if (!session.mfaVerifiedAt || session.adminRoles.length === 0) return null;
  const roleMap = { SUPER_ADMIN: "super-admin", OPERATIONS: "operations", FINANCE: "finance", CONTENT: "content", CUSTOMER_SUPPORT: "customer-support" } as const;
  const adminRole = roleMap[session.adminRoles[0]];
  if (!adminRole) return null;
  return { userId: session.userId, role: "admin", adminRole, adminRoles: session.adminRoles.map((role) => roleMap[role]).filter(Boolean), email: session.email, displayName: session.displayName ?? session.email.split("@")[0], mfaVerified: true, ...(session.reauthExpiresAt ? { reauthExpiresAt: session.reauthExpiresAt.toISOString() } : {}) };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(sessionCookieName("customer"))?.value;
  if (!token) return null;
  if (usesDatabaseIdentity()) return customerFromResolved(await getIdentityService().readSession(token));
  return authAdapter.readSession(token);
}

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const store = await cookies();
  const adminToken = store.get(sessionCookieName("admin"))?.value;
  const customerToken = store.get(sessionCookieName("customer"))?.value;
  if (usesDatabaseIdentity()) {
    if (adminToken) {
      const adminSession = platformFromResolved(await getIdentityService().readSession(adminToken));
      if (adminSession) return adminSession;
    }
    return customerToken ? platformFromResolved(await getIdentityService().readSession(customerToken)) : null;
  }
  if (adminToken) {
    const adminSession = authAdapter.readPlatformSession(adminToken);
    if (adminSession) return adminSession;
  }
  return customerToken ? authAdapter.readPlatformSession(customerToken) : null;
}

export const developmentAuthAdapter = authAdapter;

export function customerRouteRedirect(session: CustomerSession | null, returnTo: string): string | null {
  return session ? null : `/auth/sign-in?returnTo=${encodeURIComponent(validateReturnPath(returnTo))}`;
}

export async function requireCustomer(returnTo: string): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) redirect(customerRouteRedirect(session, returnTo) ?? "/auth/sign-in");
  return session;
}
