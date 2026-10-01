import { describe, expect, it } from "vitest";
import { isUniqueViolation, isValidDate, normalizeEmail, normalizeNewPassword, normalizeOptional, normalizePassword, sessionKind } from "./identity-service-helpers";

describe("identity service input helpers", () => {
  it("normalizes email without accepting malformed or oversized values", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
    expect(normalizeEmail("missing-at.example.com")).toBeNull();
    expect(normalizeEmail(`${"a".repeat(320)}@example.com`)).toBeNull();
  });

  it("keeps passwords exact while bounding input size", () => {
    expect(normalizePassword(" pass word ")).toBe(" pass word ");
    expect(normalizePassword("")).toBeNull();
    expect(normalizePassword("x".repeat(1025))).toBeNull();
    expect(normalizeNewPassword("short123")).toBeNull();
    expect(normalizeNewPassword("long enough")).toBe("long enough");
    expect(normalizeNewPassword("é".repeat(512))).toBe("é".repeat(512));
    expect(normalizeNewPassword("é".repeat(513))).toBeNull();
  });

  it("normalizes optional profile fields and session kinds", () => {
    expect(normalizeOptional("  Bacshop  ", 160)).toBe("Bacshop");
    expect(normalizeOptional("   ", 160)).toBeNull();
    expect(normalizeOptional("x".repeat(161), 160)).toBeNull();
    expect(sessionKind("CUSTOMER")).toBe("customer");
    expect(sessionKind("ADMIN")).toBe("admin");
  });

  it("recognizes only a Prisma unique violation and valid dates", () => {
    expect(isUniqueViolation({ code: "P2002" })).toBe(true);
    expect(isUniqueViolation({ code: "P2034" })).toBe(false);
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date("invalid"))).toBe(false);
  });
});
