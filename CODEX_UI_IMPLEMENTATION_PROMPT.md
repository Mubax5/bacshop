# Codex Implementation Prompt - Bacshop UI Fidelity Rebuild

You are the ORCHESTRATOR for the Bacshop UI implementation. Do not act as a single monolithic coding agent.

Use GPT-5.6 Luna subagents for execution work. You own architecture, decomposition, review, conflict resolution, integration, testing, visual QA, and final acceptance. Delegate focused code-writing and inspection tasks to Luna agents, then review every result before merging it into the working tree.

## Goal

Rebuild Bacshop's UI so that:

- DESKTOP is visually as close as possible to the provided `store.buildwithreys.com/` reference folder.
- MOBILE is intentionally different from the reference folder and is polished to look like the provided mobile marketplace screenshot.
- The entire brand accent is converted to premium orange/orange-gradient styling.
- Bacshop product behavior, authorization, pricing isolation, reseller rules, order/payment state, and security remain governed by the PRD.
- No generic AI-template redesign is allowed.

This is a fidelity implementation, not a redesign exercise.

## Mandatory sources of truth

Read these before editing code:

1. `PRD.md`
   - Use it for product behavior, roles, authorization, security, pricing isolation, checkout, payment/order/entitlement states, reseller behavior, and admin requirements.
   - Do NOT use PRD visual-style wording as the final design source when it conflicts with the UI/UX guide.

2. `BACSHOP_UI_UX_GUIDE.md`
   - Use it as the final authority for UI composition, layout, responsive behavior, geometry, color, component styling, interaction states, and visual QA.

3. `store.buildwithreys.com/`
   - This is the strict DESKTOP visual reference.
   - Inspect the actual files instead of guessing.
   - Important files include:
     - `index.htm`
     - `shop.html`
     - `categories.html`
     - `products/*.html`
     - `cart.html`
     - `orders.html`
     - `account.html`
     - `_next/static/css/710253ed18be27b0.css`
     - `_next/static/css/76bc6c6349b680a8.css`
     - local image assets under `_next/` and `auth/`

4. Supplied mobile marketplace screenshot
   - This is the strict MOBILE composition reference.

5. Supplied orange desktop screenshot
   - This is a color/material reference only: orange gradient depth, warm highlights, white card contrast, selective black accents.
   - Do not copy its SaaS information architecture.

## Critical interpretation

### Desktop

Do not "take inspiration" from `store.buildwithreys.com/`. Port its visible design language faithfully.

Preserve, where the page has an equivalent reference:

- 1320px-ish content canvas and side gutters;
- approximately 92px sticky desktop header;
- logo/nav/search/tools alignment;
- large rounded pill search field;
- hero footprint, split proportions, and spacing;
- section vertical rhythm;
- product carousel geometry;
- four-column product grid at full desktop width;
- 17px-ish product card radius;
- 13px-ish media radius;
- 16:9 desktop product media treatment;
- category-card layout;
- 320px sticky filter sidebar and 34px-ish catalog gap;
- catalog toolbar proportions;
- page-heading bands;
- two-column product-detail geometry;
- subtle border-first depth model;
- compact footer behavior.

Do not replace these with a "cleaner" or "more modern" layout. The source IS the desired desktop design.

### Mobile

Do NOT copy the reference folder's mobile CSS/output.

At mobile widths, intentionally switch to a dedicated app-like composition based on the supplied mobile screenshot:

- compact top utility bar;
- circular 44-48px utility buttons;
- large rounded search pill;
- orange promo card/carousel;
- horizontal category shortcuts;
- two-column product grid;
- rounded image/media panels;
- concise metadata and strong price hierarchy;
- inset rounded floating bottom navigation;
- mobile PDP with large media panel, dots, title/price, variant chips, Bacshop trust block, and sticky price + CTA bar;
- bottom sheets for filters/selectors;
- safe-area support.

Bacshop is single-merchant. Do not copy seller/following UI from the mobile screenshot. Replace it with `Diproses oleh Bacshop`, activation method, SLA, warranty/support, or equivalent Bacshop trust information.

## Orange brand conversion

The source storefront is blue-heavy. Convert its brand accent semantically into orange.

Use design tokens rather than find-and-replace raw hex values everywhere.

Recommended system:

```css
--bac-bg: #f6f4f2;
--bac-surface: #ffffff;
--bac-surface-soft: #fbfaf9;
--bac-text: #191613;
--bac-text-strong: #0f0d0b;
--bac-text-muted: #746d67;
--bac-line: rgba(36, 28, 22, 0.10);

--bac-orange-100: #fff0e2;
--bac-orange-300: #ffb15c;
--bac-orange-500: #f77a24;
--bac-orange-600: #ef6126;
--bac-orange-700: #df4f2c;
--bac-orange-800: #c9432b;

--bac-gradient-primary:
  linear-gradient(135deg, #ff9a32 0%, #f77a24 30%, #ef6126 58%, #df4f2c 82%, #cf472d 100%);
```

Map source intent like this:

- source blue primary -> Bacshop orange primary;
- source blue-deep -> darker orange;
- source sky tint -> warm orange tint;
- source blue hover/focus border -> orange border/focus halo;
- semantic stock green remains green;
- warning stays warning;
- destructive stays red.

Orange should feel premium, not neon.

## Security and code hygiene

The reference folder is a visual source, not a backend source.

NEVER copy or wire:

- production API endpoints from the reference site;
- Clerk publishable/configuration values as Bacshop auth configuration;
- analytics/telemetry IDs;
- third-party production scripts that are not already part of Bacshop;
- user/session data;
- remote product data assumptions;
- compiled `_next/static/chunks` as the architecture of the new app.

Re-implement the visual structure in Bacshop's own stack and component system.

Keep sensitive validation and authorization server-side. Never rely on client-side hiding for reseller price or protected actions.

## Orchestration plan

Start by inspecting the repository and references, then create a concrete phase plan. Use parallel Luna agents where tasks do not conflict.

Suggested agents:

### Agent A - Desktop reference auditor

Inspect `store.buildwithreys.com/` and produce a compact implementation map:

- page structures;
- reusable components;
- exact desktop geometry;
- CSS tokens;
- breakpoints;
- card dimensions;
- header/hero/catalog/PDP patterns;
- assets worth reusing;
- anything that must NOT be copied.

No feature coding yet.

### Agent B - Bacshop codebase auditor

Inspect the current Bacshop repository:

- framework and routing;
- component structure;
- auth implementation;
- data fetching;
- existing design system;
- current responsive behavior;
- tests;
- gaps versus PRD/UI guide.

No speculative rewrites.

### Agent C - Design-token and shell implementation

After A and B are reviewed, implement:

- semantic orange tokens;
- desktop page-width/header/navigation/search shell matching reference;
- responsive shell switch;
- mobile top bar and bottom navigation foundation.

### Agent D - Public desktop commerce pages

Implement/port reference geometry for:

- Home;
- Shop/Catalog;
- Categories;
- Product Detail;
- public footer;
- shared product/category/search components.

### Agent E - Mobile commerce re-composition

Implement the mobile screenshot direction for:

- mobile Home;
- mobile Catalog;
- mobile Product Card;
- mobile Product Detail;
- bottom sheets;
- sticky purchase bar;
- mobile navigation/state variants.

### Agent F - Cart/Checkout/Auth/Orders visual integration

Preserve PRD behavior while bringing visual treatment into the same system.

### Agent G - Customer/Reseller/Admin visual consistency

Apply the same token and surface system while preserving role-specific application behavior and data isolation.

### Agent H - QA and accessibility

Audit:

- visual fidelity;
- responsive states;
- keyboard/focus;
- loading/empty/error/disabled/retry states;
- price isolation;
- auth-state separation;
- mobile safe area;
- overflow;
- performance regressions.

The orchestrator must review all agent outputs, reconcile conflicts, and request fixes before acceptance.

## Visual QA is mandatory

For every desktop page with a reference equivalent:

1. Run the Bacshop page and reference at identical viewport sizes.
2. Capture screenshots.
3. Compare geometry before color.
4. Fix visible differences in:
   - page width;
   - header height/alignment;
   - hero size;
   - section spacing;
   - grid/card dimensions;
   - typography scale;
   - filters/toolbars;
   - PDP proportions;
   - borders/radii/shadows.
5. Then confirm orange recolor is consistent.

Minimum desktop checkpoints:

- 1440px wide;
- one compact desktop/tablet width before mobile switch.

Minimum mobile checkpoints:

- approximately 390px wide;
- one smaller phone width.

Do not approve a phase based only on DOM/component similarity. Compare screenshots.

## Functional non-negotiables

Preserve PRD requirements, including:

- Guest, Customer, Reseller Pending, Approved Reseller, Suspended Reseller, and Admin separation;
- retail price outside Reseller Center;
- reseller price only in authorized Reseller Center;
- server-side authorization;
- cart intent preservation through login;
- explicit payment/order/fulfillment state separation;
- mobile state-aware bottom navigation;
- product activation/SLA/region/requirements/warranty/support transparency;
- loading, empty, error, disabled, retry, and action-required states.

A visual match is invalid if product truth or security regresses.

## Anti-slop constraints

Do not add:

- generic AI gradient blobs;
- floating decorative 3D cards;
- SaaS feature grids unrelated to shopping;
- giant marketing statements that push products below the fold;
- fake metrics;
- fake testimonials;
- random icon packs;
- random card styles;
- heavy glassmorphism;
- gradients on every card;
- needless motion;
- desktop layouts that are enlarged mobile layouts;
- mobile layouts that are stacked desktop pages.

When the reference already has a pattern, use it.

## Implementation strategy

Prefer incremental refactoring over replacing the whole codebase unless the current architecture objectively prevents the required result.

Build reusable primitives for:

- PageWidth/Container;
- DesktopHeader;
- MobileTopBar;
- SearchField/SearchPopover;
- ProductCard Desktop/Mobile variants;
- CategoryCard;
- PromoCard;
- FilterSidebar;
- FilterBottomSheet;
- CatalogToolbar;
- BottomNavigation;
- ProductMedia;
- StickyPurchaseBar;
- StatusBadge;
- Empty/Error/Skeleton states.

Use variants when desktop/mobile visuals differ substantially instead of forcing one DOM structure to satisfy both at the cost of fidelity.

## Git workflow

Before implementation:

1. Fetch the latest remote state.
2. Inspect current branch and working tree.
3. Do not destroy uncommitted user work.
4. Work from the latest intended base branch.

Commit completed phases using professional conventional-style messages, for example:

- `feat: port desktop storefront visual system`
- `feat: rebuild mobile commerce shell`
- `feat: align product detail responsive layouts`
- `fix: preserve reseller pricing isolation in storefront`
- `refactor: centralize bacshop design tokens`
- `test: add responsive commerce regression coverage`
- `docs: align ui implementation guide`

If the repository policy allows direct push to `main`, push only after the phase passes tests and visual QA. If branch protection requires a PR, follow repository policy instead of bypassing it.

## Definition of done

Do not report completion until all of these are true:

- Desktop pages with source equivalents are visibly close to the `store.buildwithreys.com/` reference at matched viewport sizes.
- The blue visual identity has been consistently mapped into the Bacshop orange system.
- Mobile looks like a dedicated marketplace app following the supplied mobile reference.
- Mobile is not the reference desktop layout stacked vertically.
- Product cards, catalog, and PDP have intentional desktop/mobile variants.
- Guest and authenticated states are visually correct.
- Retail and reseller prices remain isolated.
- Loading/empty/error/disabled/recovery states are implemented for launch-critical surfaces.
- Keyboard/focus and touch targets are acceptable.
- No unsafe reference-site integrations were copied.
- Tests pass.
- Build/lint/typecheck pass as applicable.
- Screenshot comparison has been performed and remaining visible deviations are either fixed or explicitly justified by Bacshop product behavior.

Start by auditing the current repository and the reference folder. Then present the phase plan and immediately execute it through delegated GPT-5.6 Luna agents. Keep the orchestrator focused on review, integration, and acceptance rather than doing all code-writing itself.
