import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { getPlatformSession, sessionCookieName } from "@/application/auth/require-customer";
import { validateReturnPath } from "@/application/auth/return-path";
import type { AdminPermission, AdminRole, AdminSession } from "@/domain/admin/types";
import { ADMIN_ROLE_PERMISSIONS } from "@/domain/admin/types";

const roleMap: Record<string, AdminRole> = { SUPER_ADMIN: "super-admin", OPERATIONS: "operations", FINANCE: "finance", CONTENT: "content", CUSTOMER_SUPPORT: "customer-support" };
const highRiskPermissions = new Set<AdminPermission>(["pricing:write", "resellers:write", "balance:write"]);

type ResolvedAdmin = Awaited<ReturnType<ReturnType<typeof getIdentityService>["readSession"]>>;

function mapAdmin(session: ResolvedAdmin): AdminSession | null {
  if (!session || session.kind !== "admin" || !session.mfaVerifiedAt || session.adminRoles.length === 0) return null;
  const roles = session.adminRoles.map((role) => roleMap[role]).filter((role): role is AdminRole => Boolean(role));
  const adminRole = roles[0];
  if (!adminRole) return null;
  return { userId: session.userId, role: "admin", adminRole, adminRoles: roles, email: session.email, displayName: session.displayName ?? session.email.split("@")[0], mfaVerified: true, ...(session.reauthExpiresAt ? { reauthExpiresAt: session.reauthExpiresAt.toISOString() } : {}) };
}

export function requireAdminPermission(session: AdminSession, permission: AdminPermission): void {
  const roles = session.adminRoles?.length ? session.adminRoles : [session.adminRole];
  if (!session.mfaVerified || !roles.some((role) => ADMIN_ROLE_PERMISSIONS[role].includes(permission))) throw new Error("Forbidden admin permission");
  if (usesDatabaseIdentity() && highRiskPermissions.has(permission) && (!session.reauthExpiresAt || new Date(session.reauthExpiresAt).getTime() <= Date.now())) throw new Error("Recent reauthentication required");
}

async function readRawAdminSession(): Promise<ResolvedAdmin> {
  const token = (await cookies()).get(sessionCookieName("admin"))?.value;
  if (!token || !usesDatabaseIdentity()) return null;
  const session = await getIdentityService().readSession(token);
  return session?.kind === "admin" ? session : null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!usesDatabaseIdentity()) {
    const session = await getPlatformSession();
    return session?.role === "admin" ? session : null;
  }
  return mapAdmin(await readRawAdminSession());
}

export async function requireAdmin(returnTo: string, permission?: AdminPermission): Promise<AdminSession> {
  if (!usesDatabaseIdentity()) {
    const session = await getAdminSession();
    if (!session) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(validateReturnPath(returnTo, "/admin"))}`);
    if (permission) {
      try { requireAdminPermission(session, permission); } catch (error) { redirect(error instanceof Error && /reauthentication/i.test(error.message) ? `/auth/reauth?returnTo=${encodeURIComponent(validateReturnPath(returnTo, "/admin"))}` : "/admin?error=forbidden"); }
    }
    return session;
  }

  const raw = await readRawAdminSession();
  if (!raw) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(validateReturnPath(returnTo, "/admin"))}`);
  if (!raw.mfaVerifiedAt) redirect(`/auth/mfa?returnTo=${encodeURIComponent(validateReturnPath(returnTo, "/admin"))}`);
  const session = mapAdmin(raw);
  if (!session) redirect("/admin?error=forbidden");
  if (permission) {
    try { requireAdminPermission(session, permission); } catch (error) { redirect(error instanceof Error && /reauthentication/i.test(error.message) ? `/auth/reauth?returnTo=${encodeURIComponent(validateReturnPath(returnTo, "/admin"))}` : "/admin?error=forbidden"); }
  }
  return session;
}
