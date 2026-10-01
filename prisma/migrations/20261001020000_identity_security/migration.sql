-- Phase 2 identity and admin security hardening.
-- This migration is additive and assumes the Phase 1 identity tables exist.

CREATE TYPE "SessionKind" AS ENUM ('CUSTOMER', 'ADMIN');

ALTER TABLE "sessions"
  ADD COLUMN "kind" "SessionKind" NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN "mfaVerifiedAt" TIMESTAMPTZ(6),
  ADD COLUMN "reauthenticatedAt" TIMESTAMPTZ(6),
  ADD COLUMN "reauthExpiresAt" TIMESTAMPTZ(6),
  ADD COLUMN "revokedReason" VARCHAR(160);

ALTER TABLE "mfa_factors"
  ADD COLUMN "lastUsedCounter" BIGINT;

-- PostgreSQL unique constraints treat NULL as distinct. These partial indexes
-- express the business rules for active grants/factors and password identities.
CREATE UNIQUE INDEX "admin_role_assignments_active_user_role_key"
  ON "admin_role_assignments" ("userId", "role")
  WHERE "revokedAt" IS NULL;

CREATE UNIQUE INDEX "mfa_factors_active_totp_user_key"
  ON "mfa_factors" ("userId")
  WHERE "type" = 'TOTP' AND "disabledAt" IS NULL;

CREATE UNIQUE INDEX "auth_identities_one_password_per_user_key"
  ON "auth_identities" ("userId")
  WHERE "type" = 'PASSWORD';

ALTER TABLE "admin_role_assignments"
  ADD CONSTRAINT "admin_role_assignments_grantedById_fkey"
  FOREIGN KEY ("grantedById") REFERENCES "users" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "sessions_kind_revoked_expires_idx"
  ON "sessions" ("kind", "revokedAt", "expiresAt");

