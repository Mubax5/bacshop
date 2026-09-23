import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DevelopmentAuthAdapter, type CustomerSession } from "@/infrastructure/auth/auth-provider";
import { validateReturnPath } from "./return-path";

const SESSION_COOKIE = "bacshop-dev-session";
const authAdapter = new DevelopmentAuthAdapter();

export async function getCustomerSession(): Promise<CustomerSession | null> {
  if (process.env.NODE_ENV === "production") return null;
  const cookieStore = await cookies();
  return authAdapter.readSession(cookieStore.get(SESSION_COOKIE)?.value);
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

export { SESSION_COOKIE };
