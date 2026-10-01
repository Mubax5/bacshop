import { createOpaqueToken, hashOpaqueToken } from "./token";

export function createRecoveryCodes(count = 10): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 32) throw new Error("Invalid recovery code count");
  return Array.from({ length: count }, () => {
    const token = createOpaqueToken().replace(/[-_]/g, "").slice(0, 20).toUpperCase();
    return `${token.slice(0, 5)}-${token.slice(5, 10)}-${token.slice(10, 15)}-${token.slice(15)}`;
  });
}

export function hashRecoveryCode(code: string): string {
  return hashOpaqueToken(normalizeRecoveryCode(code));
}

export function verifyRecoveryCode(code: string, expectedHash: string): boolean {
  try {
    return hashRecoveryCode(code) === expectedHash;
  } catch {
    return false;
  }
}

function normalizeRecoveryCode(code: string): string {
  if (typeof code !== "string" || code.length > 128) throw new Error("Invalid recovery code");
  const normalized = code.replace(/[-\s]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{16,64}$/.test(normalized)) throw new Error("Invalid recovery code");
  return normalized;
}
