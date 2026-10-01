# Production migration architecture and runbook

**Decision date:** 2026-10-01  
**Target runtime:** Next.js App Router and the existing `src/application`, `src/domain`, `src/infrastructure`, and `src/ui` boundaries  
**Target persistence:** PostgreSQL with Prisma  
**Current live compatibility runtime:** legacy `server.js`/`app.js` on `127.0.0.1:4173`

This runbook describes a bounded migration. It is an execution contract for later phases, not a claim that the target has been implemented.

## Operating rules

1. Keep the legacy storefront available on port `4173` while a capability is being migrated.
2. Run the Next candidate in a separate process, port, environment, data directory, and test context. A candidate must not read or write the live `.bacshop-private` files directly.
3. Establish one authoritative owner per capability before enabling a cutover. Do not introduce permanent dual writes.
4. Move behavior through interfaces, not route-to-route copying. Route handlers call application use cases; use cases depend on domain contracts; infrastructure adapters own PostgreSQL, auth, Midtrans, media, notifications, and shared rate limiting.
5. Keep commercial snapshots immutable. A historical order must remain reconstructable without reading the current catalog price, name, terms, or fulfillment configuration.
6. Keep commercial contexts explicit: guest/customer/approved reseller in Retail Store always receive retail pricing; approved reseller in Reseller Center receives only authorized reseller pricing; pending/rejected/suspended resellers do not receive reseller pricing; admin is a separate operational context.
7. Keep private files and uploads recoverable until import, parity, cutover, and rollback evidence have been accepted.
8. Never report a capability as complete from a page render or build alone. The capability matrix row must pass all required columns.

## Side-by-side topology

```text
                    +------------------------------+
live traffic ------>| legacy runtime :4173         |
                    | app.js + server.js            |
                    | JSON/private files            |
                    +---------------+--------------+
                                    | read-only evidence,
                                    | validated export/import
                                    v
                    +------------------------------+
candidate traffic ->| Next runtime :4174 (example) |
                    | App Router + use cases       |
                    | PostgreSQL/Prisma             |
                    | provider adapters             |
                    +---------------+--------------+
                                    |
                                    v
                    +------------------------------+
                    | durable source of truth       |
                    | identity/catalog/orders/...   |
                    +------------------------------+
```

The candidate port is illustrative and must be selected by deployment configuration. `4173` remains the protected live compatibility port until the final cutover gate. Private files are copied to a restricted migration workspace for import; they are never used as a concurrent write store for the candidate.

## Canonical interfaces

The existing TypeScript seams are the starting point. Phase 1 must make the contracts production-capable and dependency-injected:

| Boundary | Current seam | Required production adapter |
|---|---|---|
| Identity/session | `AuthProvider`, `CustomerAuthAdapter`, `requireCustomer`, `requireAdmin` | PostgreSQL-backed users, credentials, sessions, verification/reset tokens, admin roles, MFA factors/recovery codes, revocation, and secure cookies. |
| Catalog/pricing | `CatalogRepository`, `get-retail-catalog`, `get-reseller-catalog`, `resolvePrice` | Prisma catalog, SKU, media, availability, effective prices, tier eligibility, and retail/reseller projections. |
| Cart/checkout | `SessionCartRepository`, `prepare-retail-checkout` | Durable/session-safe cart, transactional reconciliation, price/terms snapshots, inventory reservation, idempotency. |
| Orders/fulfillment | `RetailOrderRepository`, `ResellerOrderRepository` | Order, line snapshot, fulfillment event, entitlement, and customer-input records with state transitions. |
| Payments | `PaymentProvider`, `PaymentCallbackVerifier`, `handlePaymentCallback` | Midtrans Core API QRIS adapter, signature/amount/currency/reference validation, payment intents/events, reconciliation, expiry, and provider refund. |
| Wallet | `WalletLedgerRepository`, `requestWalletTopUp` | Immutable ledger with database constraints, transactional debit/credit, top-up reconciliation, references, and concurrency safety. |
| Support/notifications | `NotificationRepository`; current support surfaces | Persistent ticket/message/internal-note and notification records with delivery adapters and idempotency. |
| Audit | `AuditEventRepository`, legacy `saveAudit` | Append-only durable audit events with actor, action, target, reason, correlation, and safe metadata. |
| Media/CMS | Legacy storefront/upload handlers; Next promotion surfaces | Published CMS revisions, media metadata, object storage boundary, validation, and content permissions. |
| Operations | `AdminOperationsStore` | Prisma-backed admin queries and mutations with RBAC, mandatory MFA, reason/re-auth boundaries, and operational audit. |
| Rate limits/telemetry | Legacy in-memory maps and console logging | Shared production adapter, structured logger, metrics hooks, health/readiness, and safe error reporting. |

## State and snapshot rules

The database is the source of truth after a capability cutover. External providers remain authoritative for provider-owned financial outcomes. Notifications and analytics are projections and never decide payment, order, inventory, wallet, entitlement, or access state.

At order creation, persist at minimum:

- product and SKU identifiers plus display name;
- quantity and immutable unit price;
- discount/promotion and retail/reseller price context;
- currency and server-calculated total;
- fulfillment method, requirements, SLA, warranty, and relevant terms;
- inventory reservation reference and expiry where applicable;
- idempotency key and actor/context;
- payment intent/reference once created.

At each external or high-risk transition, persist an immutable event or audit record. Replays must resolve to the existing result. A callback, wallet debit, refund request, fulfillment transition, or admin mutation must not be made idempotent by a UI flag alone.

## Data migration sequence

The importer is optional for a fresh environment but required before retiring the local behavior when existing records are to be preserved.

### 1. Freeze and inventory

- Copy `data/products.json` and, when present, `.bacshop-private/users.json`, `orders.json`, `storefront.json`, and `audit.json` into a restricted migration workspace.
- Record file hashes, record counts, schema versions if present, and export time. Do not include raw files or secrets in logs or commits.
- Keep the live `4173` process and its private files untouched during this step.

### 2. Validate without mutating

- Parse JSON and validate each record against an explicit import schema.
- Reject malformed records into a redacted error report with record identity and reason only.
- Normalize IDs, timestamps, currency amounts, statuses, email casing, and legacy product references.
- Detect duplicate IDs, duplicate order references, missing products, impossible totals, invalid status transitions, and orphaned audit targets.
- Classify records as importable, repairable with an explicit rule, or quarantined for operator review.

### 3. Import in dependency order

1. Users/credentials metadata and admin role assignments. Never import plaintext passwords as credentials; legacy hashes require a reviewed hash migration or a forced reset path.
2. Brands, categories, products, SKUs, media metadata, availability, and effective prices.
3. CMS settings, banners, promotions, and media references.
4. Orders, immutable order-item snapshots, payment records/events, fulfillment events, inventory reservations where still meaningful, and entitlements.
5. Reseller profiles, applications, customers, wallet ledger entries, and top-up/reconciliation records where legacy data contains them.
6. Support, notification, and audit records.

Every insert has a deterministic natural key or migration key. Re-running an import must produce the same result and a summary of skipped existing records. No importer prints passwords, hashes, tokens, payment secrets, or full customer payloads.

### 4. Reconcile and seal

- Compare counts and redacted checksums by entity and status.
- Recalculate totals from imported snapshots and compare with stored totals; quarantine mismatches.
- Reconcile paid/refunded provider references before treating financial state as settled.
- Confirm that retail projections contain no reseller price table fields and that reseller projections require an approved reseller context.
- Preserve the original files and backup location in the migration record.

## Phased execution and gates

The production objective defines ten phases. The gates below make the order explicit.

| Phase | Scope | Required gate before expanding traffic |
|---|---|---|
| 0 | Baseline, duplicate-runtime map, capability matrix, decision | Baseline recorded; no source of truth ambiguity left undocumented; current lint/test/build failures separated from future regressions. |
| 1 | PostgreSQL/Prisma, migrations, adapters, config, health, logging | Fresh database migrates from zero; rollback-tested migration; secrets/config fail closed; health/readiness and repository integration checks pass. |
| 2 | Customer/admin identity, sessions, MFA, RBAC, CSRF, rate limits | Registration/login/logout/reset/verification and admin MFA/RBAC work against durable state; cookies, revocation, CSRF, rate limits, and denial tests pass. |
| 3 | Catalog/storefront/CMS and pricing isolation | Retail and reseller projections are separate; catalog import and admin changes persist; all guest/customer/approved-retail/pending/rejected/suspended price tests pass; visual parity is accepted. |
| 4 | Checkout, snapshots, inventory, Midtrans, callbacks, refunds | Server totals, reservations, payment events, provider callback verification, replay/idempotency, provider refund, and concurrency tests pass in an isolated integration environment. |
| 5 | Customer post-purchase, entitlements, notifications, support entry | Customer can inspect durable order/fulfillment/entitlement state, recover required input, receive idempotent notifications, and create an isolated support ticket. |
| 6 | Reseller application, Center, customers, orders, wallet | Approval changes access; tenant isolation and authorized prices hold; wallet ledger/top-up/purchase are transactional and idempotent; concurrency tests pass. |
| 7 | Admin operations | Operational dashboard, orders, catalog, pricing, customer/reseller, finance/refund, support, CMS, audit, and admin management are durable, permissioned, and audited. |
| 8 | Growth/content | Campaigns, marketing, Academy/Community, wishlist, recent activity, repurchase/renewal are real or explicitly unavailable; no fake production data. |
| 9 | Reliability/QA/observability | Integration/E2E, accessibility, responsive visual QA, CI, security review, metrics/logging, backup/restore, and dependency checks pass. |
| 10 | Legacy retirement/docs | Snapshot diff accepted, rollback rehearsal passes, all capability rows for the retired surface are complete, and legacy behavior is removed only after an approved cutover. |

## Traffic and cutover procedure

For each capability group:

1. Implement the Next path behind a capability flag or deployment route that can be disabled without editing data.
2. Run unit, repository integration, authorization, provider-mock, and relevant browser tests in a separate database/schema.
3. Export a redacted legacy snapshot and compare the Next projection for catalog, order, price, access, and status invariants.
4. Exercise the same role/context journeys against both surfaces where parity is required. Record expected legacy differences explicitly (for example, a corrected security behavior).
5. Enable canary traffic for the selected route or role, with metrics and a fast flag rollback.
6. Observe payment, order, support, reseller, auth, and error signals through at least one normal operational window and any required expiry/callback window.
7. Promote the Next route only when the gate is green. Transfer source-of-truth ownership in the migration record.
8. Keep legacy read compatibility as long as needed to recover in-flight records; disable its writes for the migrated capability.

## Rollback

Rollback is per capability, not a blind database reset.

- Disable the Next route flag and route traffic back to `4173` or the prior compatible handler.
- Stop candidate writes before switching ownership back. If a write was accepted by Next, reconcile it from the durable event log; do not replay the browser request blindly.
- For payments, trust the provider status and preserve the payment event. Never mark a provider-settled payment unpaid because a UI route rolled back.
- For wallet/order/inventory transitions, reconcile committed database events and reservations before reopening writes.
- Restore the previous database migration only when the migration itself is proven reversible and no later phase has written data that depends on it. Prefer forward repair and an explicit compatibility adapter.
- Keep private legacy files and the pre-import backup unchanged until the rollback window closes.
- Record the reason, correlation ID, affected capability, last accepted event, and resulting source-of-truth owner in the audit log.

## Explicit non-goals for Phase 0

Phase 0 does not claim that PostgreSQL, Prisma, production auth, MFA, provider refunds, concurrency protection, support, reseller operations, CI, E2E, or legacy retirement are implemented. Those are later gates and remain open in the capability matrix.
