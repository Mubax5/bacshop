import { getDatabase } from "@/infrastructure/db/client";
import { getConfig } from "@/infrastructure/config/env";
import { typedPrismaIdentityService, type PrismaIdentityService } from "@/infrastructure/auth/prisma-identity-service";
import { cookies } from "next/headers";

const identityGlobal = globalThis as typeof globalThis & { bacshopIdentityService?: PrismaIdentityService };

export function usesDatabaseIdentity(): boolean {
  return getConfig().runtime === "database";
}

/** Production and explicit database runtime identity composition. */
export function getIdentityService(): PrismaIdentityService {
  if (!usesDatabaseIdentity()) throw new Error("Database identity is unavailable in development runtime");
  if (identityGlobal.bacshopIdentityService) return identityGlobal.bacshopIdentityService;
  const config = getConfig();
  if (!config.auth.mfaEncryptionKey) throw new Error("MFA encryption key is required for database identity");
  const service = typedPrismaIdentityService(getDatabase(), {
    sessionTtlSeconds: config.auth.sessionTtlSeconds,
    adminSessionTtlSeconds: config.auth.adminSessionTtlSeconds,
    reauthTtlSeconds: config.auth.adminReauthTtlSeconds,
    emailRequired: config.email.required,
    mfaEncryptionKey: config.auth.mfaEncryptionKey,
  });
  identityGlobal.bacshopIdentityService = service;
  return service;
}

export async function getSessionToken(kind: "customer" | "admin" = "customer"): Promise<string | undefined> {
  const production = process.env.NODE_ENV === "production";
  const name = kind === "admin"
    ? production ? "__Host-bacshop-admin-session" : "bacshop-admin-session"
    : production ? "__Host-bacshop-session" : "bacshop-session";
  return (await cookies()).get(name)?.value;
}
