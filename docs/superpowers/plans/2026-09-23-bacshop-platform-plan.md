# Bacshop Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a production-quality Bacshop commerce platform from the documentation-only workspace.

**Architecture:** Next.js App Router + TypeScript presentation, a domain/application layer for access, pricing, cart, checkout, order, reseller, wallet, and audit rules, and infrastructure adapters for persistence and external providers. Server components and route handlers resolve authorization and authoritative totals; mobile and desktop use device-specific presentation variants over shared domain data.

**Tech Stack:** Next.js, React, TypeScript, CSS modules or colocated CSS, a typed test runner, and a database adapter with a production PostgreSQL contract plus deterministic development seed data. Provider integrations remain behind interfaces until credentials/configuration exist.

**Spec:** `docs/superpowers/specs/2026-09-23-bacshop-platform-design.md`

## Global Constraints

- `PRD.md` is authoritative for product behavior, security, permissions, pricing, payment/order/entitlement state, reseller rules, and launch scope.
- `BACSHOP_UI_UX_GUIDE.md` is authoritative for page composition, responsive behavior, and visual fidelity.
- `DESIGN_SYSTEM.md` is authoritative for tokens, geometry, states, and reusable component styling.
- Retail and reseller pricing must be isolated at the server/data boundary.
- Payment success must never imply fulfillment success.
- No reference-site production configuration, secrets, user data, or compiled runtime may be copied.
- New behavior is developed test-first; each behavior test must be observed failing before implementation.

## Review Focus

- Unauthorized retail requests never receive reseller price fields; test the serialized result, not just rendered text.
- An approved reseller stays retail-priced until an explicit Reseller Center context is resolved; test both contexts.
- Replayed payment callbacks do not duplicate order or fulfillment transitions; test idempotency.
- A changed SKU price is surfaced for reconciliation instead of silently charging the browser total; test stale checkout input.
- Mobile state/navigation never exposes account or reseller destinations to a Guest; test Guest, Customer, and Reseller Center mappings.

### Task 1: Runnable foundation and protected pricing domain

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `src/domain/access/types.ts`, `src/domain/catalog/types.ts`, `src/domain/pricing/price-resolver.ts`, `src/domain/pricing/price-resolver.test.ts`
- Create: `src/infrastructure/catalog/seed-catalog.ts`, `src/infrastructure/catalog/catalog-repository.ts`
- Create: `src/application/access/resolve-access-context.ts`, `src/application/catalog/get-retail-catalog.ts`, `src/application/reseller/get-reseller-catalog.ts`
- Modify: `.gitignore`

**Interfaces:**
- `resolveAccessContext(input): AccessContext` returns only the caller-authorized commercial context.
- `resolvePrice(sku, context): RetailPrice | ResellerPrice` rejects reseller context unless the context is an approved reseller explicitly inside `reseller-center`.
- `getRetailCatalog(query): RetailCatalogItem[]` never serializes reseller price fields.
- `getResellerCatalog(context, query): ResellerCatalogItem[]` requires an approved reseller context and returns authorized tier prices only.

- [ ] **Step 1: Scaffold the runnable Next.js TypeScript project and scripts.**
- [ ] **Step 2: Write failing access and price-isolation tests.**
- [ ] **Step 3: Run the focused tests and verify the expected failures.**
- [ ] **Step 4: Implement the minimal typed domain/application services and deterministic seed catalog.**
- [ ] **Step 5: Run focused tests, then lint, typecheck, and build.**
- [ ] **Step 6: Commit with `feat: establish Bacshop application foundation`.**

### Task 2: Public commerce shell and responsive primitives

**Files:**
- Create/modify: `app/`, `src/ui/foundations/`, `src/ui/commerce/`, `src/ui/shells/`, `src/ui/states/`, `src/infrastructure/catalog/`
- Test: `src/ui/**/*.test.tsx`, `tests/catalog-navigation.test.ts`

**Interfaces:** Consume Task 1 retail catalog view models; do not move access or price resolution into components.

- [ ] **Step 1: Add failing tests for state-correct navigation and retail-only product cards.**
- [ ] **Step 2: Implement semantic tokens, desktop header, mobile top bar, bottom navigation, search, category/promo cards, catalog, PDP, and state primitives.**
- [ ] **Step 3: Implement public routes and catalog recovery states.**
- [ ] **Step 4: Run tests, lint, typecheck, build, and matched-viewport browser checks.**
- [ ] **Step 5: Commit with `feat: implement Bacshop public commerce shell`.**

### Phase 0: Runnable foundation

- [ ] Scaffold the Next.js TypeScript application without overwriting the authoritative docs.
- [ ] Add scripts for development, lint, typecheck, unit tests, and production build.
- [ ] Establish `src/domain`, `src/application`, `src/infrastructure`, and `src/ui` boundaries.
- [ ] Add typed status/context models and deterministic seed catalog data.
- [ ] Add failing tests for access context and price isolation, then implement the minimum domain services.
- [ ] Verify the foundation with the full test, typecheck, lint, and build commands.

### Phase 1: Public commerce shell

- [ ] Add semantic Bacshop tokens and responsive global styles.
- [ ] Implement state-aware desktop header, mobile top bar, search field, bottom navigation, product cards, category cards, promo card, and async state primitives.
- [ ] Implement Home, Shop, Categories, Product Detail, Help/FAQ, and reseller-program informational pages with real seeded domain data.
- [ ] Add catalog search/filter/sort/load-more behavior and recovery-oriented empty states.
- [ ] Verify desktop geometry against the accessible storefront reference and mobile composition at representative widths.

### Phase 2: Authenticated retail flow

- [ ] Implement development auth/session adapter and route protection with explicit return-path handling.
- [ ] Implement session cart, cart reconciliation, checkout progress, and server-authoritative totals.
- [ ] Add payment-provider adapter contract, explicit payment status UI, and callback idempotency tests.
- [ ] Implement customer orders, order detail timeline, activation/fulfillment states, support entry, entitlements, renewal, and repurchase.

### Phase 3: Reseller Center

- [ ] Implement application lifecycle and server-side reseller access checks.
- [ ] Add explicit retail/reseller context switching and reseller-only catalog payloads.
- [ ] Implement reseller purchase, buy-for-customer, orders, customer expiry tracking, price list, balance top-up, immutable ledger, and audit events.

### Phase 4: Admin Center

- [ ] Implement admin shell and least-privilege roles.
- [ ] Add catalog/SKU/pricing, order/fulfillment, reseller, balance, promotion/CMS, support, notification, and audit operations with server-side authorization.
- [ ] Add sensitive-action reason/re-authentication boundaries where applicable.

### Phase 5: Hardening and acceptance

- [ ] Add accessibility, responsive, performance, and error/recovery regression coverage.
- [ ] Run full unit/integration/browser tests, lint, typecheck, and production build.
- [ ] Perform matched-viewport visual comparisons for desktop equivalents and mobile checkpoints.
- [ ] Review all diffs for secrets, copied runtime/configuration, protected data exposure, and unrelated changes.
- [ ] Commit accepted phases with conventional messages and push only when a valid remote is available.
