import { describe, expect, it, vi } from "vitest";
import type { AdminSession } from "@/domain/admin/types";

vi.mock("@/application/auth/identity", () => ({ usesDatabaseIdentity: () => true, getIdentityService: vi.fn() }));
import { requireAdminPermission } from "@/application/admin/require-admin";

function session(role: AdminSession["adminRole"], extra: Partial<AdminSession> = {}): AdminSession {
  return { userId: "test-admin", role: "admin", adminRole: role, email: "admin@bacshop.test", displayName: "Test", mfaVerified: true, ...extra };
}

describe("admin server permission boundary", () => {
  it("implements five least-privilege roles", () => {
    expect(() => requireAdminPermission(session("super-admin"), "catalog:write")).not.toThrow();
    expect(() => requireAdminPermission(session("operations"), "orders:write")).not.toThrow();
    expect(() => requireAdminPermission(session("operations"), "balance:write")).toThrow("Forbidden");
    expect(() => requireAdminPermission(session("finance"), "pricing:read")).not.toThrow();
    expect(() => requireAdminPermission(session("finance"), "catalog:write")).toThrow("Forbidden");
    expect(() => requireAdminPermission(session("content"), "promotions:write")).not.toThrow();
    expect(() => requireAdminPermission(session("content"), "orders:write")).toThrow("Forbidden");
    expect(() => requireAdminPermission(session("customer-support"), "support:write")).not.toThrow();
    expect(() => requireAdminPermission(session("customer-support"), "pricing:write")).toThrow("Forbidden");
  });

  it("requires an unexpired MFA reauthentication window for financial changes", () => {
    const admin = session("finance");
    expect(() => requireAdminPermission(admin, "balance:write")).toThrow("reauthentication");
    expect(() => requireAdminPermission({ ...admin, reauthExpiresAt: new Date(Date.now() - 1).toISOString() }, "balance:write")).toThrow("reauthentication");
    expect(() => requireAdminPermission({ ...admin, reauthExpiresAt: new Date(Date.now() + 60_000).toISOString() }, "balance:write")).not.toThrow();
  });

  it("rejects unverified MFA and respects union of current assignments", () => {
    expect(() => requireAdminPermission({ ...session("super-admin"), mfaVerified: false } as unknown as AdminSession, "orders:read")).toThrow("Forbidden");
    expect(() => requireAdminPermission(session("content", { adminRoles: ["content", "operations"] }), "orders:write")).not.toThrow();
    expect(() => requireAdminPermission(session("super-admin", { adminRoles: ["content"] }), "orders:write")).toThrow("Forbidden");
  });
});
