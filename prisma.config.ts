import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 reads the connection URL from this config file. DIRECT_URL is
// useful for a direct migration connection when DATABASE_URL points at a
// pooler. Keep the datasource unset when no credential is configured so
// client generation remains possible while migration commands fail with an
// explicit missing-datasource error.
const databaseUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
