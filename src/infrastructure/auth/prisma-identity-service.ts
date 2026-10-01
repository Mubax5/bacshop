import type { AdminRole, Prisma, PrismaClient, ResellerStatus } from "@/generated/prisma/client";
import { createRecoveryCodes, hashRecoveryCode } from "@/infrastructure/security/recovery-codes";
import { decryptMfaSecret, encryptMfaSecret, matchTotpCounter, newTotpSecret, totpUri } from "@/infrastructure/security/mfa";
import { hashPassword, verifyPassword } from "@/infrastructure/security/password";
import { createOpaqueToken, hashOpaqueToken } from "@/infrastructure/security/token";
import { serializableTransaction } from "@/infrastructure/db/transaction";
import { auditData, isUniqueViolation, isValidDate, MAX_DISPLAY_NAME, MAX_PHONE, normalizeEmail, normalizeNewPassword, normalizeOptional, normalizePassword, sessionKind } from "./identity-service-helpers";

type Database = PrismaClient;
type Transaction = Prisma.TransactionClient;
type Clock = () => Date;

export type SessionKindValue = "customer" | "admin";

export interface IssuedSession {
  token: string;
  expiresAt: Date;
  kind: SessionKindValue;
  requiresMfa: boolean;
  requiresMfaEnrollment: boolean;
}

export interface ResolvedSession {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string | null;
  kind: SessionKindValue;
  adminRoles: AdminRole[];
  mfaVerifiedAt: Date | null;
  reauthExpiresAt: Date | null;
  expiresAt: Date;
  reseller: { status: ResellerStatus; tierCode: string | null } | null;
  requiresMfa: boolean;
  requiresMfaEnrollment: boolean;
}

export interface IdentityServiceOptions {
  sessionTtlSeconds: number;
  adminSessionTtlSeconds?: number;
  reauthTtlSeconds?: number;
  emailRequired: boolean;
  mfaEncryptionKey: string | Uint8Array;
  now?: Clock;
}

export interface RegistrationInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegistrationResult {
  session: IssuedSession | null;
  verification: { email: string; token: string } | null;
}

export interface SessionSummary {
  id: string;
  kind: SessionKindValue;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  current: boolean;
}

export interface ProfileResult {
  displayName: string | null;
  phone: string | null;
}

export interface MfaEnrollment {
  secret: string;
  uri: string;
}

export interface CompleteMfaResult extends IssuedSession {
  recoveryCodes?: string[];
}

async function audit(tx: Transaction, input: { actorUserId?: string; action: string; entityType: string; entityId?: string; reason?: string; afterData?: Record<string, unknown> }) {
  await tx.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      reason: input.reason,
      afterData: input.afterData ? auditData(input.afterData) : undefined,
    },
  });
}

export function typedPrismaIdentityService(database: Database, options: IdentityServiceOptions) {
  const now: Clock = options.now ?? (() => new Date());
  const sessionTtlSeconds = options.sessionTtlSeconds;
  const adminSessionTtlSeconds = options.adminSessionTtlSeconds ?? sessionTtlSeconds;
  const reauthTtlSeconds = options.reauthTtlSeconds ?? 300;
  if (!Number.isInteger(sessionTtlSeconds) || sessionTtlSeconds <= 0) throw new Error("Invalid customer session TTL");
  if (!Number.isInteger(adminSessionTtlSeconds) || adminSessionTtlSeconds <= 0) throw new Error("Invalid admin session TTL");
  if (!Number.isInteger(reauthTtlSeconds) || reauthTtlSeconds <= 0) throw new Error("Invalid reauthentication TTL");
  if (!options.mfaEncryptionKey) throw new Error("MFA encryption key is required");
  let dummyPasswordHash: Promise<string> | undefined;
  async function rejectCredentials(password: string): Promise<null> {
    dummyPasswordHash ??= hashPassword(createOpaqueToken());
    await verifyPassword(password, await dummyPasswordHash);
    return null;
  }

  const sessionExpiry = (kind: SessionKindValue, current: Date, pendingMfa: boolean) => new Date(current.getTime() + (kind === "admin" ? (pendingMfa ? 10 * 60 : adminSessionTtlSeconds) : sessionTtlSeconds) * 1000);
  const safeTokenHash = (token: string): string | null => {
    try {
      return hashOpaqueToken(token);
    } catch {
      return null;
    }
  };
  const safeRecoveryHash = (code: string): string | null => {
    try {
      return hashRecoveryCode(code);
    } catch {
      return null;
    }
  };

  async function issueSession(tx: Transaction, userId: string, kind: SessionKindValue, current: Date, mfaVerifiedAt: Date | null = null, pendingMfa = false): Promise<IssuedSession> {
    const token = createOpaqueToken();
    const expiresAt = sessionExpiry(kind, current, pendingMfa);
    await tx.session.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(token),
        kind: kind === "admin" ? "ADMIN" : "CUSTOMER",
        context: "RETAIL",
        expiresAt,
        mfaVerifiedAt,
      },
    });
    const requiresMfa = kind === "admin";
    const requiresMfaEnrollment = false;
    return { token, expiresAt, kind, requiresMfa, requiresMfaEnrollment };
  }

  async function hasVerifiedMfa(userId: string, tx: Transaction | Database = database): Promise<boolean> {
    const factor = await tx.mfaFactor.findFirst({ where: { userId, type: "TOTP", verifiedAt: { not: null }, disabledAt: null }, select: { id: true } });
    return Boolean(factor);
  }

  async function readSession(token: string | undefined): Promise<ResolvedSession | null> {
    if (!token || typeof token !== "string" || token.length > 4096) return null;
    const tokenHash = safeTokenHash(token);
    if (!tokenHash) return null;
    const current = now();
    if (!isValidDate(current)) return null;
    const record = await database.session.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, kind: true, expiresAt: true, revokedAt: true, mfaVerifiedAt: true, reauthExpiresAt: true },
    });
    if (!record || record.revokedAt || record.expiresAt <= current) return null;
    const user = await database.user.findUnique({ where: { id: record.userId }, select: { id: true, email: true, displayName: true, status: true, emailVerifiedAt: true } });
    if (!user || user.status === "DISABLED" || user.status === "LOCKED") return null;
    if (options.emailRequired && (!user.emailVerifiedAt || user.status === "PENDING_VERIFICATION")) return null;
    const roleRows = await database.adminRoleAssignment.findMany({ where: { userId: user.id, revokedAt: null }, select: { role: true } });
    const adminRoles = roleRows.map((row) => row.role);
    const kind = sessionKind(record.kind);
    if (kind === "admin" && adminRoles.length === 0) return null;
    const resellerProfile = await database.resellerProfile.findUnique({ where: { userId: user.id }, select: { status: true, tier: { select: { code: true } } } });
    const mfaRequired = kind === "admin";
    const verifiedFactor = kind === "admin" && (await hasVerifiedMfa(user.id));
    if (kind === "admin" && record.mfaVerifiedAt && !verifiedFactor) return null;
    const mfaEnrollmentRequired = kind === "admin" && !verifiedFactor;
    const refreshed = await database.session.updateMany({ where: { id: record.id, revokedAt: null, expiresAt: { gt: current } }, data: { lastSeenAt: current } });
    if (refreshed.count !== 1) return null;
    return {
      sessionId: record.id,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      kind,
      adminRoles,
      mfaVerifiedAt: record.mfaVerifiedAt,
      reauthExpiresAt: record.reauthExpiresAt,
      expiresAt: record.expiresAt,
      reseller: resellerProfile ? { status: resellerProfile.status, tierCode: resellerProfile.tier?.code ?? null } : null,
      requiresMfa: mfaRequired && !record.mfaVerifiedAt,
      requiresMfaEnrollment: mfaEnrollmentRequired,
    };
  }

  async function register(input: RegistrationInput): Promise<RegistrationResult | null> {
    const email = normalizeEmail(input.email);
    const password = normalizeNewPassword(input.password);
    const displayName = normalizeOptional(input.displayName, MAX_DISPLAY_NAME);
    if (!email || !password || displayName === null) return null;
    const current = now();
    try {
      return await serializableTransaction(database, async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            displayName,
            status: options.emailRequired ? "PENDING_VERIFICATION" : "ACTIVE",
            emailVerifiedAt: options.emailRequired ? null : current,
            authIdentities: { create: { type: "PASSWORD", provider: "password", passwordHash: await hashPassword(password) } },
          },
        });
        let verification: RegistrationResult["verification"] = null;
        if (options.emailRequired) {
          const token = createOpaqueToken();
          await tx.emailVerificationToken.create({ data: { userId: user.id, tokenHash: hashOpaqueToken(token), expiresAt: new Date(current.getTime() + 24 * 60 * 60 * 1000) } });
          verification = { email, token };
        }
        await audit(tx, { actorUserId: user.id, action: "identity.register", entityType: "user", entityId: user.id, afterData: { emailPresent: true, emailRequired: options.emailRequired } });
        const session = options.emailRequired ? null : await issueSession(tx, user.id, "customer", current);
        return { session, verification };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async function authenticate(input: { email: string; password: string; admin?: boolean }): Promise<IssuedSession | null> {
    const email = normalizeEmail(input.email);
    const password = normalizePassword(input.password);
    if (!email || !password) return null;
    const current = now();
    const isAdmin = input.admin === true;
    return serializableTransaction(database, async (tx) => {
        const lockedUsers = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "users" WHERE "email" = ${email} FOR UPDATE`;
        const lockedUser = lockedUsers[0];
        if (!lockedUser) return rejectCredentials(password);
        await tx.$queryRaw`SELECT "id" FROM "auth_identities" WHERE "userId" = ${lockedUser.id}::uuid AND "type" = 'PASSWORD' FOR UPDATE`;
        const user = await tx.user.findUnique({ where: { id: lockedUser.id }, select: { id: true, status: true, emailVerifiedAt: true, authIdentities: { where: { type: "PASSWORD" }, select: { passwordHash: true } } } });
        if (!user || user.status === "DISABLED" || user.status === "LOCKED" || (options.emailRequired && (!user.emailVerifiedAt || user.status === "PENDING_VERIFICATION"))) return rejectCredentials(password);
        const passwordHash = user.authIdentities[0]?.passwordHash;
        if (!passwordHash) return rejectCredentials(password);
        if (!(await verifyPassword(password, passwordHash))) return null;
        const roles = await tx.adminRoleAssignment.findMany({ where: { userId: user.id, revokedAt: null }, select: { role: true } });
        if (isAdmin ? roles.length === 0 : roles.length > 0) return null;
        await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: current } });
        const issued = await issueSession(tx, user.id, isAdmin ? "admin" : "customer", current, null, isAdmin);
        issued.requiresMfa = isAdmin;
        issued.requiresMfaEnrollment = isAdmin && !(await hasVerifiedMfa(user.id, tx));
        await audit(tx, { actorUserId: user.id, action: isAdmin ? "identity.admin_login" : "identity.login", entityType: "session", afterData: { kind: isAdmin ? "admin" : "customer" } });
        return issued;
    });
  }

  async function logout(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    const tokenHash = safeTokenHash(token);
    if (!tokenHash) return false;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      const result = await tx.session.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: current, revokedReason: "logout" } });
      if (result.count === 0) return false;
      const session = await tx.session.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
      await audit(tx, { actorUserId: session?.userId, action: "identity.logout", entityType: "session", entityId: session?.id, afterData: { reason: "logout" } });
      return true;
    });
  }

  async function requestPasswordReset(emailInput: string): Promise<{ email: string; token: string } | null> {
    const email = normalizeEmail(emailInput);
    if (!email) return null;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      const user = await tx.user.findUnique({ where: { email }, select: { id: true, email: true, status: true } });
      if (!user || user.status === "DISABLED") return null;
      const token = createOpaqueToken();
      await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashOpaqueToken(token), expiresAt: new Date(current.getTime() + 60 * 60 * 1000) } });
      await audit(tx, { actorUserId: user.id, action: "identity.password_reset_requested", entityType: "user", entityId: user.id, afterData: { emailPresent: true } });
      return { email, token };
    });
  }

  async function resetPassword(token: string, newPassword: string): Promise<boolean> {
    const password = normalizeNewPassword(newPassword);
    if (!token || !password) return false;
    const tokenHash = safeTokenHash(token);
    if (!tokenHash) return false;
    const current = now();
    return serializableTransaction(database, async (tx) => {
        const reset = await tx.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true, usedAt: true } });
        if (!reset || reset.usedAt || reset.expiresAt <= current) return false;
        const user = await tx.user.findUnique({ where: { id: reset.userId }, select: { id: true, status: true } });
        if (!user || user.status === "DISABLED") return false;
        const identity = await tx.authIdentity.findFirst({ where: { userId: user.id, type: "PASSWORD" }, select: { id: true } });
        if (!identity) return false;
        await tx.authIdentity.update({ where: { id: identity.id }, data: { passwordHash: await hashPassword(password) } });
        await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: current } });
        await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: current, revokedReason: "password_reset" } });
        await audit(tx, { actorUserId: user.id, action: "identity.password_reset", entityType: "user", entityId: user.id, afterData: { sessionsRevoked: true } });
        return true;
      });
  }

  async function requestVerification(emailInput: string): Promise<{ email: string; token: string } | null> {
    const email = normalizeEmail(emailInput);
    if (!email) return null;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      const user = await tx.user.findUnique({ where: { email }, select: { id: true, email: true, status: true, emailVerifiedAt: true } });
      if (!user || user.status === "DISABLED" || user.emailVerifiedAt) return null;
      const token = createOpaqueToken();
      await tx.emailVerificationToken.create({ data: { userId: user.id, tokenHash: hashOpaqueToken(token), expiresAt: new Date(current.getTime() + 24 * 60 * 60 * 1000) } });
      await audit(tx, { actorUserId: user.id, action: "identity.email_verification_requested", entityType: "user", entityId: user.id, afterData: { emailPresent: true } });
      return { email, token };
    });
  }

  async function verifyEmail(token: string): Promise<boolean> {
    if (!token) return false;
    const tokenHash = safeTokenHash(token);
    if (!tokenHash) return false;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      const verification = await tx.emailVerificationToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true, usedAt: true } });
      if (!verification || verification.usedAt || verification.expiresAt <= current) return false;
      const user = await tx.user.findUnique({ where: { id: verification.userId }, select: { id: true, status: true } });
      if (!user || user.status === "DISABLED") return false;
      await tx.emailVerificationToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: current } });
      await tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: current, ...(user.status === "PENDING_VERIFICATION" ? { status: "ACTIVE" } : {}) } });
      await audit(tx, { actorUserId: user.id, action: "identity.email_verified", entityType: "user", entityId: user.id, afterData: { verified: true } });
      return true;
    });
  }

  async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const password = normalizePassword(currentPassword);
    const nextPassword = normalizeNewPassword(newPassword);
    if (!password || !nextPassword) return false;
    const session = await readSession(token);
    if (!session) return false;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      const freshSession = await tx.session.findUnique({ where: { id: session.sessionId }, select: { id: true, userId: true, revokedAt: true, expiresAt: true } });
      if (!freshSession || freshSession.userId !== session.userId || freshSession.revokedAt || freshSession.expiresAt <= current) return false;
      const identity = await tx.authIdentity.findFirst({ where: { userId: session.userId, type: "PASSWORD" }, select: { id: true, passwordHash: true } });
      if (!identity?.passwordHash || !(await verifyPassword(password, identity.passwordHash))) return false;
      await tx.authIdentity.update({ where: { id: identity.id }, data: { passwordHash: await hashPassword(nextPassword) } });
      await tx.passwordResetToken.updateMany({ where: { userId: session.userId, usedAt: null }, data: { usedAt: current } });
      await tx.session.updateMany({ where: { userId: session.userId, revokedAt: null }, data: { revokedAt: current, revokedReason: "password_changed" } });
      await audit(tx, { actorUserId: session.userId, action: "identity.password_changed", entityType: "user", entityId: session.userId, afterData: { sessionsRevoked: true } });
      return true;
    });
  }

  async function listSessions(token: string): Promise<SessionSummary[]> {
    const session = await readSession(token);
    if (!session) return [];
    const rows = await database.session.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true } });
    return rows.map((row) => ({ id: row.id, kind: sessionKind(row.kind), createdAt: row.createdAt, lastSeenAt: row.lastSeenAt, expiresAt: row.expiresAt, revokedAt: row.revokedAt, current: row.id === session.sessionId }));
  }

  async function revokeSession(token: string, targetSessionId: string): Promise<boolean> {
    const session = await readSession(token);
    if (!session || !targetSessionId) return false;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      const target = await tx.session.findFirst({ where: { id: targetSessionId, userId: session.userId, revokedAt: null }, select: { id: true } });
      if (!target) return false;
      await tx.session.update({ where: { id: target.id }, data: { revokedAt: current, revokedReason: "user_revoked" } });
      await audit(tx, { actorUserId: session.userId, action: "identity.session_revoked", entityType: "session", entityId: target.id, afterData: { reason: "user_revoked" } });
      return true;
    });
  }

  async function updateProfile(token: string, input: { displayName?: string; phone?: string }): Promise<ProfileResult | null> {
    const session = await readSession(token);
    if (!session) return null;
    const displayName = normalizeOptional(input.displayName, MAX_DISPLAY_NAME);
    const phone = normalizeOptional(input.phone, MAX_PHONE);
    if (displayName === null || phone === null) return null;
    return serializableTransaction(database, async (tx) => {
      const user = await tx.user.update({ where: { id: session.userId }, data: { ...(displayName !== undefined ? { displayName } : {}), ...(phone !== undefined ? { phone } : {}) }, select: { displayName: true, phone: true } });
      await audit(tx, { actorUserId: session.userId, action: "identity.profile_updated", entityType: "user", entityId: session.userId, afterData: { fields: Object.keys(input).filter((field) => field === "displayName" || field === "phone") } });
      return user;
    });
  }

  async function beginMfaEnrollment(token: string): Promise<MfaEnrollment | null> {
    const session = await readSession(token);
    if (!session || session.kind !== "admin" || session.mfaVerifiedAt || !session.requiresMfaEnrollment) return null;
    return serializableTransaction(database, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "sessions" WHERE "id" = ${session.sessionId}::uuid FOR UPDATE`;
      const freshSession = await tx.session.findUnique({ where: { id: session.sessionId }, select: { id: true, userId: true, kind: true, revokedAt: true, expiresAt: true, mfaVerifiedAt: true } });
      if (!freshSession || freshSession.userId !== session.userId || freshSession.kind !== "ADMIN" || freshSession.revokedAt || freshSession.expiresAt <= now() || freshSession.mfaVerifiedAt) return null;
      const roles = await tx.adminRoleAssignment.findFirst({ where: { userId: session.userId, revokedAt: null }, select: { id: true } });
      if (!roles) return null;
      await tx.$queryRaw`SELECT "id" FROM "mfa_factors" WHERE "userId" = ${session.userId}::uuid AND "type" = 'TOTP' AND "disabledAt" IS NULL FOR UPDATE`;
      const existing = await tx.mfaFactor.findFirst({ where: { userId: session.userId, type: "TOTP", disabledAt: null }, select: { id: true, secretCiphertext: true, verifiedAt: true } });
      if (existing?.verifiedAt) return null;
      let secret: string;
      if (existing) {
        try {
          // Enrollment is idempotent so a render retry cannot silently replace
          // the secret shown by the first request.
          secret = decryptMfaSecret(existing.secretCiphertext, options.mfaEncryptionKey, session.userId);
        } catch {
          return null;
        }
      } else {
        secret = newTotpSecret();
        await tx.mfaFactor.create({ data: { userId: session.userId, type: "TOTP", secretCiphertext: encryptMfaSecret(secret, options.mfaEncryptionKey, session.userId) } });
      }
      await audit(tx, { actorUserId: session.userId, action: "identity.mfa_enrollment_started", entityType: "mfa_factor", entityId: existing?.id, afterData: { type: "TOTP" } });
      return { secret, uri: totpUri(secret, session.email) };
    });
  }

  async function completeMfa(token: string, input: string | { code?: string; recoveryCode?: string }): Promise<CompleteMfaResult | null> {
    const session = await readSession(token);
    if (!session || session.kind !== "admin" || session.mfaVerifiedAt) return null;
    const code = typeof input === "string" ? input : input.code;
    const recoveryCode = typeof input === "string" ? (input.match(/^\d{6}$/) ? undefined : input) : input.recoveryCode;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "sessions" WHERE "id" = ${session.sessionId}::uuid FOR UPDATE`;
      const freshSession = await tx.session.findUnique({ where: { id: session.sessionId }, select: { id: true, userId: true, revokedAt: true, expiresAt: true, mfaVerifiedAt: true } });
      if (!freshSession || freshSession.userId !== session.userId || freshSession.revokedAt || freshSession.expiresAt <= current || freshSession.mfaVerifiedAt) return null;
      const activeRole = await tx.adminRoleAssignment.findFirst({ where: { userId: session.userId, revokedAt: null }, select: { id: true } });
      if (!activeRole) return null;
      await tx.$queryRaw`SELECT "id" FROM "mfa_factors" WHERE "userId" = ${session.userId}::uuid AND "type" = 'TOTP' AND "disabledAt" IS NULL FOR UPDATE`;
      const factor = await tx.mfaFactor.findFirst({ where: { userId: session.userId, type: "TOTP", disabledAt: null }, select: { id: true, secretCiphertext: true, verifiedAt: true, lastUsedCounter: true } });
      if (!factor) return null;
      let accepted = false;
      let counter: number | null = null;
      let usedRecovery = false;
      if (code && /^\d{6}$/.test(code) && factor.secretCiphertext) {
        try {
          const secret = decryptMfaSecret(factor.secretCiphertext, options.mfaEncryptionKey, session.userId);
          counter = matchTotpCounter(secret, code, current);
          accepted = counter !== null && (factor.lastUsedCounter === null || BigInt(counter) > factor.lastUsedCounter);
        } catch {
          accepted = false;
        }
      }
      if (!accepted && recoveryCode) {
        const recoveryHash = safeRecoveryHash(recoveryCode);
        const recovery = recoveryHash ? await tx.mfaRecoveryCode.findUnique({ where: { codeHash: recoveryHash }, select: { id: true, userId: true, factorId: true, usedAt: true } }) : null;
        if (recovery && factor.verifiedAt && recovery.userId === session.userId && (!recovery.factorId || recovery.factorId === factor.id) && !recovery.usedAt) {
          await tx.mfaRecoveryCode.update({ where: { id: recovery.id }, data: { usedAt: current } });
          accepted = true;
          usedRecovery = true;
        }
      }
      if (!accepted) return null;
      await tx.mfaFactor.update({ where: { id: factor.id }, data: { verifiedAt: factor.verifiedAt ?? current, lastUsedAt: current, ...(counter === null ? {} : { lastUsedCounter: BigInt(counter) }) } });
      await tx.session.update({ where: { id: session.sessionId }, data: { revokedAt: current, revokedReason: "mfa_completed" } });
      const issued = await issueSession(tx, session.userId, "admin", current, current);
      issued.requiresMfa = false;
      issued.requiresMfaEnrollment = false;
      let recoveryCodes: string[] | undefined;
      if (!factor.verifiedAt) {
        recoveryCodes = createRecoveryCodes();
        await tx.mfaRecoveryCode.createMany({ data: recoveryCodes.map((recoveryCode) => ({ userId: session.userId, factorId: factor.id, codeHash: hashRecoveryCode(recoveryCode) })) });
      }
      await audit(tx, { actorUserId: session.userId, action: "identity.mfa_enrollment_completed", entityType: "mfa_factor", entityId: factor.id, afterData: { type: "TOTP", recoveryUsed: usedRecovery } });
      return { ...issued, ...(recoveryCodes ? { recoveryCodes } : {}) };
    });
  }

  async function reauthenticate(token: string, password: string, codeOrRecovery?: string): Promise<boolean> {
    const session = await readSession(token);
    const candidate = normalizePassword(password);
    if (!session || session.kind !== "admin" || !session.mfaVerifiedAt || !candidate || !codeOrRecovery) return false;
    const identity = await database.authIdentity.findFirst({ where: { userId: session.userId, type: "PASSWORD" }, select: { passwordHash: true } });
    if (!identity?.passwordHash || !(await verifyPassword(candidate, identity.passwordHash))) return false;
    const current = now();
    return serializableTransaction(database, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "sessions" WHERE "id" = ${session.sessionId}::uuid AND "revokedAt" IS NULL FOR UPDATE`;
      const fresh = await tx.session.findUnique({ where: { id: session.sessionId }, select: { id: true, userId: true, mfaVerifiedAt: true, expiresAt: true, revokedAt: true } });
      if (!fresh || fresh.userId !== session.userId || !fresh.mfaVerifiedAt || fresh.revokedAt || fresh.expiresAt <= current) return false;
      const activeRole = await tx.adminRoleAssignment.findFirst({ where: { userId: session.userId, revokedAt: null }, select: { id: true } });
      if (!activeRole) return false;
      await tx.$queryRaw`SELECT "id" FROM "mfa_factors" WHERE "userId" = ${session.userId}::uuid AND "type" = 'TOTP' AND "disabledAt" IS NULL FOR UPDATE`;
      const factor = await tx.mfaFactor.findFirst({ where: { userId: session.userId, type: "TOTP", disabledAt: null, verifiedAt: { not: null } }, select: { id: true, secretCiphertext: true, lastUsedCounter: true } });
      if (!factor) return false;
      let accepted = false;
      let counter: number | null = null;
      if (/^\d{6}$/.test(codeOrRecovery)) {
        try {
          const secret = decryptMfaSecret(factor.secretCiphertext, options.mfaEncryptionKey, session.userId);
          counter = matchTotpCounter(secret, codeOrRecovery, current);
          accepted = counter !== null && (factor.lastUsedCounter === null || BigInt(counter) > factor.lastUsedCounter);
        } catch {
          accepted = false;
        }
      } else {
        const recoveryHash = safeRecoveryHash(codeOrRecovery);
        const recovery = recoveryHash ? await tx.mfaRecoveryCode.findUnique({ where: { codeHash: recoveryHash }, select: { id: true, userId: true, factorId: true, usedAt: true } }) : null;
        if (recovery && recovery.userId === session.userId && (!recovery.factorId || recovery.factorId === factor.id) && !recovery.usedAt) {
          await tx.mfaRecoveryCode.update({ where: { id: recovery.id }, data: { usedAt: current } });
          accepted = true;
        }
      }
      if (!accepted) return false;
      await tx.session.update({ where: { id: session.sessionId }, data: { reauthenticatedAt: current, reauthExpiresAt: new Date(current.getTime() + reauthTtlSeconds * 1000) } });
      await tx.mfaFactor.update({ where: { id: factor.id }, data: { lastUsedAt: current, ...(counter === null ? {} : { lastUsedCounter: BigInt(counter) }) } });
      await audit(tx, { actorUserId: session.userId, action: "identity.reauthenticated", entityType: "session", entityId: session.sessionId, afterData: { reauthTtlSeconds } });
      return true;
    });
  }

  async function bootstrapAdmin(input: { email: string; password: string; displayName?: string }): Promise<{ userId: string; email: string } | null> {
    const email = normalizeEmail(input.email);
    const password = normalizeNewPassword(input.password);
    const displayName = normalizeOptional(input.displayName, MAX_DISPLAY_NAME);
    if (!email || !password || displayName === null) return null;
    const current = now();
    try {
      return await serializableTransaction(database, async (tx) => {
        await tx.$queryRaw`SELECT TRUE AS locked FROM pg_advisory_xact_lock(hashtextextended('bacshop:bootstrap-admin', 0))`;
        const existing = await tx.adminRoleAssignment.findFirst({ select: { id: true } });
        if (existing) return null;
        const user = await tx.user.create({ data: { email, displayName, status: "ACTIVE", emailVerifiedAt: current, authIdentities: { create: { type: "PASSWORD", provider: "password", passwordHash: await hashPassword(password) } } } });
        await tx.adminRoleAssignment.create({ data: { userId: user.id, role: "SUPER_ADMIN" } });
        await audit(tx, { actorUserId: user.id, action: "identity.admin_bootstrap", entityType: "user", entityId: user.id, afterData: { role: "SUPER_ADMIN", mfaEnrollmentRequired: true } });
        return { userId: user.id, email };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  return { register, authenticate, readSession, logout, requestPasswordReset, resetPassword, requestVerification, verifyEmail, changePassword, listSessions, revokeSession, updateProfile, beginMfaEnrollment, completeMfa, reauthenticate, bootstrapAdmin };
}

export type PrismaIdentityService = ReturnType<typeof typedPrismaIdentityService>;
