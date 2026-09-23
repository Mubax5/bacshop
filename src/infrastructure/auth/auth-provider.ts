import type { AuthenticatedIdentity } from "@/application/access/resolve-access-context";

/** Production identity providers implement this server-only adapter contract. */
export interface AuthProvider {
  getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null>;
}

export interface CustomerSession {
  userId: string;
  role: "customer";
  email: string;
  displayName: string;
}

export interface CustomerAuthAdapter {
  authenticate(email: string, password: string): Promise<CustomerSession | null>;
  register(email: string, password: string): Promise<CustomerSession | null>;
  readSession(token: string | undefined): Promise<CustomerSession | null>;
}

/** Development-only deterministic account. This adapter is not suitable for production. */
export class DevelopmentAuthAdapter implements CustomerAuthAdapter {
  private readonly registrations = new Map<string, { session: CustomerSession; password: string }>();
  private readonly session: CustomerSession = {
    userId: "customer-demo-1",
    role: "customer",
    email: "demo@bacshop.test",
    displayName: "Demo Customer",
  };

  async authenticate(email: string, password: string): Promise<CustomerSession | null> {
    const normalized = email.trim().toLowerCase();
    if (normalized === "demo@bacshop.test" && password === "bacshop-demo") return this.session;
    const registered = this.registrations.get(normalized);
    return registered?.password === password ? registered.session : null;
  }

  async register(email: string, password: string): Promise<CustomerSession | null> {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || password.length < 8 || this.registrations.has(normalized)) return null;
    const session = { userId: `customer-${encodeURIComponent(normalized)}`, role: "customer" as const, email: normalized, displayName: normalized.split("@")[0] };
    this.registrations.set(normalized, { session, password });
    return session;
  }

  async readSession(token: string | undefined): Promise<CustomerSession | null> {
    if (token === "dev-customer-session") return this.session;
    return [...this.registrations.values()].map(({ session }) => session).find((session) => token === `dev-session:${session.userId}`) ?? null;
  }
}
