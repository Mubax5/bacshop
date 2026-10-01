# Bacshop Architecture

## 0. Scope

This document defines Bacshop's target system boundaries, invariants, and implementation responsibilities.

It is intentionally framework-neutral. The current repository's framework, routing conventions, ORM, testing stack, and deployment model should be preserved unless there is a concrete technical reason to change them.

Do not rewrite a working application merely to make folder names resemble this document. Match the boundaries and invariants, not a cosmetic directory structure.

The PRD remains authoritative for product behavior. `BACSHOP_UI_UX_GUIDE.md` remains authoritative for UI/UX. `DESIGN_SYSTEM.md` turns that UI guidance into reusable implementation primitives.

---

## 1. Architecture Goals

Bacshop must support four distinct product surfaces on one coherent commerce domain:

- Public Storefront
- Customer Account
- Reseller Center
- Admin Center

The architecture should optimize for:

1. Server-authoritative authentication and authorization.
2. Strict retail/reseller pricing isolation.
3. Safe digital-commerce transaction state.
4. Explicit role/context boundaries.
5. Idempotent payment and fulfillment integration.
6. Immutable reseller wallet accounting.
7. Auditability of sensitive operational actions.
8. Reusable commerce domain logic across UI surfaces.
9. Device-specific UI composition without duplicating business rules.
10. Incremental maintainability rather than unnecessary platform rewrites.

---

## 2. Core Invariants

### 2.1 Single merchant

Bacshop is a single-merchant commerce platform.

The domain must not introduce multi-vendor concepts such as:

- third-party seller listings;
- seller storefront ownership;
- seller payout accounts;
- seller commissions;
- seller-side disputes;
- downline/recruitment economics.

### 2.2 Explicit commercial contexts

A user may have different authorized product contexts, but each context is explicit.

Conceptually:

```text
Unauthenticated
  -> Guest Retail

Authenticated Customer
  -> Retail Store
  -> Customer Account

Approved Reseller
  -> Retail Store       [retail price]
  -> Customer Account   [retail account]
  -> Reseller Center    [authorized reseller price]

Admin
  -> Admin Center       [separate operational shell]
```

Reseller approval does not transform the Retail Store into reseller mode.

### 2.3 Protected price data

Retail and reseller pricing must be separated at the authorization/data boundary, not merely at presentation.

The system should be designed so that a public retail request does not need to receive unauthorized reseller price fields at all.

### 2.4 State separation

Payment, order, fulfillment, and entitlement are separate concepts.

A paid transaction may still be processing. A fulfilled order may produce an active entitlement. UI and services must not collapse these stages into one generic `success` flag.

---

## 3. Logical Layers

Use these logical responsibilities even if the codebase names them differently.

### 3.1 Presentation layer

Owns:

- route/page composition;
- desktop/mobile shells;
- forms and interactive UI;
- display formatting;
- loading/empty/error/retry states;
- accessibility;
- navigation and role-aware presentation.

Must not own:

- authoritative pricing;
- permission decisions;
- payment transition rules;
- wallet arithmetic;
- final business validation.

### 3.2 Application/use-case layer

Coordinates domain actions such as:

- resolve current access context;
- search catalog;
- add/update cart item;
- create checkout;
- create payment intent;
- apply payment callback;
- transition order state;
- submit fulfillment data;
- repurchase/renew;
- apply/approve/suspend reseller;
- top up/debit/credit reseller balance;
- create support request;
- publish campaign/content.

This layer should be the main boundary called by route handlers, server actions, controllers, jobs, or equivalent application entry points.

### 3.3 Domain layer

Owns business concepts and invariants:

- identity and access state;
- catalog hierarchy;
- SKU fulfillment configuration;
- price eligibility and effective periods;
- cart/checkout rules;
- payment state;
- order state;
- entitlement lifecycle;
- reseller lifecycle;
- reseller price eligibility;
- wallet ledger rules;
- campaign eligibility;
- support state;
- audit event semantics.

Domain code should be reusable by multiple presentation surfaces.

### 3.4 Infrastructure layer

Owns external and persistence concerns:

- database access;
- authentication provider adapter;
- payment provider adapter;
- notification provider adapter;
- object/media storage;
- search implementation;
- queues/background jobs where present;
- analytics/telemetry;
- external fulfillment integration where present.

Provider-specific objects should not leak through the entire application.

---

## 4. Surface Boundaries

### 4.1 Public Storefront

Purpose:

- discovery;
- search;
- categories;
- retail product detail;
- public promotions;
- public help/FAQ;
- retail cart;
- authentication entry.

Allowed price context:

- retail only.

Must never expose:

- reseller price;
- reseller wallet;
- reseller tier benefit details that reveal protected commercial price data;
- customer-specific orders before authentication;
- admin functionality.

### 4.2 Customer Account

Purpose:

- retail order history;
- activation and entitlement management;
- support;
- profile/security;
- renewal/repurchase;
- reseller application status where relevant.

Price context remains retail unless the user explicitly enters Reseller Center.

### 4.3 Reseller Center

Purpose:

- reseller dashboard;
- authorized reseller catalog;
- `Harga Kamu`;
- buy-for-customer flow;
- reseller orders;
- purchase balance and ledger;
- reseller customer records;
- price list;
- campaigns/materials/academy/community when enabled.

Every Reseller Center request that depends on reseller privilege must resolve current reseller authorization server-side.

Suspended/pending/rejected states must not retain privileged pricing or purchasing capability.

### 4.4 Admin Center

Purpose:

- products/SKUs;
- retail and reseller pricing;
- orders and fulfillment;
- reseller lifecycle;
- reseller balance operations;
- promotions/CMS;
- support;
- admin users/RBAC;
- audit logs;
- system configuration.

Admin uses a separate application shell and stronger authorization controls.

---

## 5. Access Context Resolution

Create one authoritative server-side concept for current access context.

A resolved context should contain only data the caller is authorized to know, conceptually:

```text
AccessContext
- authenticated: boolean
- userId: optional
- retailCustomer: optional/boolean
- resellerStatus: none | pending | approved | rejected | suspended
- resellerTier: optional and only when authorized/required
- adminRoles: authorized role set where applicable
- activeSurface: retail | account | reseller | admin
```

Rules:

- Do not trust a client-provided `role`, `tier`, or `activeSurface` without re-resolution.
- Route protection and price selection use this server-resolved context.
- Switching into Reseller Center is an explicit navigation action, not an automatic account side effect.
- Public routes should not require fetching protected reseller details.

---

## 6. Domain Modules

Keep these domains conceptually separable.

### 6.1 Identity and access

Responsibilities:

- session identity;
- user profile;
- authentication state;
- authorization context;
- admin role membership;
- route protection.

### 6.2 Catalog

Hierarchy:

```text
Brand
  -> Product
      -> SKU / Variant
```

SKU owns purchase-relevant configuration such as:

- duration;
- plan;
- region;
- activation method;
- account/ownership model where allowed;
- device constraints;
- processing SLA;
- warranty/support policy;
- availability.

### 6.3 Pricing

Price belongs to SKU and may include:

- retail price;
- compare-at price;
- public promotional price;
- reseller price by tier;
- effective start/end time.

Pricing service responsibilities:

- resolve current effective retail price;
- resolve reseller price only for authorized Reseller Center context;
- return explainable price source/promotion metadata as needed;
- provide immutable purchase-time price snapshot inputs;
- reconcile price changes before payment.

Do not implement pricing by trusting values posted from the browser.

### 6.4 Cart and checkout

Cart is pre-transaction intent.

Checkout is a validated purchase attempt containing:

- selected SKU/variant;
- quantity where applicable;
- recipient/activation data;
- voucher/promotion state;
- authoritative totals;
- payment intent/reference;
- return/auth continuation context where relevant.

Guest cart may be session/local, but checkout completion requires authentication.

Login must preserve valid shopping intent and return the user to the interrupted retail checkout.

### 6.5 Payment

Canonical payment states:

```text
pending
paid
failed
expired
refunded
```

Payment integration requirements:

- verify provider signatures;
- make callbacks idempotent;
- persist provider references and timestamps;
- never create duplicate fulfillment from duplicate callbacks;
- keep payment state separate from order/fulfillment state;
- do not store raw card credentials.

### 6.6 Order and fulfillment

Canonical order states:

```text
created
processing
needs_customer_input
fulfilled
issue
cancelled
```

An order should preserve a commercial snapshot sufficient to explain what was purchased later, including SKU and price context.

Fulfillment rules:

- each SKU declares its activation/fulfillment method;
- required customer data is known before completion;
- incomplete/invalid data goes to `needs_customer_input` rather than false success;
- non-instant fulfillment exposes SLA/processing state;
- manual overrides are auditable.

### 6.7 Entitlement

Where relevant, canonical entitlement states are:

```text
pending_activation
active
expiring_soon
expired
revoked
not_applicable
```

Entitlement is the post-purchase lifecycle representation and should not be conflated with the order record itself.

### 6.8 Reseller program

Canonical lifecycle:

```text
not_applied
pending
approved
rejected
suspended
```

Approved reseller capability includes only what the current program configuration allows.

Tier thresholds, reseller price advantages, limits, and benefits should be configurable rather than scattered in frontend conditionals.

### 6.9 Reseller wallet and ledger

The reseller wallet is a purchase balance, not an earnings/payout wallet.

Architecture rules:

- balance changes derive from immutable ledger entries;
- debits/credits occur in protected transactions;
- admin adjustments require reason and audit event;
- refunds/approved credits may return to balance;
- avoid direct `balance = balance + x` mutations without ledger semantics;
- retry-safe operations must not double-credit or double-debit.

### 6.10 Reseller customers

Reseller customer records are scoped to the owning reseller.

The data model should support only operationally required information such as contact, purchased SKU, activation/expiry, status, and notes.

Authorization must guarantee:

- retail users cannot query reseller customers;
- one reseller cannot query another reseller's customer records.

### 6.11 Campaigns and content

Campaigns may carry:

- eligible reseller tier(s);
- eligible SKU(s);
- start/end time;
- target/progress rules;
- reward type/state.

Public CMS/promotion content should not become a source of authorization or protected price logic.

### 6.12 Support

Canonical support states:

```text
open
waiting_customer
waiting_ops
resolved
closed
```

Support should be order-scoped where possible so operators receive the relevant product and transaction context.

### 6.13 Notifications

Notifications communicate domain outcomes but must not be treated as the source of truth for those outcomes.

Examples:

- payment received;
- order processing;
- activation ready;
- input required;
- issue;
- expiry/renewal.

### 6.14 Audit

Create immutable audit events for sensitive operations such as:

- price changes;
- reseller approval/rejection/suspension;
- tier override;
- wallet adjustment;
- refund;
- fulfillment override;
- admin permission change;
- sensitive settings change.

Record actor, target, action, reason/context, and timestamp at minimum where available.

---

## 7. Data Relationship Model

Conceptual relationships:

```text
User
  -> Customer profile/state
  -> ResellerProfile (optional)
  -> Orders
  -> Entitlements
  -> SupportTickets

Brand
  -> Products
      -> SKUs
          -> Prices

Cart
  -> CartItems -> SKU

Checkout
  -> selected SKU(s)
  -> authoritative total
  -> Payment
  -> Order
      -> OrderItems
      -> Entitlement(s) where applicable
      -> SupportTickets

ResellerProfile
  -> Wallet
      -> LedgerEntries
  -> ResellerCustomers
  -> Reseller Orders
  -> Campaign participation where enabled

Admin actor
  -> AuditEvents for sensitive changes
```

Do not infer that every product creates an entitlement. Use `not_applicable` or no entitlement according to the current implementation model.

---

## 8. Pricing Architecture

Pricing deserves an explicit boundary because it is both commercial and security-sensitive.

### 8.1 Public retail price query

Input:

- SKU/product identity;
- current public promotion context.

Output:

- retail/current public price only;
- compare-at/public promo metadata when applicable.

Must not include reseller tier price tables.

### 8.2 Reseller price query

Input:

- authenticated user;
- active Reseller Center context;
- authoritative reseller status/tier;
- SKU;
- effective date/time.

Output:

- authorized `Harga Kamu`;
- optional retail reference price;
- optional suggested sell price when enabled.

### 8.3 Checkout price snapshot

At checkout/payment boundary:

1. Reload current authoritative SKU and price.
2. Validate availability and eligibility.
3. Recalculate promotion/voucher.
4. Compare against prior displayed total.
5. Require explicit reconciliation if changed.
6. Persist transaction/order price snapshot.

Never accept final price from the browser as authoritative.

---

## 9. Commerce Flow

### 9.1 Retail flow

```text
Discover
  -> Product
  -> Select SKU/variant
  -> Cart or Buy
  -> Authenticate if needed
  -> Restore intent
  -> Validate checkout data
  -> Resolve authoritative retail total
  -> Initiate payment
  -> Payment state update
  -> Order processing
  -> Fulfillment / needs customer input / issue
  -> Entitlement when applicable
  -> Support / Renew / Repurchase
```

### 9.2 Reseller flow

```text
Enter Reseller Center explicitly
  -> Resolve approved reseller context
  -> Browse reseller catalog
  -> Resolve authorized reseller price
  -> Select/create reseller customer context
  -> Validate purchase data
  -> Resolve balance/allowed payment method
  -> Atomic commercial transaction
  -> Order processing
  -> Fulfillment
  -> Customer expiry/follow-up context
```

Retail and reseller purchasing may reuse domain services, but price resolution and access context must remain explicit inputs.

---

## 10. UI Architecture

Business logic should not be duplicated just because desktop and mobile use different compositions.

Use three levels of UI reuse:

### 10.1 Foundations

- design tokens;
- typography;
- icon policy;
- focus styles;
- status language;
- primitives such as button, input, badge, skeleton.

### 10.2 Commerce components

- SearchField / SearchSuggestions
- ProductCard with desktop/mobile variants
- CategoryCard
- PromoCard
- PriceDisplay
- VariantSelector
- FulfillmentFacts
- FilterSidebar
- FilterBottomSheet
- CatalogToolbar
- ProductMedia
- StatusBadge
- Empty/Error/Retry states

### 10.3 Surface shells

- Desktop Public Store shell
- Mobile Retail shell
- Customer Account shell
- Reseller Center shell
- Admin shell

Device-specific shells may render different component trees while consuming the same validated domain data.

Do not place authorization or reseller price selection in a visual component.

---

## 11. Responsive Architecture

Desktop and mobile are separate compositions rather than one layout continuously shrinking.

### Large desktop

- full desktop header;
- approximately 1320px content canvas;
- four-column catalog grid;
- approximately 320px catalog filter sidebar;
- two-column PDP.

### Compact desktop/tablet

- preserve desktop visual DNA;
- reduce widths/columns only as needed;
- do not activate mobile app chrome prematurely.

### Mobile

- dedicated app shell;
- desktop header/sidebar hidden;
- top utility row and search;
- two-column product cards;
- bottom-sheet selectors/filters;
- inset bottom navigation;
- sticky PDP purchase bar.

The exact breakpoint follows the existing project breakpoint system. Avoid creating a second contradictory breakpoint scale merely for one page.

---

## 12. Search and Discovery Architecture

Search is a product capability, not only an input component.

The application boundary should support, where technically available:

- product matches;
- brand matches;
- category matches;
- forgiving keyword matching;
- relevant suggestions;
- recent search context according to auth/privacy state;
- recently viewed products;
- contextual filters;
- result counts;
- recoverable no-result state.

Guest recent context should remain local/session-scoped unless project policy explicitly associates it after authentication.

Never mix reseller price into retail search results.

---

## 13. External Integration Boundaries

Each provider should sit behind a small adapter/interface rather than spreading provider-specific logic across pages.

Recommended conceptual boundaries:

- `AuthProvider`
- `PaymentProvider`
- `NotificationProvider`
- `MediaStorage`
- `SearchProvider` if an external search engine is used
- `FulfillmentProvider` if external automation exists

Important:

- the reference storefront is not an integration provider;
- do not copy its endpoint URLs or auth settings;
- verify signatures on inbound provider callbacks;
- normalize provider events before domain state transitions.

---

## 14. Background and Retry Work

Where the stack supports jobs/queues, use them for retryable asynchronous work such as:

- fulfillment polling/processing;
- notifications;
- expiry reminders;
- selected analytics/event delivery;
- provider reconciliation.

Requirements:

- jobs must be idempotent or deduplicated where retries are possible;
- domain state remains the source of truth;
- a retry must not duplicate fulfillment, ledger entries, refunds, or notifications that are intended to be one-time.

If the current stack does not use a queue, preserve equivalent retry-safety at the application/service boundary.

---

## 15. Error Model

Application errors should be classifiable rather than emitted as arbitrary strings.

Useful categories include:

- validation error;
- unauthenticated;
- unauthorized;
- not found;
- conflict/stale state;
- price changed;
- unavailable SKU;
- insufficient reseller balance;
- provider failure;
- retryable infrastructure failure;
- permanent fulfillment issue.

Presentation should translate these into user-facing language and recovery actions without exposing internal stack traces or provider secrets.

---

## 16. Security Architecture

Minimum controls:

- secure session management;
- server-side authorization for protected actions;
- least-privilege admin RBAC;
- MFA for admin accounts;
- rate limiting on auth/payment/sensitive endpoints;
- webhook signature validation;
- secret isolation from client bundles;
- re-authentication for high-risk admin actions where appropriate;
- reseller-customer tenant isolation;
- protected reseller price boundary;
- audit trails for sensitive operations.

Do not rely on disabled buttons, hidden components, route-link omission, or client state as protection.

---

## 17. Reliability and Concurrency

Commercial mutations must be retry-safe and concurrency-aware.

Protect at minimum:

- payment state transitions;
- fulfillment transitions;
- wallet debits/credits;
- refunds;
- inventory/availability limits where present;
- promotion redemption where limits exist.

Use the existing stack's transaction/locking/unique-constraint mechanisms. Do not implement critical financial correctness solely with read-then-write client/API sequences that can race.

---

## 18. Caching and Data Fetching

Prefer server-side loading for:

- authenticated identity/context;
- protected role decisions;
- reseller pricing;
- wallet/financial data;
- order ownership;
- admin permissions.

Public catalog/content may use caching appropriate to the current stack, but invalidation must account for:

- price effective periods;
- promotion changes;
- availability changes;
- CMS publication changes.

Client fetching is appropriate for interactive experiences such as suggestions, filter updates, or optimistic feedback when the authoritative server result remains the final source of truth.

Never share a cache key that can accidentally mix protected reseller responses with public retail responses.

---

## 19. Observability and Auditability

Operational visibility should distinguish:

- authentication failures;
- unauthorized reseller-price attempts;
- payment callback verification failures;
- duplicate/retried payment events;
- order transition failures;
- fulfillment delays;
- `needs_customer_input` frequency;
- wallet adjustment events;
- reseller access changes;
- admin permission changes.

Do not log secrets, raw credentials, or unnecessary sensitive customer data.

---

## 20. Testing Architecture

### Unit tests

Prioritize deterministic domain rules:

- price resolution;
- reseller eligibility;
- state transitions;
- wallet ledger arithmetic/invariants;
- voucher/promo rules;
- authorization helpers.

### Integration tests

Cover boundaries such as:

- auth context -> route/use case;
- checkout -> payment intent;
- payment callback -> order transition;
- wallet transaction -> ledger/balance;
- reseller suspension -> access denial;
- changed price -> checkout reconciliation.

### End-to-end tests

Cover critical journeys from the PRD, including:

- Guest -> product -> login -> checkout;
- payment paid -> fulfillment processing;
- `needs_customer_input` recovery;
- completed order -> repurchase/renew;
- approved reseller retail view remains retail-priced;
- approved reseller enters Reseller Center and receives only authorized price;
- suspended reseller loses reseller purchasing access;
- duplicate payment callback is safe.

### Visual regression/QA

Use screenshot comparison for desktop reference fidelity and mobile app composition as defined in the UI guide.

---

## 21. Performance Architecture

Key principles:

- avoid shipping copied compiled reference runtime code;
- optimize and size media intentionally;
- lazy-load non-critical campaign imagery;
- reserve dimensions to reduce CLS;
- avoid blocking public storefront rendering on unnecessary authenticated data;
- resolve sensitive auth state efficiently for protected surfaces;
- preserve immediate interaction feedback while network work continues;
- keep mobile JS and decorative effects restrained.

---

## 22. Suggested Module Shape

This is illustrative only. Adapt it to the repository's existing conventions.

```text
app-or-routes/
  public-store/
  account/
  reseller/
  admin/

domain/
  access/
  catalog/
  pricing/
  cart/
  checkout/
  payment/
  orders/
  entitlements/
  reseller/
  wallet/
  campaigns/
  support/
  audit/

application/
  use-cases/
  services/

infrastructure/
  db/
  auth/
  payments/
  notifications/
  search/
  media/

ui/
  foundations/
  commerce/
  shells/
  states/
```

Do not move files solely to achieve this tree if the current repository already has equivalent boundaries.

---

## 23. Reference Storefront Boundary

`store.buildwithreys.com/` is allowed as a source for:

- desktop geometry;
- spacing;
- card structure;
- header proportions;
- catalog composition;
- PDP composition;
- visual assets only when legally/project-appropriately reusable;
- CSS values used to understand visible presentation.

It is not allowed as a source for:

- Bacshop backend architecture;
- API endpoints;
- secrets;
- production auth configuration;
- analytics identifiers;
- user data;
- compiled Next.js runtime as Bacshop application architecture.

Recreate visible behavior in Bacshop's own stack.

---

## 24. Architecture Change Rule

Change this document when a real architectural decision changes one of the boundaries above.

Do not silently introduce a second architecture through ad-hoc code.

A meaningful architecture change should document:

- the problem;
- the chosen boundary or pattern;
- security/pricing implications;
- migration impact;
- rollback/compatibility considerations;
- tests required to prove the change.

---

## 25. Phase 0 migration decision (2026-10-01)

### Decision

Next.js becomes the target canonical application runtime, using the existing `app/` route tree and the `src/application`, `src/domain`, `src/infrastructure`, and `src/ui` boundaries. PostgreSQL with Prisma is the target durable persistence layer unless a later evidence-based architecture record selects a stronger compatible option.

The current legacy runtime (`server.js`, `app.js`, `styles.css`, JSON/private files) remains live on `127.0.0.1:4173` during migration. It is a compatibility and evidence source while each capability reaches parity. It is not a second permanent business model. The legacy runtime must not be removed until the capability matrix and migration gates prove that the Next path owns the equivalent behavior.

The decision preserves the approved Bacshop storefront visual language. Migration must reach visual parity with the current orange marketplace composition, product cards, desktop density, and mobile app-like shell before discretionary UI changes are considered.

### Current evidence

The Phase 0 checkout at `76bfeb8d99fc96b4e3a44540b5a6ae583d9b8e85` contains two overlapping architectures:

- Legacy working behavior in `server.js`/`app.js`, with JSON catalog and private files for users, orders, storefront, audit, and admin data; process-memory sessions and rate-limit maps; and an implemented Midtrans QRIS boundary.
- Next routes and domain/application seams in `app/` and `src/`, with development-only authentication, seeded catalog, process-memory carts/orders/notifications/reseller/admin records/wallet ledger, and a development payment callback/provider.

The recorded baseline is: `npm ci` pass; lint 19 errors and 5 warnings; typecheck pass; Vitest 8 files/42 tests pass; legacy Node tests 10 pass and 3 fail out of 13 because of stale DANA assertions/configuration against the Midtrans runtime; Next 15.5.26 build pass with 41 static pages; `npm audit --omit=dev` reports zero vulnerabilities; Node `24.11.0`. These are baseline facts, not completion claims.

### Required boundaries

1. The candidate Next runtime runs in a separate process, environment, port, and database/schema while `4173` remains available.
2. Each capability has one source-of-truth owner at cutover. Permanent dual writes are prohibited.
3. Route handlers call application use cases. Use cases enforce authorization and domain invariants. Infrastructure adapters own PostgreSQL, auth, Midtrans, media, notifications, audit, and shared rate-limit integration.
4. Retail Store, Customer Account, Reseller Center, and Admin Center remain separate contexts. An approved reseller sees retail pricing in the Retail Store and authorized reseller pricing only inside the Reseller Center.
5. Commercial snapshots are immutable. Current catalog state cannot be used to reconstruct an historical order.
6. Existing private files are copied only through a validated, redacted, idempotent import process and remain recoverable until parity, cutover, and rollback evidence are accepted.

### Migration records

The detailed evidence and execution contract live in:

- `docs/production/phase-0-baseline.md` — repository identity, baseline checks, runtime inventory, and open gaps;
- `docs/production/capability-matrix.md` — UI route, server interface, auth/permission, persistence, source of truth, audit, tests, status, and remaining gap for each objective capability;
- `docs/production/migration-runbook.md` — interfaces, snapshots, separate runtime contexts, import order, phase gates, cutover, and rollback.

Any later architecture change must update these records or add a dated decision record. A successful build or a rendered route alone is insufficient evidence for changing a capability's status to complete.
