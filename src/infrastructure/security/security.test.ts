import { describe, expect, it } from "vitest";
import { cookieName, issueCsrfToken, validateCsrfRequest, verifyCsrfToken } from "./csrf";
import { decryptMfaSecret, encryptMfaSecret, matchTotpCounter, newTotpSecret, totpUri } from "./mfa";
import { createRecoveryCodes, hashRecoveryCode, verifyRecoveryCode } from "./recovery-codes";
import { hashPassword, verifyPassword } from "./password";
import { createOpaqueToken, hashOpaqueToken } from "./token";

describe("security primitives", () => {
  it("hashes and verifies passwords without accepting malformed encodings", async () => {
    const encoded = await hashPassword("correct horse battery staple");
    expect(encoded.startsWith("v1$32768$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", encoded)).toBe(true);
    expect(await verifyPassword("wrong", encoded)).toBe(false);
    expect(await verifyPassword("correct horse battery staple", "v1$32768$8$1$bad$bad")).toBe(false);
  }, 15_000);

  it("creates opaque tokens and one way digests", () => {
    const token = createOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashOpaqueToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
  });

  it("matches RFC 6238 SHA-1 vectors within one step", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(matchTotpCounter(secret, "287082", new Date(59_000))).toBe(1);
    expect(matchTotpCounter(secret, "081804", new Date(1_111_111_109_000))).toBe(37_037_036);
    expect(matchTotpCounter(secret, "000000", new Date(59_000))).toBeNull();
    expect(totpUri(secret, "admin@example.com")).toContain("otpauth://totp/Bacshop%3Aadmin%40example.com");
    expect(newTotpSecret()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it("encrypts MFA secrets with account-bound authenticated encryption", () => {
    const key = "0123456789abcdef".repeat(4);
    const ciphertext = encryptMfaSecret("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", key, "user-1");
    expect(decryptMfaSecret(ciphertext, key, "user-1")).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(() => decryptMfaSecret(ciphertext, key, "user-2")).toThrow();
    expect(() => decryptMfaSecret(`${ciphertext}x`, key, "user-1")).toThrow();
  });

  it("hashes and verifies recovery codes", () => {
    const code = createRecoveryCodes(1)[0];
    const digest = hashRecoveryCode(code);
    expect(verifyRecoveryCode(code, digest)).toBe(true);
    expect(verifyRecoveryCode(`${code}x`, digest)).toBe(false);
  });

  it("enforces signed and expiring CSRF tokens", async () => {
    const secret = "csrf-development-secret";
    const token = await issueCsrfToken(secret, 1000);
    expect(await verifyCsrfToken(token, secret, 1000 + 3599)).toBe(true);
    expect(await verifyCsrfToken(token, secret, 1000 + 3601)).toBe(false);
    expect(await verifyCsrfToken(token, secret, 1000 - 61)).toBe(false);
    expect(await verifyCsrfToken(token, "other-secret", 1000)).toBe(false);
    expect(await verifyCsrfToken(await issueCsrfToken(undefined, 1000), undefined, 1000)).toBe(true);
    expect(cookieName(true)).toBe("__Host-bacshop-csrf");
  });

  it("requires exact trusted origin and matching cookie/form token", async () => {
    const token = await issueCsrfToken("csrf-production-secret");
    const request = new Request("https://shop.example.com/account", { method: "POST", headers: { origin: "https://shop.example.com", cookie: `__Host-bacshop-csrf=${token}` } });
    expect(await validateCsrfRequest(request, token, { trustedOrigins: ["https://shop.example.com"], secret: "csrf-production-secret", isProduction: true })).toBe(true);
    expect(await validateCsrfRequest(new Request(request, { headers: { origin: "https://evil.example", cookie: `__Host-bacshop-csrf=${token}` } }), token, { trustedOrigins: ["https://shop.example.com"], secret: "csrf-production-secret", isProduction: true })).toBe(false);
    expect(await validateCsrfRequest(request, token, { trustedOrigins: ["https://shop.example.com"], isProduction: true })).toBe(false);
  });
});
