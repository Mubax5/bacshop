import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getConfig } from "@/infrastructure/config/env";

/** Creates a server-side client without connecting until the first query. */
export function createDatabase(connectionString: string, options: { poolMax?: number; connectTimeoutMs?: number } = {}): PrismaClient {
  if (typeof window !== "undefined") throw new Error("Database access requires the server runtime");
  if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new Error("A PostgreSQL DATABASE_URL is required");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: options.poolMax ?? 10, connectionTimeoutMillis: options.connectTimeoutMs ?? 5000, idleTimeoutMillis: 30000 }),
    log: [],
  });
}

const databaseGlobal = globalThis as typeof globalThis & { bacshopDatabase?: PrismaClient };
let database: PrismaClient | undefined;

export function getDatabase(): PrismaClient {
  if (database) return database;
  if (process.env.NODE_ENV !== "production" && databaseGlobal.bacshopDatabase) {
    database = databaseGlobal.bacshopDatabase;
    return database;
  }
  const config = getConfig();
  database = createDatabase(config.database.url ?? "", config.database);
  if (process.env.NODE_ENV !== "production") databaseGlobal.bacshopDatabase = database;
  return database;
}

/** Readiness proves the migrated schema can be queried, not just an open TCP port. */
export async function checkDatabaseReadiness(): Promise<boolean> {
  try {
    await getDatabase().$queryRaw`SELECT 1 FROM "users" LIMIT 1`;
    const migrations = await getDatabase().$queryRaw<{ ready: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE migration_name = '20261001010000_integrity_guards'
          AND finished_at IS NOT NULL AND rolled_back_at IS NULL
      ) AS ready`;
    return migrations[0]?.ready === true;
  } catch {
    return false;
  }
}
