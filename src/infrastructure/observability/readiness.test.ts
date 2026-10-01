import { describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/db/client", () => ({ checkDatabaseReadiness: vi.fn() }));

import { getReadinessResponse } from "./readiness";

describe("readiness route service", () => {
  it("returns ready when the database is reachable", async () => {
    const response = await getReadinessResponse(async () => true);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ready" });
  });

  it("returns sanitized 503 when the database is unavailable", async () => {
    const response = await getReadinessResponse(async () => {
      throw new Error("password=do-not-return");
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "not_ready" });
  });

  it("allows an injectable check for tests", async () => {
    const check = vi.fn(() => false);
    const response = await getReadinessResponse(check);
    expect(check).toHaveBeenCalledOnce();
    expect(response.status).toBe(503);
  });
});
