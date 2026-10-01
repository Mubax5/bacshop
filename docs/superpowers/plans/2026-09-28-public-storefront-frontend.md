# Bacshop Public Storefront Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, frontend-only Bacshop preview from scratch for public shopping plus customer, reseller, and admin surfaces.

**Architecture:** Use one isolated static app with semantic HTML, CSS, and browser JavaScript. Keep the product catalog and cart state in a small data/controller module, render navigable page states from the URL hash, and persist only the guest cart locally. No backend or Tokopedia runtime is loaded.

**Tech Stack:** HTML5, CSS, vanilla JavaScript; no framework or added dependencies.

**Spec:** `docs/2026-09-28-storefront-design.md`

## Global Constraints

- Work only in the new `bacshop-redesign/` directory under the Tokopedia workspace.
- Use Tokopedia HTML as the only source implementation/visual reference; do not use the existing Bacshop project or copy its code/design/architecture.
- Use sample data and do not imply that account, payment, or fulfillment connects to a backend.
- Public cards, product details, and cart use retail prices only; never display reseller prices in public context.
- Keep the desktop commerce shell dense and centered; compose a dedicated app-like mobile shell with two-column products and reachable bottom navigation.
- Use semantic controls, visible keyboard focus, accessible labels, reduced-motion handling, and mobile safe-area spacing.

## Review Focus

- Guest view must not expose account identity, customer order widgets, or reseller pricing.
- Empty cart, no search results, and unknown product routes need a recovery path.
- Browser-local cart data may be malformed or refer to a removed product; recover without breaking the page.
- Mobile bottom navigation and cart action must leave content reachable at small phone sizes.
- Product detail terms must remain visible before adding a digital item to the cart.

---

### Task 1: Create the isolated app shell and visual system

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `README.md`

**Interfaces:**
- Produces: semantic page root `#app`, a reusable header/search region, a main route outlet, and desktop/mobile navigation landmarks.

- [x] Create the Indonesian-language document shell with local CSS/JS references, Bacshop title, viewport metadata, skip link, and semantic header/main/footer roots.
- [x] Add desktop commerce header, compact mobile header, prominent search control, category shortcut region, and state-aware guest bottom navigation.
- [x] Define white/warm-white, orange-to-warm-red, neutral text, border, radius, spacing, focus, and reduced-motion tokens; add responsive desktop/tablet/mobile layout rules.
- [x] Document how to open the static app locally and clarify that all data and checkout states are frontend examples.

### Task 2: Add catalog data and discovery routes

**Files:**
- Create: `app.js`
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Produces: `PRODUCTS` records with `id`, `slug`, `name`, `category`, `price`, `duration`, `fulfillment`, `description`, and `terms`; `renderRoute()` for `#/`, `#/kategori/:slug`, `#/produk/:slug`, and public information routes.

- [x] Add sample digital-product records with explicit retail price and purchase-critical terms.
- [x] Render home campaign, category shortcuts, popular products, contextual category results, and product cards with accessible product links.
- [x] Implement URL-hash navigation and unknown-route recovery without reloading the page.
- [x] Wire search input to accessible product/category suggestions and matching results; category routes include contextual filters, sorting, and no-results recovery.
- [x] Add product detail with duration, region/account requirements, activation method, processing time, warranty/support terms, and a mobile sticky add-to-cart action.

### Task 3: Implement guest cart and public entry points

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Produces: `readCart()`, `writeCart(items)`, and `renderCart()`; hash routes `#/keranjang`, `#/checkout`, `#/masuk`, `#/daftar`, `#/promo`, `#/program-reseller`, `#/bantuan`, and `#/faq`.

- [x] Persist only product ids and quantities to local storage; validate restored records against the current product catalog.
- [x] Render cart line items using retail prices, quantity controls, removal, subtotal, empty state, and a checkout entry point.
- [x] Make checkout, sign-in, and registration routes show honest frontend-only explanations rather than claiming a completed transaction or authentication.
- [x] Add promo, reseller-program, help, and FAQ pages with public-safe copy and no reseller price exposure.
- [x] Keep search, cart count, header navigation, and mobile bottom-navigation actions consistent across routes.

### Task 4: Review desktop and mobile behavior

**Files:**
- Modify: `styles.css`
- Modify: `app.js`

**Interfaces:**
- Consumes: all public routes and interactions from Tasks 1–3.

- [x] Open the app locally at 1440px and verify centered commerce geometry, multi-column cards, search, and complete guest header.
- [x] Open at 390px and a smaller phone width; verify app-like composition, two-column cards, safe-area navigation, and no unintended horizontal overflow.
- [x] Manually walk home → search/category → product → add/remove cart → empty cart; also verify unknown product and empty search. Review `readCart()`'s malformed-storage recovery branch in code.
- [x] Inspect page copy and rendered prices to confirm guest context contains retail prices only and checkout remains clearly frontend-only.

### Task 5: Build the customer account preview

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: explicit `previewContext` selection and customer routes `#/preview/customer`, `#/preview/customer/orders`, `#/preview/customer/entitlements`, and `#/preview/customer/support`.

- [x] Add a clearly labeled customer preview entry; keep guest shell free of customer identity, orders, and subscriptions.
- [x] Add a contained customer shell and app-like mobile navigation, with an explicit link back to the retail store.
- [x] Render sample order list/detail, entitlement/expiry, support, retail browsing, reseller-application status, and needs-customer-input recovery surfaces with visible example-data notices.

### Task 6: Build the reseller center preview

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: reseller routes `#/preview/reseller`, `#/preview/reseller/buy`, `#/preview/reseller/orders`, `#/preview/reseller/customers`, and `#/preview/reseller/balance`.

- [x] Enter reseller preview only through an explicit preview choice and show a persistent Reseller Center context label.
- [x] Add separate reseller business navigation and an explicit `Kembali ke Toko` context switch.
- [x] Render sample reseller catalog prices, purchase-for-customer form states, order/customer/expiry lists, and balance/ledger views only inside the visibly labeled reseller preview.
- [x] Avoid implying real authentication, wallet, payment, fulfillment, or reseller approval; show example states and honest unavailable actions.

### Task 7: Build the admin center preview

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: admin routes `#/preview/admin`, `#/preview/admin/catalog`, `#/preview/admin/orders`, `#/preview/admin/resellers`, `#/preview/admin/promotions`, `#/preview/admin/support`, and `#/preview/admin/audit`.

- [x] Enter admin preview only through an explicit preview choice; use a distinct admin shell with no retail/reseller navigation.
- [x] Render operational tables/queues using clearly labeled example data and meaningful empty/recovery states.
- [x] Provide frontend-only filter/search and informational states for sensitive changes; do not claim to persist operational mutations.
- [x] Manually verify context switching between public, customer, reseller, and admin views, including that public surfaces never display reseller prices.

### Task 8: Apply the requested visual direction to every preview

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `README.md`

- [x] Replace decorative campaign, category, and product artwork with plain empty image placeholders across public and role preview routes.
- [x] Add a responsive, swipeable, keyboard-operable carousel with automatic progression and image-only secondary slides.
- [x] Use text-only Bacshop branding, local Plus Jakarta Sans, and a small local Feather icon sprite; preserve local font/icon licenses.
- [x] Simplify public reseller and FAQ presentation, remove microcopy/decorative icon tiles where unnecessary, and reduce hover shadows.
- [x] Review the public home at desktop and mobile sizes, manually inspect carousel primary/secondary states, and inspect reseller buy and public information pages. Confirm there is no horizontal overflow at the reviewed mobile width.
