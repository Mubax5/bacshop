# Phase 0: production migration baseline

**Date:** 2026-10-01  
**Repository:** `https://github.com/Mubax5/bacshop.git`  
**Checkout:** `main` at `76bfeb8d99fc96b4e3a44540b5a6ae583d9b8e85` (`Sync current preview storefront and polish admin`)

This is an evidence record, not a completion report. The productionization objective remains open. Phase 0 establishes what exists, which runtime owns each behavior today, and the conditions required before the legacy runtime can be retired.

## Evidence and constraints

The baseline was taken from a clean, fetched `origin/main` checkout and the repository files listed below. Foundation edits to `.gitignore`, `eslint.config.mjs`, `package-lock.json`, and `package.json` began only after all baseline commands completed; they are tracked separately from this evidence record.

The product and architecture authority order is:

1. The productionization request and current explicit owner intent, including preservation of the approved legacy storefront.
2. `PRD.md` for product behavior, security, pricing, commerce states, and permissions.
3. `ARCHITECTURE.md` for boundaries and invariants.
4. `BACSHOP_UI_UX_GUIDE.md` for interaction and responsive behavior within the approved visual design.
5. `DESIGN_SYSTEM.md` for tokens and component behavior.
6. Existing implementation evidence.

The approved storefront visual language is retained as a migration constraint: orange Bacshop identity, marketplace composition, product-card hierarchy, desktop density, mobile app-like behavior, and existing polished visual treatment. Migration work must first reach visual parity; discretionary redesign is out of scope.

## Baseline command results

These results are the recorded Phase 0 baseline. They are intentionally separated from later phase results so a regression can be identified.

| Check | Recorded result | Interpretation |
|---|---|---|
| `npm ci` | Pass | Dependencies installed from the lockfile. |
| `npm run lint` | 19 errors, 5 warnings | Existing errors include `no-require-imports` in `server.js` and JavaScript tests; warnings include unused values in the app. This is a baseline failure. |
| `npm run typecheck` | Pass | TypeScript checks pass for the current Next/TypeScript tree. |
| `npm test` | Pass: 8 files, 42 tests | Vitest/domain test suite passes. This does not prove production persistence or end-to-end behavior. |
| `node --test test/customer-auth.test.js test/ui-information-layout.test.js` | 10 pass, 3 fail of 13 | Existing legacy test run has three stale DANA assertions/configuration expectations while the runtime uses the Midtrans path. These failures are recorded, not treated as Phase 0 regressions. |
| `npm run build` | Pass: Next 15.5.26, 41 static pages | Build succeeds; static generation does not prove live auth, database, payment, or mutation behavior. |
| `npm audit --omit=dev` | 0 vulnerabilities | Production dependency audit is clean for the recorded lockfile state. |
| Node | `24.11.0` | Runtime observed for the baseline. Production engine metadata and deployment policy still need to be made explicit. |

No Phase 0 source or package change is implied by this table. The baseline commands are evidence for migration gates and must be rerun after each implementation phase.

## Runtime inventory

### Legacy runtime currently serving the working storefront behavior

- `server.js` starts the local HTTP server on `127.0.0.1:4173` by default.
- `app.js` and `styles.css` implement the established hash-routed storefront and admin UI.
- `data/products.json` is the catalog input when the legacy server runs with its default configuration.
- `.bacshop-private/users.json`, `orders.json`, `storefront.json`, `audit.json`, and `admin.json` are the file-backed operational records when that private directory exists.
- Sessions, login-attempt counters, and some process coordination are memory-only maps in `server.js`; restarting the process loses them.
- The legacy API includes customer registration/login/logout/profile, product/catalog reads and admin mutations, orders, Midtrans QRIS intent/status/notification handling, fulfillment, CMS/storefront updates, uploads, and audit writes.
- The legacy server has a server-side public product projection and checks the authenticated customer when resolving access. Its historical behavior must be tested against the stricter retail/reseller isolation invariant before it is accepted as the migration source.

### Next architecture currently present

- `app/**` provides the canonical-looking App Router route tree for retail, customer, reseller, admin, auth, checkout, and API surfaces.
- `src/application/**`, `src/domain/**`, `src/infrastructure/**`, and `src/ui/**` provide useful seams for access context, pricing, checkout, payment callbacks, reseller purchase, wallet ledger, notifications, admin permissions, and UI surfaces.
- `DevelopmentAuthAdapter` is explicitly development-only. In production, current Next auth routes return a configuration-unavailable response and the session reader returns no identity.
- Catalog, carts, orders, notifications, reseller applications/orders, admin operations, and the wallet ledger are process-memory or seed-backed development adapters. They are not a durable production source of truth.
- The Next payment provider and callback verifier are development adapters. The interfaces are suitable seams for a Midtrans adapter, but the production provider, signature verification, event persistence, reconciliation, and refund path are not complete in the Next runtime.
- Some Next routes render real-looking surfaces over demo records and in-memory state. Their existence and build success do not establish capability completion.

## Phase 0 architectural decision

Next.js becomes the target canonical runtime, with the existing `src/application`, `src/domain`, `src/infrastructure`, and `src/ui` boundaries retained and completed. PostgreSQL with Prisma is the target durable store unless a later evidence-based decision records a stronger compatible option.

The legacy runtime remains live on port `4173` during migration. It is a compatibility and evidence source only while feature parity is being proven. There will be no permanent dual write and no permanent dual business model. A cutover is allowed only after the gates in [`migration-runbook.md`](migration-runbook.md) pass for the affected capability set.

The migration must preserve private files and existing local data until an import has been validated and a recoverable backup exists. Import is optional, validated, idempotent where practical, and must never print credentials, hashes, tokens, payment secrets, or other sensitive payloads.

## Open baseline gaps

- There is no durable relational schema or migration history.
- Next production authentication is unavailable; development credentials and deterministic sessions remain in source.
- Next repositories are seeded or in-memory, and several screens explicitly use demo data.
- Legacy and Next contain overlapping catalog, order, auth, payment, reseller, admin, notification, and audit concepts.
- The two runtimes have different payment assumptions in existing tests and routes (legacy Midtrans QRIS versus Next development callback seams).
- Refund, inventory reservation/concurrency, support conversations, notifications, customer input recovery, reseller tenant isolation, and provider-authoritative financial transitions require end-to-end proof.
- Admin permissions exist as a useful development model but admin identity, MFA, recovery, persistent sessions, re-authentication, and production enforcement are not complete.
- Lint and the three legacy DANA assertions are existing quality-gate failures that require explicit resolution in the relevant phase.

## Phase 0 exit evidence

Phase 0 is documented when the following artifacts are reviewed together:

- this baseline;
- [`capability-matrix.md`](capability-matrix.md), which records every major objective capability and its current evidence;
- [`migration-runbook.md`](migration-runbook.md), which defines bounded interfaces, snapshots, contexts, gates, and rollback;
- the migration decision appended to `ARCHITECTURE.md`.

This exit evidence does not mark any production feature complete. It authorizes Phase 1 implementation against explicit acceptance gates.
