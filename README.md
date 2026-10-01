# Bacshop

Bacshop is migrating to a Next.js App Router runtime with PostgreSQL and Prisma persistence. The migration is staged. The existing legacy storefront remains available on `127.0.0.1:4173`; the candidate Next runtime runs separately and is not the canonical traffic owner yet.

## Current runtime status

- Legacy `server.js`/`app.js` remains the live compatibility storefront on port `4173`.
- The candidate Next runtime uses the `app/` routes and `src/application`, `src/domain`, `src/infrastructure`, and `src/ui` boundaries. Use a separate port such as `4174` and a separate database.
- Phase 1 provides PostgreSQL/Prisma migrations, configuration validation, durable foundation repositories, liveness/readiness, and structured logging. It has not migrated every route or use case.
- Authentication, payment, checkout, purchase, and other application adapters are later phases. Do not interpret a rendered candidate page as full end-to-end production support.
- Production configuration fails closed. It never falls back to development authentication or seeded repositories.

The detailed evidence is in [`docs/production/phase-1-foundation.md`](docs/production/phase-1-foundation.md). The migration contract remains in [`docs/production/migration-runbook.md`](docs/production/migration-runbook.md), and current capability status is tracked in [`docs/production/capability-matrix.md`](docs/production/capability-matrix.md).

## Requirements

Use Node.js **24.11 LTS**. The supported engine range is `>=24.11.0 <25` and `.nvmrc` pins `24.11.0`.

Phase 1 database work requires PostgreSQL. Use a disposable database for integration checks and keep it separate from any live or shared database. The integration database name must end in `_integration`.

## Candidate setup

Copy `.env.example` to `.env` for local work, then replace the values needed for the selected runtime. Keep `.env` private and never commit or print secrets. For a database-backed candidate, the minimum boundary is:

```dotenv
NODE_ENV=development
BACSHOP_RUNTIME=database
APP_ORIGIN=http://localhost:4174
TRUSTED_ORIGINS=http://localhost:4174
DATABASE_URL=postgresql://<local-user>:<local-password>@127.0.0.1:5432/bacshop_integration?schema=public
```

`DIRECT_URL` is optional and is used when migrations need a direct connection while `DATABASE_URL` uses a pooler. Optional email, Midtrans, object storage, analytics, and Redis settings must stay disabled until their complete configuration is available. Replace example placeholders before deployment; unused optional entries should be removed from the deployment environment rather than treated as configured values.

Production requires `BACSHOP_RUNTIME=database`, a real PostgreSQL URL, a public HTTPS `APP_ORIGIN` and trusted origins, random session/MFA keys, object media storage, and a shared rate-limit provider. The configuration loader rejects local origins, placeholder credentials, invalid provider endpoints, and development repositories in production.

## Commands

From the repository root:

```powershell
npm ci
npm run db:generate
npm run db:validate
npm run db:migrate
npm run dev -- --port 4174
```

Run the legacy compatibility storefront separately only when working on the preserved legacy surface:

```powershell
node server.js
```

The candidate health endpoints are:

- `GET /api/health` — liveness response.
- `GET /api/ready` — database readiness response; it checks the `users` table and confirms the second Phase 1 migration is applied.

Without a database URL, readiness intentionally returns `503 {"status":"not_ready"}` while liveness remains `200`. With the isolated candidate database and applied migrations, readiness returns `200 {"status":"ready"}`. These local development observations do not mean a production service is configured.

For checks and the isolated integration suite:

```powershell
npm run db:generate
npm run db:validate
npm run test:integration
npm run lint
npm run typecheck
npm test
npm run build
```

Set `BACSHOP_INTEGRATION_DATABASE_URL` only for the disposable integration database whose name ends in `_integration`. Never point that variable at a live database. The recorded foundation result is 16 integration cases, 67 unit tests, lint with 0 errors and 5 legacy warnings, a passing typecheck, and a production build pass with 41 generated pages. `npm audit --omit=dev` reports 0 vulnerabilities; `prisma validate` and `prisma migrate status` are green against the candidate database.

## Database and recovery

Phase 1 contains two forward migrations: `20261001000000_init` creates the normalized commerce schema and core integrity guards; `20261001010000_integrity_guards` adds reseller tenant constraints, immutable order snapshots, stricter append-only protection, and wallet balance enforcement.

For a fresh environment, apply migrations with `npm run db:migrate`, verify `/api/ready`, and take a backup before importing data. Existing legacy files remain recoverable until import, parity, cutover, and rollback evidence are accepted. Recovery uses backups, durable event reconciliation, and forward repair. Do not reset a production database or use destructive rollback instructions. A backup/restore rehearsal remains a later reliability-phase gate and is not claimed complete here.

## Existing storefront features

The preserved legacy storefront includes catalog discovery, product detail, search, categories, filters, promotions, cart, checkout, FAQ, mobile navigation, customer account surfaces, and the existing admin/fulfillment screens. These behaviors remain migration evidence while the candidate runtime is completed. Payment and other commercial states must be treated as authoritative only after their candidate adapters, provider verification, durable records, idempotency, and acceptance tests are wired together.

Tokopedia HTML is a visual reference only. No Tokopedia production code, credentials, endpoints, analytics identifiers, or user/session data are used by Bacshop.

## Legacy compatibility runtime (historical behavior)

The following instructions describe the preserved `server.js`/`app.js` runtime on `127.0.0.1:4173`. They are retained for local compatibility and migration evidence; they do not define the target Next production architecture.

Run the legacy server with the supported Node 24.11 LTS runtime:

```powershell
node server.js
```

On first start, the legacy server prints a one-time admin setup code. Open `/#/admin`, enter the code, and create the initial admin email and password. The code expires when the process stops. Legacy account, session, order, storefront-content, and admin-audit records are stored in `.bacshop-private/`; products are read from `data/products.json`; uploaded images are stored under `assets/uploads/` after image validation. These file-backed records remain recoverable during migration and are not a concurrent store for the candidate runtime.

The legacy surface includes the existing home, catalog, product detail, search, category, filter, promotion, cart, checkout, FAQ, mobile navigation, customer account, payment, and separate admin/fulfillment screens. Its current payment flow creates dynamic QRIS transactions through the server-side Core API and updates status through signed callbacks or a server status check. It does not use a hosted checkout widget, static QR confirmation, or a client payment key.

### Legacy payment configuration

For local legacy payment testing, place credentials in a private `.env` file (or the host environment) and restart the legacy server. Never commit or share this file:

```dotenv
MIDTRANS_SERVER_KEY=<sandbox-server-key>
MIDTRANS_MERCHANT_ID=<merchant-id>
MIDTRANS_IS_PRODUCTION=false
```

For a real production provider account, use the production Server Key and set `MIDTRANS_IS_PRODUCTION=true` only after the candidate payment phase has completed its provider verification, durable event, idempotency, refund, and acceptance gates. Configure the signed HTTPS callback at `https://<domain>/api/payments/notify` for the legacy compatibility route; `127.0.0.1` is not internet reachable. The candidate payment adapter is a later phase and is not claimed complete by this foundation document.
