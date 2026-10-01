# Phase 1: production foundation

**Date:** 2026-10-01
**Scope:** PostgreSQL/Prisma persistence foundation, configuration boundaries, repository adapters, readiness, and structured logging
**Runtime status:** candidate foundation verified; canonical cutover has not occurred

This is an evidence record for Phase 1. It documents the durable foundation that is available to the candidate Next runtime. It does not claim that the Next runtime owns every application route, that production authentication or payments are complete, or that the legacy runtime can be retired.

## What is implemented

- PostgreSQL persistence through Prisma `7.10.0` and `@prisma/adapter-pg`.
- Two forward migrations:
  - `20261001000000_init` creates the normalized commerce schema, enums, relationships, monetary and inventory checks, effective-price exclusion constraint, and append-only protections.
  - `20261001010000_integrity_guards` adds reseller tenant composite foreign keys, context and price-kind checks, truncate protections, immutable commercial order snapshots, and the wallet non-negative balance guard.
- Server-only database client creation with connection and pool limits. Database access fails closed when a database runtime has no valid PostgreSQL URL.
- Database repository adapters for catalog, retail session cart, audit events, notifications, and wallet ledger operations. Serializable transaction retries are limited to recognized PostgreSQL/Prisma serialization conflicts.
- Runtime configuration validation for database mode, public origins, production secrets, media storage, Midtrans endpoint selection, analytics, and shared rate limiting. Production cannot select development repositories or a seeded fallback.
- `npm start` runs a Node-native production configuration preflight before binding a port. Next environment file precedence is respected; failed validation logs variable names only and exits with status 1. Two subprocess tests verify refusal and successful validation without contacting dependencies.
- `/api/health` liveness response and `/api/ready` readiness response. Readiness queries the `users` table and confirms that the second Phase 1 migration is applied. Dependency details and secrets are not returned.
- Structured JSON logging with severity, service, request and operation fields, durations and safe entity references where supplied. Sensitive values are redacted before output.

## Verified evidence

The implementation was exercised against a disposable PostgreSQL **18.4** database on loopback. The integration database is isolated and its name ends in `_integration`; integration setup refuses another database name. The recorded Phase 1 checks are:

| Check | Result | Scope |
|---|---|---|
| PostgreSQL migration from an empty database | Pass | Both migrations applied with `prisma migrate deploy`. |
| Foundation integration suite | Pass: 16 cases | Independent clients, email uniqueness, effective-price and tier guards, inventory checks, durable carts, serializable cart increments, wallet idempotency/concurrency, append-only records, reseller tenant constraints, order snapshots, retail/reseller projections, notification deduplication, and audit redaction. |
| Unit tests | Pass: 67 tests | Configuration, repository composition, transactions, logging, readiness, and existing domain coverage recorded for this checkout. |
| Lint | 0 errors, 5 legacy warnings | No new lint errors recorded; the five warnings are legacy warnings. |
| Typecheck | Pass | TypeScript checks passed. |
| Production build | Pass: 41 pages | Final build completed successfully after the foundation changes. |
| Prisma validation and migration status | Pass | `prisma validate` and `prisma migrate status` are green against the candidate database. |
| Dependency audit | Pass: 0 vulnerabilities | `npm audit --omit=dev` reports no vulnerabilities for the recorded lockfile. |

These results prove the foundation against the isolated candidate database. They do not prove complete application end-to-end behavior or a successful production deployment.

The candidate Next development process was also observed on port `4175`: `/api/health` returned HTTP 200 with `{"status":"ok","service":"bacshop"}` and `cache-control: no-store`; `/api/ready` returned HTTP 503 with `{"status":"not_ready"}` when no database URL was configured, and HTTP 200 with `{"status":"ready"}` when the isolated disposable database was loaded. This is fail-closed readiness behavior, not evidence that a production service is configured.

## Safe local setup

Use Node.js **24.11 LTS**. The repository engine boundary is `>=24.11.0 <25` and `.nvmrc` pins `24.11.0`.

Create a local environment from the example file, then replace only the values needed for the mode being run. Never commit `.env`, paste secrets into logs, or use production credentials for the integration database.

For a database-backed candidate, set at minimum:

```dotenv
NODE_ENV=development
BACSHOP_RUNTIME=database
APP_ORIGIN=http://localhost:4174
TRUSTED_ORIGINS=http://localhost:4174
DATABASE_URL=postgresql://<local-user>:<local-password>@127.0.0.1:5432/bacshop_integration?schema=public
```

`DIRECT_URL` is only needed when migrations must use a direct connection while `DATABASE_URL` points at a pooler. Optional integrations remain disabled until their complete configuration is available. Do not leave example host, password, key, bucket, or endpoint values enabled in a deployed environment. Production configuration is validated fail closed: it requires `BACSHOP_RUNTIME=database`, a real PostgreSQL URL, a public HTTPS origin, random session/MFA keys, object media storage, and a shared rate-limit provider.

The checked-in `.env.example` contains safe placeholders for optional boundaries so it can describe the supported configuration surface. Replace or remove unused optional entries in the deployment environment; do not treat placeholders as credentials or as a signal that an integration is configured.

## Foundation commands

Run from the repository root:

```powershell
npm ci
npm run db:generate
npm run db:validate
npm run db:migrate
npm run test:integration
npm run lint
npm run typecheck
npm test
```

`npm run db:migrate` runs `prisma migrate deploy` and requires `DIRECT_URL` or `DATABASE_URL` to point at the intended database. `npm run test:integration` requires `BACSHOP_INTEGRATION_DATABASE_URL` to point at a disposable PostgreSQL database whose name ends in `_integration`; the suite creates uniquely named fixtures inside that database and leaves them there, including immutable audit and ledger records, until the disposable database is discarded. Keep it separate from any live or shared database.

The production build command is:

```powershell
npm run build
```

The recorded final result is a pass with 41 generated pages.

## Runtime topology and boundaries

The legacy server remains unchanged on `127.0.0.1:4173` and continues to serve the approved current storefront during migration. Run the candidate Next runtime in a separate process, on a separate port such as `4174`, with a separate environment and database. The candidate must never read or write the legacy `.bacshop-private` files as a concurrent store.

Phase 1 supplies persistence and infrastructure adapters; it does not wire every application route to those adapters. Authentication, payment, checkout, purchase, and other route migrations remain later phase work. There is no full end-to-end claim, and there is no production fake-auth fallback: invalid production configuration fails closed.

## Migration, backup, and recovery policy

Initial deployment is forward-only: apply the two migrations to a fresh PostgreSQL database, verify readiness, and take a backup before importing or introducing application data. Keep migration history and backups with the deployment record. For an existing legacy dataset, first create a restricted backup of the source files and a separate database backup, validate a redacted import plan, and preserve the originals until parity and rollback evidence are accepted.

Recovery uses forward repair and reconciliation. Stop candidate writes, identify the last accepted durable event, restore the latest known-good backup into a recovery database when needed, and reconcile committed payment, order, inventory, wallet, audit, and notification events before reopening writes. Do not reset a production database or issue destructive rollback instructions. A migration is reverted only when its compatibility and reversibility have been proven; otherwise apply a forward compatibility migration.

An operational backup/restore rehearsal has not yet been performed; it is a later reliability-phase gate. Phase 1 documents the recovery boundary and preserves the migration path without claiming that production backup automation or restore readiness exists.

## Remaining Phase 1 gaps

- The candidate is not the canonical traffic owner; legacy `4173` remains live.
- All application routes and use cases are not yet wired to the durable repositories. Auth, payment, and purchase adapters are later phases.
- Import tooling, production identity/session security, provider integrations, backups automation, and full end-to-end journeys remain open acceptance work.
- Candidate traffic has not been promoted; the legacy `4173` runtime remains the compatibility owner.
