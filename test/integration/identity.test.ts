import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createDatabase } from "@/infrastructure/db/client";
import { typedPrismaIdentityService } from "@/infrastructure/auth/prisma-identity-service";
import { hashPassword } from "@/infrastructure/security/password";

const connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_integration")) {
  throw new Error("Set BACSHOP_INTEGRATION_DATABASE_URL to an isolated database ending in _integration");
}

const run = randomUUID();
const encryptionKey = "00".repeat(32);
let database: PrismaClient;
let currentTime = new Date("2026-10-01T00:00:00.000Z");
const identity = () => typedPrismaIdentityService(database, { sessionTtlSeconds: 3600, adminSessionTtlSeconds: 8 * 60 * 60, reauthTtlSeconds: 300, emailRequired: true, mfaEncryptionKey: encryptionKey, now: () => currentTime });

function decodeBase32(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let count = 0;
  const bytes: number[] = [];
  for (const character of value.replace(/=+$/g, "").toUpperCase()) {
    bits = (bits << 5) | alphabet.indexOf(character);
    count += 5;
    if (count >= 8) {
      count -= 8;
      bytes.push((bits >>> count) & 255);
    }
  }
  return Buffer.from(bytes);
}

function totpCode(secret: string, at: Date): string {
  const counter = BigInt(Math.floor(at.getTime() / 1000 / 30));
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(counter);
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

async function createAdminFixture(email: string, password: string) {
  const user = await database.user.create({ data: { email, displayName: "Integration Admin", status: "ACTIVE", emailVerifiedAt: currentTime, authIdentities: { create: { type: "PASSWORD", provider: "password", passwordHash: await hashPassword(password) } } } });
  await database.adminRoleAssignment.create({ data: { userId: user.id, role: "SUPER_ADMIN" } });
  return user;
}

beforeAll(() => { database = createDatabase(connectionString); });
afterAll(async () => { await database?.$disconnect(); });

describe("durable identity and admin security", () => {
  it("registers pending customers, verifies email, and persists hashed sessions", async () => {
    const service = identity();
    const email = `${run}-customer@bacshop.test`;
    const registration = await service.register({ email, password: "correct horse battery staple", displayName: "Integration Customer" });
    expect(registration?.session).toBeNull();
    expect(registration?.verification?.email).toBe(email);
    expect(await service.authenticate({ email, password: "correct horse battery staple" })).toBeNull();
    const outstandingVerification = await service.requestVerification(email);
    expect(await service.verifyEmail(registration!.verification!.token)).toBe(true);
    expect(await service.verifyEmail(outstandingVerification!.token)).toBe(false);
    const issued = await service.authenticate({ email, password: "correct horse battery staple" });
    expect(issued).toMatchObject({ kind: "customer", requiresMfa: false, requiresMfaEnrollment: false });
    const stored = await database.session.findFirstOrThrow({ where: { userId: (await database.user.findUniqueOrThrow({ where: { email } })).id } });
    expect(stored.tokenHash).not.toBe(issued!.token);
    expect((await service.readSession(issued!.token))?.kind).toBe("customer");
    const independent = createDatabase(connectionString);
    try { expect((await independent.session.findUnique({ where: { id: stored.id } }))?.id).toBe(stored.id); } finally { await independent.$disconnect(); }
  });

  it("keeps customer and admin session kinds isolated and refreshes roles", async () => {
    const service = identity();
    const email = `${run}-admin@bacshop.test`;
    const bootstrap = await service.bootstrapAdmin({ email, password: "admin password", displayName: "Integration Admin" });
    if (bootstrap) expect(bootstrap.email).toBe(email);
    else await createAdminFixture(email, "admin password");
    const customer = await service.register({ email: `${run}-other@bacshop.test`, password: "customer password" });
    expect(customer?.verification).toBeTruthy();
    await service.verifyEmail(customer!.verification!.token);
    expect(await service.authenticate({ email: `${run}-other@bacshop.test`, password: "customer password", admin: true })).toBeNull();
    const pending = await service.authenticate({ email, password: "admin password", admin: true });
    expect(pending).toMatchObject({ kind: "admin", requiresMfa: true, requiresMfaEnrollment: true });
    expect(pending!.expiresAt.getTime() - currentTime.getTime()).toBe(10 * 60 * 1000);
    expect(await service.authenticate({ email, password: "admin password" })).toBeNull();
    expect(await service.completeMfa(customer ? customer.session?.token ?? "" : "", "123456")).toBeNull();
    const adminUser = await database.user.findUniqueOrThrow({ where: { email } });
    await database.adminRoleAssignment.updateMany({ where: { userId: adminUser.id, revokedAt: null }, data: { revokedAt: currentTime } });
    expect(await service.readSession(pending!.token)).toBeNull();
  });

  it("supports one-use reset tokens and revokes every session", async () => {
    const service = identity();
    const email = `${run}-reset@bacshop.test`;
    const weakEmail = `${run}-weak@bacshop.test`;
    expect(await service.register({ email: weakEmail, password: "short123" })).toBeNull();
    expect(await database.user.findUnique({ where: { email: weakEmail } })).toBeNull();
    const registration = await service.register({ email, password: "old password" });
    await service.verifyEmail(registration!.verification!.token);
    const first = await service.authenticate({ email, password: "old password" });
    const second = await service.authenticate({ email, password: "old password" });
    const weakChangeSession = await service.authenticate({ email, password: "old password" });
    expect(await service.changePassword(weakChangeSession!.token, "old password", "short123")).toBe(false);
    expect((await service.authenticate({ email, password: "old password" }))?.kind).toBe("customer");
    const reset = await service.requestPasswordReset(email);
    const outstanding = await service.requestPasswordReset(email);
    const weakReset = await service.requestPasswordReset(email);
    expect(reset?.email).toBe(email);
    expect(await service.resetPassword(weakReset!.token, "short123")).toBe(false);
    expect((await service.authenticate({ email, password: "old password" }))?.kind).toBe("customer");
    expect(await service.resetPassword(reset!.token, "new password")).toBe(true);
    expect(await service.resetPassword(reset!.token, "third password")).toBe(false);
    expect(await service.resetPassword(outstanding!.token, "third password")).toBe(false);
    expect(await service.readSession(first!.token)).toBeNull();
    expect(await service.readSession(second!.token)).toBeNull();
    expect((await service.authenticate({ email, password: "new password" }))?.kind).toBe("customer");
    const changeSession = await service.authenticate({ email, password: "new password" });
    const resetBeforeChange = await service.requestPasswordReset(email);
    expect(await service.changePassword(changeSession!.token, "new password", "changed password")).toBe(true);
    expect(await service.resetPassword(resetBeforeChange!.token, "reset-after-change")).toBe(false);
    expect((await service.authenticate({ email, password: "changed password" }))?.kind).toBe("customer");
  });

  it("expires, logs out, lists safely, and revokes owned sessions", async () => {
    const service = identity();
    const email = `${run}-sessions@bacshop.test`;
    const registration = await service.register({ email, password: "session password" });
    await service.verifyEmail(registration!.verification!.token);
    const one = await service.authenticate({ email, password: "session password" });
    const two = await service.authenticate({ email, password: "session password" });
    expect((await service.listSessions(one!.token)).every((entry) => !Object.hasOwn(entry, "tokenHash"))).toBe(true);
    const otherEmail = `${run}-sessions-other@bacshop.test`;
    const otherRegistration = await service.register({ email: otherEmail, password: "other password" });
    await service.verifyEmail(otherRegistration!.verification!.token);
    await service.authenticate({ email: otherEmail, password: "other password" });
    const otherUser = await database.user.findUniqueOrThrow({ where: { email: otherEmail } });
    const crossUserSession = await database.session.findFirstOrThrow({ where: { userId: otherUser.id } });
    expect(await service.revokeSession(one!.token, crossUserSession.id)).toBe(false);
    const currentSession = await service.readSession(one!.token);
    const otherSession = (await service.listSessions(one!.token)).find((entry) => entry.id !== currentSession?.sessionId);
    expect(otherSession).toBeTruthy();
    expect(await service.revokeSession(one!.token, otherSession!.id)).toBe(true);
    expect(await service.readSession(two!.token)).toBeNull();
    currentTime = new Date(currentTime.getTime() + 4000 * 1000);
    expect(await service.readSession(one!.token)).toBeNull();
    currentTime = new Date("2026-10-01T00:00:00.000Z");
    const renewed = await service.authenticate({ email, password: "session password" });
    expect(await service.logout(renewed!.token)).toBe(true);
    expect(await service.readSession(renewed!.token)).toBeNull();
  });

  it("encrypts MFA, accepts one concurrent TOTP, rotates to an eight-hour session, and enforces recovery/re-auth replay", async () => {
    const service = identity();
    const email = `${run}-mfa@bacshop.test`;
    await createAdminFixture(email, "mfa admin password");
    const pending = await service.authenticate({ email, password: "mfa admin password", admin: true });
    const concurrentPending = await service.authenticate({ email, password: "mfa admin password", admin: true });
    const enrollment = await service.beginMfaEnrollment(pending!.token);
    expect(enrollment?.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(await service.beginMfaEnrollment(pending!.token)).toEqual(enrollment);
    const factor = await database.mfaFactor.findFirstOrThrow({ where: { userId: (await database.user.findUniqueOrThrow({ where: { email } })).id } });
    expect(factor.secretCiphertext).not.toContain(enrollment!.secret);
    expect(factor.verifiedAt).toBeNull();
    const code = totpCode(enrollment!.secret, currentTime);
    const completions = await Promise.all([service.completeMfa(pending!.token, code), service.completeMfa(concurrentPending!.token, code)]);
    const winnerIndex = completions[0] ? 0 : 1;
    const winnerToken = winnerIndex === 0 ? pending!.token : concurrentPending!.token;
    const loserToken = winnerIndex === 0 ? concurrentPending!.token : pending!.token;
    expect(completions[winnerIndex]).toBeTruthy();
    expect(completions[1 - winnerIndex]).toBeNull();
    expect(await service.readSession(loserToken)).toMatchObject({ kind: "admin", requiresMfa: true, mfaVerifiedAt: null });
    expect(await service.completeMfa(loserToken, code)).toBeNull();
    const verified = completions[winnerIndex]!;
    expect(verified).toMatchObject({ kind: "admin", requiresMfa: false, requiresMfaEnrollment: false });
    expect(verified.expiresAt.getTime() - currentTime.getTime()).toBe(8 * 60 * 60 * 1000);
    expect(await service.readSession(winnerToken)).toBeNull();
    expect(await service.readSession(verified.token)).toMatchObject({ kind: "admin", mfaVerifiedAt: currentTime });
    expect((await database.mfaFactor.findUniqueOrThrow({ where: { id: factor.id } })).verifiedAt).toEqual(currentTime);

    const recoveryCode = verified.recoveryCodes?.[0];
    expect(recoveryCode).toBeTruthy();
    const recoveryLogin = await service.authenticate({ email, password: "mfa admin password", admin: true });
    const recovered = await service.completeMfa(recoveryLogin!.token, recoveryCode!);
    expect(recovered).toMatchObject({ kind: "admin", requiresMfa: false });
    const replayLogin = await service.authenticate({ email, password: "mfa admin password", admin: true });
    expect(await service.completeMfa(replayLogin!.token, recoveryCode!)).toBeNull();

    currentTime = new Date(currentTime.getTime() + 30 * 1000);
    const reauthCode = totpCode(enrollment!.secret, currentTime);
    expect(await service.reauthenticate(recovered!.token, "mfa admin password", reauthCode)).toBe(true);
    expect(await service.reauthenticate(recovered!.token, "mfa admin password", reauthCode)).toBe(false);
    const resolvedAfterReauth = await service.readSession(recovered!.token);
    const reauthenticated = await database.session.findUniqueOrThrow({ where: { id: resolvedAfterReauth!.sessionId } });
    expect(reauthenticated.reauthExpiresAt).toEqual(new Date(currentTime.getTime() + 5 * 60 * 1000));
    currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000 + 1);
    const afterReauthExpiry = await service.readSession(recovered!.token);
    expect(afterReauthExpiry?.reauthExpiresAt && afterReauthExpiry.reauthExpiresAt <= currentTime).toBe(true);

    await database.mfaFactor.update({ where: { id: factor.id }, data: { disabledAt: currentTime } });
    expect(await service.readSession(recovered!.token)).toBeNull();
  });
});
