import "dotenv/config";
import { getConfig } from "@/infrastructure/config/env";
import { getDatabase } from "@/infrastructure/db/client";
import { typedPrismaIdentityService } from "@/infrastructure/auth/prisma-identity-service";

async function main(): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) throw new Error("invalid-input");
  const config = getConfig();
  if (config.runtime !== "database" || !config.auth.mfaEncryptionKey) throw new Error("configuration");

  const database = getDatabase();
  try {
    const service = typedPrismaIdentityService(database, {
      sessionTtlSeconds: config.auth.sessionTtlSeconds,
      adminSessionTtlSeconds: config.auth.adminSessionTtlSeconds,
      reauthTtlSeconds: config.auth.adminReauthTtlSeconds,
      emailRequired: config.email.required,
      mfaEncryptionKey: config.auth.mfaEncryptionKey,
    });
    const result = await service.bootstrapAdmin({
      email,
      password,
      ...(process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME ? { displayName: process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME } : {}),
    });
    if (!result) throw new Error("already-bootstrapped-or-invalid-input");
    process.stdout.write("Admin bootstrap completed. MFA enrollment is required at first sign-in.\n");
  } finally {
    await database.$disconnect().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  const category = error instanceof Error && (error.message === "invalid-input" || error.message === "configuration" || error.message === "already-bootstrapped-or-invalid-input")
    ? error.message
    : "database-failure";
  process.stderr.write(`Admin bootstrap failed (${category}). Check configuration, credentials policy, and database state.\n`);
  process.exitCode = 1;
});
