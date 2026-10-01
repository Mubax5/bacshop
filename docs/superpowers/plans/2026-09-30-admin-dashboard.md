# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing admin area into a polished, responsive dashboard with a collapsible sidebar and a shared storefront/admin product-card renderer.

**Architecture:** Keep the current vanilla JavaScript application, protected API routes, CRUD forms, and persisted data. Extend `productCard(product, options)` for an admin presentation, replace horizontal tabs with an accessible dashboard shell and sidebar state, then tune existing admin page markup and CSS. Payment behavior is out of scope.

**Tech Stack:** Browser JavaScript, HTML template strings, CSS, existing Feather icon helper, existing Node API.

**Spec:** `docs/superpowers/specs/2026-09-30-admin-dashboard-design.md`

## Global Constraints

- Do not change payment API behavior, QRIS handling, environment variables, customer/reseller layouts, or product persistence.
- Preserve admin authentication, protected API routes, product data shape, uploads, CMS saving, and order fulfillment actions.
- Use the existing Feather icon helper and CSS tokens; add no dependency.
- Respect `prefers-reduced-motion` and prevent horizontal overflow on narrow screens.
- Do not add or run automated tests unless the user asks; verify presentation in the running preview and inspect existing handlers.
- The project directory has no `.git` repository, so do not include commit steps.

## Review Focus

- A compact sidebar must retain accessible names and a visible active route; manually inspect both widths and reload persistence.
- A mobile drawer must close by route selection, backdrop click, and Escape, and return focus to its trigger.
- Search, select-all, selection count, and bulk actions depend on existing `data-*` selectors; preserve those selectors in the shared product-card variant.
- Storefront product cards must keep cart and preorder behavior when the renderer gains an admin option; inspect storefront before and after.
- Reduced-motion users must not receive sidebar or page-entry movement; inspect the CSS media query and browser computed behavior.

---

### Task 1: Reuse the storefront product card for admin catalog

**Files:**
- Modify: `app.js` (`productCard`, `productEditor`, and the `/admin/produk` rendering in `renderAdminPage`)
- Modify: `styles.css` (admin-only modifiers for the shared `.product-card` structure)

**Interfaces:**
- Produces: `productCard(product, { variant: 'storefront' | 'admin' } = {}) -> string`; the default remains storefront behavior.
- Consumes: existing `productArt`, `CATEGORIES`, `rupiah`, `feather`, and current admin search/selection selectors.

- [x] **Step 1: Extend `productCard` with the admin presentation**

  Keep the common `.product-card`, product art, category, name, retail price, and product-info structure in one renderer. In admin mode, add the existing selection checkbox, archive/order/stock state, configured reseller price, stock summary, and Kelola link. Do not render `data-add-to-cart` in admin mode. Preserve the current storefront actions and preorder guard by leaving storefront mode as the default.

- [x] **Step 2: Replace `productEditor` output with the shared admin variant**

  Render admin catalog items with `productCard(product, { variant: 'admin' })`; keep `data-product-card`, `data-product-search`, `data-product-select`, and existing `data-admin-product-list` selectors so search and bulk-action handlers continue to find the same elements. Remove the duplicate card renderer and its base-only card markup.

- [x] **Step 3: Align admin modifiers with the shared card styles**

  Reuse storefront media, typography, image placeholder, price, and action classes. Keep only admin-specific status, selector, stock, archive, and management-action rules under admin modifier selectors. Check both cards render without width overflow at desktop and narrow mobile widths.

---

### Task 2: Build the collapsible admin dashboard shell

**Files:**
- Modify: `app.js` (`adminTabs`, `renderAdminPage`, and `bindAdminEvents`)
- Modify: `styles.css` (admin shell, sidebar, header, drawer, and overlay)

**Interfaces:**
- Consumes: authenticated `session`, current route `path`, existing admin page content, and existing logout handler.
- Produces: `adminNavigation(path) -> string` plus shell controls identified by `data-admin-sidebar-toggle`, `data-admin-menu`, and `data-admin-backdrop`.

- [x] **Step 1: Replace horizontal tabs with dashboard navigation**

  Render Ringkasan, Produk, Konten toko, and Pesanan as icon-and-label links. Show a clear active-route treatment, meaningful accessible labels in compact mode, and the existing Bacshop identity.

- [x] **Step 2: Add persistent desktop compact state**

  Read and write `bacshop.admin.sidebarCollapsed` in local storage using safe access. Toggle the shell class without reloading the current admin route, update `aria-expanded` and accessible text, and preserve the setting on route changes and reloads.

- [x] **Step 3: Add mobile drawer behavior**

  Use a menu trigger and backdrop for the narrow-screen drawer. Close it on navigation, backdrop click, or Escape; synchronize `aria-expanded`; return focus to the menu trigger after dismissal. Keep event bindings scoped to the current admin render so route rerenders do not accumulate handlers.

- [x] **Step 4: Add the dashboard workspace header**

  Replace the plain admin header with the current page title, a storefront shortcut, signed-in admin identity, and the existing logout button. Keep all page content inside the workspace main landmark.

---

### Task 3: Polish dashboard pages and responsive motion

**Files:**
- Modify: `app.js` (admin page headings and wrappers in `renderAdminPage`)
- Modify: `styles.css` (admin spacing, cards, forms, responsive breakpoints, transitions)

**Interfaces:**
- Consumes: current data-backed admin content for summary, products, CMS, and orders.
- Produces: shared spacing and surface rules for `.admin-section`, dashboard metrics, product toolbar, CMS sections, and order cards.

- [x] **Step 1: Set consistent workspace spacing and page hierarchy**

  Use one responsive content gutter and spacing rhythm for page titles, supporting copy, toolbars, cards, and forms. Widen the admin workspace while retaining readable maximum widths for product editing and forms.

- [x] **Step 2: Refine summary, CMS, and order surfaces**

  Give the existing summary metrics and pending orders clear hierarchy. Group CMS sections and order details with consistent card padding, border, radius, and control heights. Preserve actual data values and existing save/fulfillment behavior.

- [x] **Step 3: Add restrained motion and reduced-motion handling**

  Animate sidebar width, drawer entry/dismissal, navigation state, and subtle content appearance with short CSS transitions. Under `prefers-reduced-motion: reduce`, remove nonessential movement and shorten transitions.

- [x] **Step 4: Check narrow layouts** — authenticated preview reviewed at 320/360/390 px across summary, catalog, product editor, CMS, and orders. No horizontal page overflow; mobile identity and product media sizing corrected.

  Review the shell, card grid, toolbars, image upload controls, and order/CMS forms at 320, 360, and 390 CSS pixels. Wrap or stack controls where needed; keep focus targets usable and eliminate horizontal page overflow.

---

### Task 4: Review the running preview without changing live data

**Files:**
- Review only: `app.js`, `styles.css`, and the running preview at `http://127.0.0.1:4173/#/admin`

**Interfaces:**
- Consumes: Tasks 1–3 and the existing admin session/API.
- Produces: visual acceptance notes and any small CSS/markup adjustments to the owning task.

- [x] **Step 1: Inspect desktop shell and dashboard** — expanded/compact layouts reviewed in the authenticated preview. Compact state persists across reload and route changes; a 480 px-tall viewport keeps the sidebar account visible.

  Review expanded and compact sidebar, active navigation, page header, summary metrics, and pending-order spacing. Reload and change routes to confirm compact-state persistence.

- [x] **Step 2: Inspect catalog and product editor** — shared card layout and editor reviewed. Search, visible-item select-all, selection counts, and empty search feedback checked without submitting stored changes. Storefront Detail/cart actions and preorder guard preserved.

  Confirm storefront/admin cards share the base renderer and visual structure, admin cards have no cart action, search/selection markup remains wired, and product create/edit form layout is clear. Do not submit changes to stored products.

- [x] **Step 3: Inspect mobile shell and remaining admin pages** — reviewed at 320/360/390 px. Drawer navigation, backdrop dismissal, Escape, focus return, and Tab/Shift+Tab cycling checked. CMS and order layouts inspected without submitting changes.

  At 320, 360, and 390 px, open and dismiss the drawer through each supported action, then inspect Products, CMS, and Orders for clipping, cramped padding, or overlapping controls. Do not save CMS or fulfillment changes.

- [x] **Step 4: Inspect reduced-motion behavior and preserve storefront** — reduced-motion rules confirmed in the loaded stylesheet. The default storefront card renderer matches the baseline exactly; the live storefront has eight cards, Detail/cart actions, and its disabled preorder action. Preview console reports no errors.

  Check the reduced-motion rule and revisit a storefront catalog page to confirm its product-card actions and layout remain intact. Do not change payment settings or trigger a payment.

---
