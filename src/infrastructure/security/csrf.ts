const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 60 * 60;
const MAX_TOKEN_LENGTH = 512;
const COOKIE_BASE = "bacshop-csrf";

/** The production cookie name uses the host-only prefix and therefore cannot carry a Domain attribute. */
export function cookieName(isProduction: boolean): string {
  return isProduction ? `__Host-${COOKIE_BASE}` : COOKIE_BASE;
}

/** Issues a compact Web Crypto token. Supplying a secret turns the double-submit token into a signed token. */
export async function issueCsrfToken(secret?: string, now = currentSeconds()): Promise<string> {
  assertTimestamp(now);
  const nonce = encode(await randomBytes(32));
  const payload = `${TOKEN_VERSION}.${Math.floor(now)}.${nonce}`;
  if (secret === undefined) return payload;
  assertSecret(secret);
  return `${payload}.${encode(await hmac(secret, payload))}`;
}

export async function verifyCsrfToken(token: string, secret?: string, now = currentSeconds()): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return false;
  if (!Number.isFinite(now)) return false;
  const parts = token.split(".");
  const signed = secret !== undefined;
  if (parts.length !== (signed ? 4 : 3) || parts[0] !== TOKEN_VERSION) return false;
  const timestamp = Number(parts[1]);
  const age = Math.floor(now) - timestamp;
  if (!/^\d+$/.test(parts[1]) || !Number.isSafeInteger(timestamp) || age < -60 || age > TOKEN_TTL_SECONDS) return false;
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(parts[2])) return false;
  const payload = parts.slice(0, 3).join(".");
  try {
    const nonce = decode(parts[2]);
    if (nonce.length !== 32) return false;
    if (!signed) return true;
    assertSecret(secret);
    const supplied = decode(parts[3]);
    const expected = await hmac(secret, payload);
    return supplied.length === expected.length && await subtleVerify(secret, payload, supplied);
  } catch {
    return false;
  }
}

/** Validates a state-changing request at the server boundary. */
export async function validateCsrfRequest(
  request: Request,
  submittedToken: string | undefined,
  config: { trustedOrigins: readonly string[]; secret?: string; isProduction: boolean },
): Promise<boolean> {
  if (!(request instanceof Request) || !Array.isArray(config.trustedOrigins) || config.trustedOrigins.length === 0) return false;
  if (config.isProduction && config.secret === undefined) return false;
  if (config.secret !== undefined) assertSecret(config.secret);
  const origin = request.headers.get("origin");
  if (origin === null || !config.trustedOrigins.some((trusted) => origin === trusted)) return false;
  if (typeof submittedToken !== "string" || submittedToken.length > MAX_TOKEN_LENGTH) return false;
  const cookie = readCookie(request.headers.get("cookie"), cookieName(config.isProduction));
  if (cookie === null || cookie.length > MAX_TOKEN_LENGTH) return false;
  if (!constantTimeStringEqual(cookie, submittedToken)) return false;
  return verifyCsrfToken(submittedToken, config.secret);
}

function currentSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function assertTimestamp(now: number): void {
  if (!Number.isFinite(now) || !Number.isSafeInteger(Math.floor(now)) || now < 0) throw new Error("Invalid CSRF timestamp");
}

function assertSecret(secret: string): void {
  if (typeof secret !== "string" || secret.length < 16 || secret.length > 4096) throw new Error("Invalid CSRF secret");
}

function readCookie(header: string | null, name: string): string | null {
  if (!header || header.length > 8192) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) {
      const value = part.slice(separator + 1).trim();
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

function constantTimeStringEqual(left: string, right: string): boolean {
  const max = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < max; index += 1) difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return difference === 0;
}

function cryptoApi(): Crypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) throw new Error("Web Crypto is unavailable");
  return globalThis.crypto;
}

async function randomBytes(length: number): Promise<Uint8Array> {
  const bytes = new Uint8Array(length);
  cryptoApi().getRandomValues(bytes);
  return bytes;
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await cryptoApi().subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await cryptoApi().subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

async function subtleVerify(secret: string, value: string, signature: Uint8Array): Promise<boolean> {
  const key = await cryptoApi().subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return cryptoApi().subtle.verify("HMAC", key, signature as unknown as BufferSource, new TextEncoder().encode(value));
}

function encode(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) result += String.fromCharCode(byte);
  return btoa(result).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid CSRF encoding");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(normalized);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return output;
}
