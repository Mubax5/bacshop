import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DevelopmentAuthAdapter } from "@/infrastructure/auth/auth-provider";
import type { AdminSession } from "@/domain/admin/types";
import type { AdminPermission } from "@/domain/admin/types";
import { ADMIN_ROLE_PERMISSIONS } from "@/domain/admin/types";
import { validateReturnPath } from "@/application/auth/return-path";

const adminAdapter = new DevelopmentAuthAdapter();

export function requireAdminPermission(session: AdminSession, permission: AdminPermission): void {
  if (!session.mfaVerified || !ADMIN_ROLE_PERMISSIONS[session.adminRole].includes(permission)) throw new Error("Forbidden admin permission");
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (process.env.NODE_ENV === "production") return null;
  const cookieStore = await cookies();
  const session = await adminAdapter.readPlatformSession(cookieStore.get("bacshop-dev-session")?.value);
  return session?.role === "admin" ? session : null;
}

export async function requireAdmin(returnTo: string, permission?: AdminPermission): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(validateReturnPath(returnTo, "/admin"))}`);
  if (permission) {
    try { requireAdminPermission(session, permission); } catch { redirect("/admin?error=forbidden"); }
  }
  return session;
}
