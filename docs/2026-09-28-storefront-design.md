# Bacshop Storefront Frontend — Phase 1 Design

## Intent

Create a fresh Bacshop frontend in a new directory inside the active Tokopedia workspace. The Tokopedia HTML pages supplied by the user and the local Tokopedia archive are the only implementation and visual references. Do not copy the existing Bacshop project, its code, its design files, or its implementation architecture. The Bacshop PRD remains the product-behavior brief supplied by the user.

This phase establishes the public shopping experience for a single merchant selling digital products. It uses sample frontend data and does not claim that authentication, payment, or digital fulfillment is connected to a backend.

## Frontend surfaces

1. **Public storefront:** responsive home, search/category browsing, product detail, retail cart, reseller-program information, promotions, help/FAQ, and guest sign-in entry points.
2. **Customer preview:** account, retail browsing, orders, activation, input-recovery, entitlements, renewal/repurchase entry points, support, and sample reseller application states.
3. **Reseller preview:** explicit entry from the sign-in preview chooser, retail-to-reseller context switch, example prices, buy-for-customer form, order history, expiry follow-up, and balance/ledger views.
4. **Admin preview:** distinct responsive shell, catalog, order, reseller, promotion, support and audit tables with sample data and in-view filtering.

Role surfaces are frontend-only previews. A user must explicitly choose a labeled preview context; returning to the public store restores the guest retail shell. Preview records and reseller prices are examples, not real commercial data or an authorization boundary.

## Phase 1 Scope and Rules

- The public home emphasizes search, categories, campaigns, and product discovery instead of generic SaaS marketing. Its hero is a manual and automatic carousel: only the first slide has copy and a CTA; other slides are empty image placeholders.
- Desktop follows the dense centered commerce composition visible in the Tokopedia source: broad header/search/navigation, compact campaign area, and multi-column product discovery.
- Mobile uses its own app-like composition: compact header, prominent reachable search, horizontal shortcuts, compact promotion, two-column products, and reachable bottom navigation.
- Product detail provides a mobile sticky purchase action above bottom navigation.
- Product examples represent the PRD's digital categories. Product terms and the sample retail price are visible; no reseller prices appear in public cards, product details, cart, or reseller-program marketing.
- Search, category filters, product navigation, cart quantity/removal, and clear empty states work in the browser using sample data. Cart persistence may use browser local storage.
- Checkout and authentication entry points are explanatory frontend states only. No real account, payment, pricing authorization, or fulfillment is implied.
- Use semantic HTML, keyboard-visible focus, accessible labels, responsive images/surfaces, reduced-motion support, and safe-area-aware mobile navigation.
- Keep future banner, category, and product image areas as plain placeholders. Use text-only Bacshop branding, Plus Jakarta Sans, and a restrained set of Feather icons; reduce decorative copy, template-like cards, and hover shadows.

## Implementation Shape

Create an isolated `bacshop-redesign/` app directory with plain HTML, CSS, and JavaScript so it runs without depending on the archived Tokopedia runtime. Recreate relevant commerce geometry and responsive behavior from the Tokopedia pages, while using Bacshop's white-dominant canvas and orange-to-warm-red brand accents described in the PRD. Any later implementation must use the same new app directory and remain independent of the archive's compiled scripts.

## Acceptance

- The app opens locally from the new directory and has no runtime dependency on Tokopedia production scripts or services.
- Public desktop and mobile layouts both provide the requested storefront structure without horizontal overflow.
- Search, category selection, product detail, and cart interactions function with sample data.
- Guest surfaces show retail prices only; no account-only identity or reseller prices leak into them.
- Customer, reseller, and admin screens have role-specific desktop shells and mobile navigation with clear context switches.
- Reseller sample prices appear only inside the selected reseller preview; customer and public storefronts retain retail prices.
- The app is a frontend preview only; no real identity, customer data, orders, balances, payment, or admin changes are persisted or submitted.
- Desktop and mobile previews use the same blank-image treatment, carousel behavior, and visual system.
