import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveResellerAccessContext } from "@/application/reseller/resolve-reseller-access-context";
import { SESSION_COOKIE } from "@/application/auth/require-customer";
import { developmentResellerAdapter } from "@/infrastructure/auth/development-reseller-adapter";
import type { ResellerIdentity } from "@/domain/reseller/types";

export async function getResellerIdentity(): Promise<ResellerIdentity | null> {
  if (process.env.NODE_ENV === "production") return null;
  const cookieStore = await cookies();
  return developmentResellerAdapter.readIdentity(cookieStore.get(SESSION_COOKIE)?.value);
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
