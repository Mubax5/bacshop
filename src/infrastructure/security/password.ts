import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const VERSION = "v1";
const N = 32_768;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_PASSWORD_LENGTH = 1024;

/** Hashes a password with bounded Node scrypt parameters. The encoded value is safe to persist. */
export async function hashPassword(password: string): Promise<string> {
  assertPassword(password);
  const salt = randomBytes(SALT_LENGTH);
  const derived = await derive(password, salt);
  return `${VERSION}$${N}$${R}$${P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/** Verifies only the versioned format emitted by hashPassword. Malformed values fail closed. */
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (typeof password !== "string" || password.length > MAX_PASSWORD_LENGTH || typeof encoded !== "string" || encoded.length > 512) return false;
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== VERSION || parts[1] !== String(N) || parts[2] !== String(R) || parts[3] !== String(P)) return false;
  try {
    const salt = Buffer.from(parts[4], "base64url");
    const expected = Buffer.from(parts[5], "base64url");
    if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
    const actual = await derive(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}

function assertPassword(password: string): void {
  if (typeof password !== "string" || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) throw new Error("Invalid password");
}
