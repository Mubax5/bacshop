import type { AuthenticatedIdentity } from "@/application/access/resolve-access-context";

/** Production identity providers implement this server-only adapter contract. */
export interface AuthProvider {
  getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null>;
}
