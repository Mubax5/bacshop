import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

describe("structured logger", () => {
  it("redacts credential, email, payload, and error values", () => {
    const records: unknown[] = [];
    const log = createLogger({ sink: (record) => { records.push(record); }, level: "debug", now: () => new Date("2026-01-01T00:00:00.000Z") });
    log.error("request failed for buyer@example.com", {
      requestId: "request-1",
      route: "/api/test",
      password: "secret",
      email: "buyer@example.com",
      payload: { token: "token-value" },
      connectionString: "postgresql://admin:db-secret@database.example.com:5432/bacshop",
      error: new Error("secret=do-not-log"),
    });
    const serialized = JSON.stringify(records);
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).toContain("[REDACTED_EMAIL]");
    expect(serialized).not.toContain("secret=do-not-log");
    expect(serialized).not.toContain("token-value");
    expect(serialized).not.toContain("db-secret");
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).toContain('"errorType":"Error"');
  });

  it("filters events below the configured level", () => {
    const records: unknown[] = [];
    const log = createLogger({ sink: (record) => { records.push(record); }, level: "warn" });
    log.info("ignored");
    log.warn("kept");
    expect(records).toHaveLength(1);
  });
});
