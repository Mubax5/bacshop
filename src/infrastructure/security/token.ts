import { createHash, randomBytes } from "node:crypto";

const MAX_TOKEN_LENGTH = 4096;

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Stores only this digest for opaque tokens; callers must never log the raw value. */
export function hashOpaqueToken(token: string): string {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) throw new Error("Invalid opaque token");
  return createHash("sha256").update(token, "utf8").digest("hex");
}
