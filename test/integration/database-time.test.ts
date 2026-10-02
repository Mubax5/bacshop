import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { createDatabase } from "@/infrastructure/db/client";

const connection = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
if (!connection || !new URL(connection).pathname.endsWith("_integration")) throw new Error("An isolated integration database is required");

describe("database UTC session invariant", () => {
  it("round-trips actual instants between Prisma and PostgreSQL across a non-UTC server default", async () => {
    const url = new URL(connection);
    url.searchParams.set("options", "-c timezone=Asia/Jakarta");
    const native = new Pool({ connectionString: url.toString() });
    const prisma = createDatabase(url.toString());
    try {
      expect((await prisma.$queryRaw<{ zone: string }[]>`SELECT current_setting('TimeZone') AS zone`)[0].zone).toBe("UTC");
      const instant = new Date("2026-10-02T12:34:56.123Z");
      const user = await prisma.user.create({ data: { email: `${randomUUID()}@utc-integration.test`, lastLoginAt: instant } });
      const nativeRead = await native.query('SELECT "lastLoginAt" FROM users WHERE id = $1', [user.id]);
      expect(nativeRead.rows[0].lastLoginAt.toISOString()).toBe(instant.toISOString());
      const later = new Date("2026-10-03T01:02:03.456Z");
      await native.query('UPDATE users SET "lastLoginAt" = $1 WHERE id = $2', [later, user.id]);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).lastLoginAt?.toISOString()).toBe(later.toISOString());
      const clock = await prisma.$queryRaw<{ now: Date }[]>`SELECT now() AS now`;
      expect(Math.abs(clock[0].now.getTime() - Date.now())).toBeLessThan(5000);
    } finally { await native.end(); await prisma.$disconnect(); }
  });
});
