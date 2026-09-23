# Bacshop Platform Design

## Status

Approved execution brief derived from `PRD.md`, `ARCHITECTURE.md`, `BACSHOP_UI_UX_GUIDE.md`, `DESIGN_SYSTEM.md`, and `AGENT.md`.

## Goal

Build Bacshop as a single-merchant digital commerce platform with a retail storefront, customer account, explicitly switched reseller center, and separate admin center. The first implementation must establish real server-side boundaries and reusable UI foundations so later phases can add payment, fulfillment, reseller, and operations behavior without leaking protected data.

## Chosen approach

Because the workspace has no existing application or stack, use a TypeScript Next.js App Router application. Keep route composition in `app/`, business rules in `src/domain/` and `src/application/`, adapters in `src/infrastructure/`, and reusable presentation primitives in `src/ui/`. Use server components and route handlers by default; client components are limited to interaction state. Keep provider-specific authentication, payment, notification, search, media, and persistence code behind interfaces.

The first runnable slice uses a deterministic seeded catalog repository and a development session adapter so the storefront and authorization tests are executable without external credentials. The interfaces must be shaped for PostgreSQL and managed providers later; no client payload may contain reseller prices unless the request has already resolved an authorized Reseller Center context.

## Core boundaries

- Guest and retail customer reads return retail price fields only.
- Reseller price resolution requires an authenticated approved reseller and an explicit `reseller-center` context.
- Admin actions require a server-side role check and produce audit events.
- Payment, order, fulfillment, and entitlement states remain separate.
- Checkout never trusts a client total; it reloads SKU and price data on the server.
- Wallet changes are immutable ledger operations.
- Desktop and mobile use shared domain data but may use different component trees.

## Initial route contract

Public: `/`, `/shop`, `/categories`, `/categories/[slug]`, `/products/[slug]`, `/promos`, `/help`, `/faq`, `/cart`, `/checkout`, `/auth/sign-in`, `/auth/register`, `/reseller-program`.

Customer: `/account`, `/account/orders`, `/account/orders/[id]`, `/account/entitlements`, `/account/support`.

Reseller: `/reseller`, `/reseller/buy`, `/reseller/orders`, `/reseller/customers`, `/reseller/balance`, `/reseller/prices`.

Admin: `/admin`, `/admin/products`, `/admin/pricing`, `/admin/orders`, `/admin/resellers`, `/admin/balance`, `/admin/promotions`, `/admin/support`, `/admin/audit`.

## Visual contract

Use the semantic tokens and geometry in `DESIGN_SYSTEM.md`. Desktop follows the available storefront reference grammar: 1320px canvas, 92px header, dense product rails/grids, 320px filters, and two-column PDP. Mobile is a dedicated app composition with a compact top bar, dominant search, horizontal chips, orange campaign card, two-column product cards, state-aware inset bottom navigation, and sticky purchase action.

## External integration policy

No production credentials or reference-site runtime are copied. Payment, auth, notification, fulfillment, and persistence integrations remain adapter boundaries. Missing provider credentials are configuration blockers, not reasons to weaken server-side authorization or transaction semantics.

## Verification strategy

Start with domain tests for access context, retail/reseller price isolation, price reconciliation, and payment/order transition separation. Add route and component tests for state-correct navigation and protected surfaces, then add browser checks and matched-viewport visual QA after the app is runnable. Every phase must pass formatting/lint/typecheck/tests/build where those tools exist.
