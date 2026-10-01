import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const MFA_VERSION = "v1";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const MAX_CIPHERTEXT_LENGTH = 1024;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function totpUri(secret: string, email: string): string {
  const normalizedSecret = normalizeSecret(secret);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid MFA account email");
  const issuer = "Bacshop";
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?secret=${normalizedSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

export function matchTotpCounter(secret: string, code: string, now: Date): number | null {
  const normalizedSecret = normalizeSecret(secret);
  if (!/^\d{6}$/.test(code) || !(now instanceof Date) || !Number.isFinite(now.getTime())) return null;
  const current = Math.floor(now.getTime() / 1000 / TOTP_STEP_SECONDS);
  const supplied = Buffer.from(code, "ascii");
  for (const counter of [current - 1, current, current + 1]) {
    if (counter < 0) continue;
    const candidate = Buffer.from(totpCode(normalizedSecret, counter), "ascii");
    if (timingSafeEqual(candidate, supplied)) return counter;
  }
  return null;
}

export function encryptMfaSecret(secret: string, encryptionKey: string | Uint8Array, userId: string): string {
  const key = decodeKey(encryptionKey);
  const normalizedSecret = normalizeSecret(secret);
  const aad = accountAad(userId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(normalizedSecret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${MFA_VERSION}.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptMfaSecret(ciphertext: string, encryptionKey: string | Uint8Array, userId: string): string {
  if (typeof ciphertext !== "string" || ciphertext.length > MAX_CIPHERTEXT_LENGTH) throw new Error("Invalid MFA ciphertext");
  const parts = ciphertext.split(".");
  if (parts.length !== 4 || parts[0] !== MFA_VERSION) throw new Error("Invalid MFA ciphertext");
  const key = decodeKey(encryptionKey);
  const iv = decodeBase64Url(parts[1]);
  const tag = decodeBase64Url(parts[2]);
  const encrypted = decodeBase64Url(parts[3]);
  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH || encrypted.length === 0) throw new Error("Invalid MFA ciphertext");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(accountAad(userId));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return normalizeSecret(plaintext);
  } catch {
    throw new Error("Invalid MFA ciphertext");
  }
}

function normalizeSecret(secret: string): string {
  if (typeof secret !== "string") throw new Error("Invalid MFA secret");
  const normalized = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  if (normalized.length < 16 || normalized.length > 128 || !/^[A-Z2-7]+$/.test(normalized)) throw new Error("Invalid MFA secret");
  decodeBase32(normalized);
  return normalized;
}

function encodeBase32(value: Buffer): string {
  let bits = 0;
  let bitCount = 0;
  let output = "";
  for (const byte of value) {
    bits = (bits << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      output += BASE32[(bits >>> bitCount) & 31];
      bits &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }
  if (bitCount > 0) output += BASE32[(bits << (5 - bitCount)) & 31];
  return output;
}

function decodeBase32(value: string): Buffer {
  let bits = 0;
  let bitCount = 0;
  const bytes: number[] = [];
  for (const character of value) {
    const index = BASE32.indexOf(character);
    if (index < 0) throw new Error("Invalid MFA secret");
    bits = (bits << 5) | index;
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((bits >>> bitCount) & 255);
      bits &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }
  return Buffer.from(bytes);
}

function totpCode(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(TOTP_DIGITS, "0");
}

function decodeKey(value: string | Uint8Array): Buffer {
  const key = value instanceof Uint8Array ? Buffer.from(value) : decodeEncodedKey(value);
  if (key.length !== 32) throw new Error("MFA encryption key must be exactly 32 bytes");
  return key;
}

function decodeEncodedKey(value: string): Buffer {
  if (typeof value !== "string" || value.length === 0) throw new Error("Invalid MFA encryption key");
  if (/^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, "hex");
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === 32 && decoded.toString("base64").replace(/=+$/g, "") === value.replace(/=+$/g, "")) return decoded;
  }
  throw new Error("MFA encryption key must be exactly 32 bytes");
}

function decodeBase64Url(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid MFA ciphertext");
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length === 0) throw new Error("Invalid MFA ciphertext");
  return decoded;
}

function accountAad(userId: string): Buffer {
  if (typeof userId !== "string" || userId.length === 0 || userId.length > 255 || /[\r\n]/.test(userId)) throw new Error("Invalid account identifier");
  return Buffer.from(`bacshop:mfa:${MFA_VERSION}:${userId}`, "utf8");
}
