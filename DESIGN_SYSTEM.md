# Bacshop Design System

## 0. Status and Purpose

This document is the implementation-level design system for Bacshop.

It translates `BACSHOP_UI_UX_GUIDE.md` into reusable tokens, component rules, states, and responsive contracts.

Authority order for implementation:

1. `PRD.md` for product behavior, permissions, state, and commercial rules.
2. `BACSHOP_UI_UX_GUIDE.md` for visual composition and reference fidelity.
3. This file for reusable design tokens and component implementation details.
4. `store.buildwithreys.com/` for desktop visual inspection when an equivalent page/component exists.

If a visual token in older product documentation conflicts with the current UI guide, the current UI guide wins. In particular, the active Bacshop brand system is white/warm-white + orange + charcoal/warm neutral; blue is not a primary Bacshop brand accent in this implementation.

---

## 1. Design Principles

Bacshop should feel:

- commerce-first;
- premium but restrained;
- app-like on mobile;
- reference-faithful on desktop;
- dense enough to browse efficiently;
- obvious about price, variant, activation, SLA, requirements, warranty, and support;
- consistent across Guest, Customer, Reseller, and Admin while keeping those contexts separate.

The design system must not create visual novelty at the expense of shopping clarity.

---

## 2. Design Token Contract

Use semantic tokens. Do not scatter raw colors/radii/shadows through feature components when a system token exists.

### 2.1 Color tokens

```css
:root {
  /* Canvas and surfaces */
  --bac-bg: #f6f4f2;
  --bac-surface: #ffffff;
  --bac-surface-soft: #fbfaf9;
  --bac-surface-recessed: #f1efec;

  /* Text */
  --bac-text: #191613;
  --bac-text-strong: #0f0d0b;
  --bac-text-muted: #746d67;
  --bac-text-subtle: #9d9690;

  /* Borders */
  --bac-line: rgba(36, 28, 22, 0.10);
  --bac-hairline: rgba(36, 28, 22, 0.06);

  /* Orange scale */
  --bac-orange-100: #fff0e2;
  --bac-orange-200: #ffd7b3;
  --bac-orange-300: #ffb15c;
  --bac-orange-400: #ff9138;
  --bac-orange-500: #f77a24;
  --bac-orange-600: #ef6126;
  --bac-orange-700: #df4f2c;
  --bac-orange-800: #c9432b;

  --bac-orange-tint: #fff5ec;
  --bac-orange-line: rgba(239, 97, 38, 0.26);
  --bac-orange-shadow: rgba(218, 78, 36, 0.16);

  /* Semantic status */
  --bac-success: #198754;
  --bac-warning: #c87912;
  --bac-danger: #d43d3d;

  /* Signature material */
  --bac-gradient-primary:
    linear-gradient(
      135deg,
      #ff9a32 0%,
      #f77a24 30%,
      #ef6126 58%,
      #df4f2c 82%,
      #cf472d 100%
    );
}
```

### 2.2 Premium campaign gradient

For major promo/hero material only:

```css
background:
  radial-gradient(circle at 18% 10%, rgba(255,255,255,.28), transparent 36%),
  radial-gradient(circle at 84% 92%, rgba(105,20,8,.22), transparent 42%),
  linear-gradient(135deg, #ff9a32 0%, #f77a24 30%, #ef6126 58%, #df4f2c 82%, #cf472d 100%);
```

Rules:

- brightest highlight near top-left or focal artwork;
- darker warm edge toward lower-right;
- no neon red;
- no purple/rainbow drift;
- no gradient on ordinary product cards;
- use the signature gradient for primary commerce action and selected campaign moments.

### 2.3 Source palette mapping

When porting the desktop reference:

| Reference intent | Bacshop token |
|---|---|
| primary blue | `--bac-orange-600` or `--bac-gradient-primary` for major CTA |
| deep blue | `--bac-orange-700` |
| pale blue/sky tint | `--bac-orange-tint` |
| blue hover border | `--bac-orange-line` |
| blue focus halo | accessible orange focus treatment |
| navy text | `--bac-text` / `--bac-text-strong` |
| stock/success green | keep semantic green |
| warning amber | keep semantic warning |
| destructive red | keep semantic danger |

Recolor intent; do not redesign geometry.

---

## 3. Typography

### 3.1 Font stack

Use a stack that preserves the compact technical-retail proportions of the desktop reference:

```css
font-family: Bahnschrift, Aptos, "Trebuchet MS", system-ui, sans-serif;
```

Headings may prefer a Bahnschrift/Aptos Display-like face when already available in the project.

Do not add a new font dependency merely for novelty if it materially changes source proportions or performance.

### 3.2 Desktop scale

- Hero H1: `clamp(2.75rem, 4vw, 4.15rem)`
- Page heading H1: `clamp(2.15rem, 3.05vw, 3rem)`
- PDP H1: `clamp(2rem, 3.2vw, 3.4rem)`
- Section H2: approximately `1.55rem` to `2.5rem`
- Product title: approximately `1rem`
- Body: approximately `0.8rem` to `1rem`
- Metadata: approximately `0.68rem` to `0.82rem`

### 3.3 Mobile scale

- Page title: `20-26px`
- Section title: `17-20px`
- Product title: `13-15px`
- Body: `14-16px`
- Metadata: `11-13px`
- Price: visually stronger than surrounding metadata

### 3.4 Type rules

- Use weight, size, and spacing before adding more colors.
- Product names may wrap to two lines.
- Do not use ultra-light text for commerce-critical information.
- Avoid large centered paragraphs inside shopping surfaces.
- Prices, statuses, variants, SLA, and activation terms must scan quickly.

---

## 4. Geometry and Layout Tokens

### 4.1 Desktop reference geometry

```css
:root {
  --desktop-content-max: 1320px;
  --desktop-side-gutter: 20px;
  --desktop-header-min-height: 92px;
  --desktop-header-gap: 40px;
  --desktop-hero-min-height: 455px;
  --desktop-section-top: 36px;
  --desktop-section-bottom: 54px;
  --desktop-grid-gap: 18px;
  --desktop-category-gap: 14px;
  --desktop-card-radius: 17px;
  --desktop-card-media-radius: 13px;
  --desktop-filter-width: 320px;
  --desktop-filter-gap: 34px;
}
```

Canonical page width:

```css
.page-width {
  width: min(var(--desktop-content-max), calc(100% - 40px));
  margin-inline: auto;
}
```

Canonical desktop catalog grid:

```css
.product-grid--desktop {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--desktop-grid-gap);
}
```

Canonical desktop shop layout:

```css
.shop-layout--desktop {
  display: grid;
  grid-template-columns: var(--desktop-filter-width) minmax(0, 1fr);
  gap: var(--desktop-filter-gap);
}
```

### 4.2 Spacing policy

Prefer a small reusable spacing scale based on the project's existing token system. When adding new values, favor 4px/8px increments.

Reference-specific geometry such as 14px, 17px, 18px, 34px, or 92px is allowed where it is necessary for fidelity and should be expressed as named tokens rather than duplicated magic numbers.

---

## 5. Radius System

Desktop is moderately rounded. Mobile is intentionally rounder.

### 5.1 Desktop reference radii

- product card: `17px`
- product media: `13px`
- category card: approximately `16px`
- filter sidebar: approximately `18px`
- hero search: approximately `14px`
- main desktop button: approximately `11-12px`
- header search: pill / `999px`

### 5.2 Mobile radii

- utility control: circle, `44-48px` target
- search: `22-28px` or pill
- promo card: `22-28px`
- product card: `16-20px`
- product media: `16-20px`
- bottom navigation container: `28-36px`
- sticky purchase container: `24-32px`
- bottom sheet top corners: `24-30px`

Avoid arbitrary one-off radius values outside the defined component family.

---

## 6. Borders, Elevation, and Surface Rules

Bacshop is border-first, shadow-second.

### Default surface behavior

- opaque white/warm-white surfaces;
- subtle warm-neutral 1px borders;
- low-opacity elevation only where hierarchy needs it;
- warm orange shadow only for important orange floating/campaign surfaces;
- near-black surfaces used selectively for contrast, never as the default application background.

### Do not use

- blur-heavy glass cards;
- neon outlines;
- stacked large shadows;
- glow effects on ordinary controls;
- different shadow language for every feature.

Small translucency is acceptable for mobile floating navigation or sticky action regions when legibility and performance remain good.

---

## 7. Responsive Model

Bacshop does not use one layout that continuously shrinks from desktop to mobile.

There are two primary composition modes:

### Desktop mode

- source-like desktop header;
- desktop commerce canvas;
- dense product rails/grids;
- sidebar filters where appropriate;
- two-column PDP;
- contained application shells for account/reseller/admin.

### Mobile app mode

- compact utility top bar;
- prominent rounded search;
- horizontal chips/shortcuts;
- orange promo surface;
- two-column product cards;
- bottom sheets for filters/selectors;
- inset bottom navigation;
- sticky purchase action.

The exact breakpoint should reuse the project's existing breakpoint system. Do not create an arbitrary parallel breakpoint scale. Switch composition when the desktop geometry can no longer maintain the intended reference proportions.

Visual QA must include:

- 1440px desktop;
- one compact desktop/tablet size;
- approximately 390px mobile;
- one smaller phone size.

---

## 8. Icon System

Use one coherent icon family already present in the project, or one agreed family for the entire UI.

Rules:

- do not mix random icon libraries in the same surface;
- line weight should feel consistent;
- icon-only controls require accessible names;
- mobile utility icons sit inside 44-48px touch targets;
- critical commerce actions should not depend on an icon without a text label unless the interaction is universally recognizable and accessible.

---

## 9. Buttons

### 9.1 Primary

Purpose:

- one dominant action in the current context.

Examples:

- `Beli Sekarang`
- `Tambah ke Keranjang`
- `Bayar`
- `Tambah Saldo`
- critical `Simpan`

Style:

- orange gradient or strong orange fill;
- high contrast text;
- mobile height at least `44px`, preferably around `48px` in major actions;
- desktop height approximately `40-48px` depending on source component;
- desktop radius approximately `11-12px` unless reference context differs;
- mobile may be more rounded inside sticky app surfaces.

States:

- default;
- hover where applicable;
- pressed;
- keyboard focus;
- loading without major layout jump;
- disabled while remaining legible.

### 9.2 Secondary

- white/neutral surface;
- subtle border;
- charcoal text;
- orange border/text/tint for hover or selected emphasis where appropriate.

### 9.3 Tertiary

- text or ghost treatment;
- no competing filled background.

### 9.4 Destructive

- semantic danger red;
- explicit label;
- never reuse brand orange as destructive meaning.

---

## 10. Inputs and Search

### 10.1 General input

- white surface;
- subtle warm-neutral border;
- visible focus ring;
- error state includes message, not only color;
- disabled state remains readable;
- preserve native autofill where useful;
- mobile input type/keyboard should match field semantics.

### 10.2 Desktop header search

- wide rounded pill;
- aligned to reference header geometry;
- should remain visually dominant without displacing navigation/tools.

### 10.3 Mobile search

- approximately `50-56px` tall;
- pill or `22-28px` radius;
- search icon left;
- optional tune/filter control right;
- white surface;
- subtle border and soft elevation;
- suggestions shown in an app-like overlay or sheet.

Search is a discovery experience, not a submit-only text field.

---

## 11. Chips and Selectors

Use chips for:

- quick categories;
- filters;
- duration/variant options;
- mobile sort triggers.

Rules:

- selected state uses orange tint/accent;
- selected meaning should not depend on color alone;
- touch targets remain usable on mobile;
- do not turn every action into a pill.

Complex mobile filter/selection tasks belong in bottom sheets rather than compressed inline controls.

---

## 12. Badges and Status

Use badges sparingly for real state such as:

- Promo
- Popular
- Baru
- Instant / processing cue
- availability
- order state
- entitlement state
- reseller tier only inside an appropriate authorized context

Rules:

- no rainbow badge palette;
- preserve semantic status color meaning;
- pair important status color with readable text/icon treatment;
- user-facing labels should be human language, not raw implementation enums.

---

## 13. Desktop Header

Canonical structure:

```text
[ Bacshop logo ] [ primary nav ] [ dominant search ] [ cart/account tools ]
```

Contract:

- sticky;
- approximately `92px` minimum height;
- aligned to 1320px canvas;
- approximately 40px region gap where space permits;
- vertically centered navigation;
- active nav uses orange underline/accent;
- wide pill search;
- compact cart/account controls;
- translucent white background is allowed only if readability/performance stay strong.

Guest state must not show authenticated identity.

---

## 14. Mobile Top Bar

Contract:

- compact;
- left control: menu/back/context action;
- center title/logo only when useful;
- right control: cart/share/state-relevant utility;
- 44-48px circular targets;
- warm-white surface;
- subtle elevation;
- no desktop nav links stacked vertically.

---

## 15. Promo Card

Mobile primary promo target:

- radius `22-28px`;
- signature orange gradient;
- short label/badge;
- concise campaign title;
- one primary CTA;
- one coherent product/brand visual;
- carousel dots only when multiple campaigns exist;
- avoid long marketing paragraphs.

Desktop campaign surfaces should follow the reference storefront's geometry before applying Bacshop orange material.

---

## 16. Category Components

### Desktop category card

- four-column section where the reference uses it;
- approximately `14px` gap;
- compact horizontal anatomy;
- icon left;
- name + concise description center;
- arrow/affordance right;
- orange-tinted interaction state.

### Mobile category shortcut

- horizontally scrollable;
- compact artwork/icon;
- short label;
- soft warm surface;
- selected state when relevant;
- do not reuse wide desktop category cards.

---

## 17. Product Card

### 17.1 Desktop product card

Source-fidelity contract:

- white surface;
- subtle 1px border;
- `17px` outer radius;
- very soft shadow;
- media inset approximately `10px` from top/sides;
- media radius approximately `13px`;
- media aspect ratio `16:9`;
- body padding approximately `13px 14px 15px`;
- compact category/status pill only when meaningful;
- title maximum two lines;
- concise description/metadata maximum roughly two lines where used;
- price and availability/status aligned near footer region;
- compact primary action;
- four columns at full desktop canvas.

### 17.2 Mobile product card

App-composition contract:

- two-column grid;
- grid gap approximately `10-12px`;
- card radius `16-20px`;
- large square or slightly portrait media region is allowed;
- warm-neutral media background;
- title maximum two lines;
- concise duration/activation/processing cue;
- strong visible price near lower card region;
- favorite control only when wishlist exists and user state permits it;
- stable/consistent card height.

### 17.3 Information order

1. Product identity/visual.
2. Product name.
3. Critical variant/duration cue.
4. Activation/processing cue when decision-relevant.
5. Retail price.
6. Promo/compare-at state.
7. Availability if meaningful.
8. Optional wishlist action.

Retail cards must never expose reseller price.

---

## 18. Catalog

### Desktop

```text
[ page heading band ]

[ 320px sticky filters ] [ results area                         ]
                         [ search | sort | controls             ]
                         [ four-column product grid             ]
                         [ load more / pagination               ]
```

Contract:

- filter width around `320px`;
- filter/result gap around `34px`;
- sticky filter below header;
- rounded white filter surface with subtle border;
- groups separated by hairlines;
- active filter uses orange tint/accent;
- search/sort controls around `48px` high;
- no endless unbounded infinite scroll by default.

### Mobile

- no desktop sidebar;
- top bar + search;
- quick-filter horizontal chips;
- `Filter` opens bottom sheet;
- `Urutkan` control;
- active filter count when useful;
- two-column grid;
- explicit `Muat lainnya` / hybrid loading.

---

## 19. Product Detail Page

### 19.1 Desktop

Preserve source-like two-column structure:

```text
[ product media / artwork ]    [ product title             ]
                               [ key description/terms     ]
                               [ price                     ]
                               [ facts                     ]
                               [ variant/duration          ]
                               [ primary action            ]
```

Reference geometry:

- left: approximately `minmax(380px, .9fr)`;
- right: approximately `minmax(0, 1.1fr)`;
- gap: `clamp(35px, 7vw, 90px)`;
- top padding around `55px`;
- bottom padding around `80px`;
- title approximately `2rem-3.4rem`;
- price around `2rem`;
- primary action around `52px` minimum height.

Bacshop-required product terms may be grouped into compact facts/sections or lower content blocks; do not destroy the reference geometry to display them.

### 19.2 Mobile

Order:

1. back/context/cart or share top bar;
2. large rounded media panel;
3. pagination dots when applicable;
4. brand/category label;
5. product title + optional wishlist;
6. strong visible price;
7. Bacshop fulfillment/trust row;
8. variant/duration chips;
9. activation/processing/requirements summary;
10. structured/collapsible details;
11. sticky purchase bar.

Replace marketplace seller/follow UI with Bacshop trust facts such as:

- `Diproses oleh Bacshop`;
- activation method;
- SLA;
- warranty/support.

### 19.3 Mobile sticky purchase bar

- fixed/inset above safe area;
- large rounded white container;
- soft elevation;
- left: current/total price;
- right: orange-gradient primary CTA;
- CTA at least `48px` high;
- must not obscure page or system UI.

---

## 20. Bottom Navigation

Visual contract:

- fixed near bottom;
- horizontal inset approximately `12-16px` where width permits;
- safe-area-aware;
- rounded outer container `28-36px`;
- white/near-white surface;
- subtle border and soft shadow;
- labels visible;
- active item may use orange-tinted capsule + orange icon/text;
- minimum `44px` touch targets.

State mapping:

### Guest

- Beranda
- Belanja
- Promo
- Bantuan
- Masuk

### Customer

- Beranda
- Belanja
- Promo
- Pesanan
- Akun

### Approved Reseller in Reseller Center

- Dashboard
- Beli
- Pesanan
- Pelanggan
- Akun

Admin does not use consumer bottom navigation.

---

## 21. Account, Reseller, and Admin Shells

These surfaces reuse the same foundations but not the public retail information architecture.

### Customer Account

- contained desktop application shell;
- task-first modules for orders, entitlements, support, profile/security;
- app-like cards on mobile;
- no fake analytics.

### Reseller Center

- explicit switch from Retail Store;
- compact business navigation;
- operational cards/lists/tables;
- strong hierarchy for `Harga Kamu`, balance, orders, and expiry follow-up;
- reseller price appears only here after authorization.

### Admin Center

- separate operational shell;
- desktop-first sidebar/navigation;
- compact tables and filters;
- attention queues before decorative KPIs;
- explicit destructive confirmations;
- audit context for sensitive changes.

---

## 22. Feedback and Async States

Every major component/page must define applicable states:

- default;
- hover;
- pressed/active;
- keyboard focus;
- loading;
- skeleton;
- disabled;
- empty;
- error;
- retry;
- success/confirmation.

Commerce flows additionally account for:

- partial loading;
- offline/network failure;
- stale/changed price;
- unavailable product/variant;
- expired session;
- unauthorized route;
- payment pending/failed/expired;
- payment callback delay;
- fulfillment delay;
- `needs_customer_input`.

Skeletons should match final geometry rather than arbitrary gray blocks.

---

## 23. Motion

Motion confirms interaction. It does not decorate idle screens.

Recommended durations:

- micro interaction: `120-180ms`
- sheet/dialog: `180-260ms`
- larger layout transition: `220-320ms`

Appropriate uses:

- press feedback;
- chip selection;
- sheet entrance;
- toast;
- cart confirmation;
- carousel movement.

Avoid:

- endless floating animation;
- scroll-jacking;
- heavy parallax;
- animation required to understand status.

Respect `prefers-reduced-motion`.

---

## 24. Accessibility

Minimum system requirements:

- semantic HTML;
- keyboard-operable desktop interactions;
- visible focus treatment;
- sufficient contrast including on gradient surfaces;
- approximately 44px minimum touch targets for important mobile controls;
- accessible names on icon-only buttons;
- status not conveyed through color alone;
- field errors include text and recovery guidance;
- logical DOM/content order under zoom/reflow;
- meaningful alt text for product imagery;
- sticky mobile controls do not cover content or system UI;
- reduced-motion support.

Reference fidelity never overrides accessibility.

---

## 25. Performance Rules

- Rebuild visible reference patterns with reusable Bacshop components.
- Do not ship copied compiled reference-site runtime code.
- Use responsive/optimized product and promo media.
- Reserve media dimensions to reduce CLS.
- Lazy-load non-critical imagery.
- Keep font families and weights constrained.
- Avoid excessive blur and large shadows.
- Avoid unnecessary client-only state resolution.
- Keep mobile interaction feedback immediate.

---

## 26. Component Variant Strategy

Use shared domain data with device/surface-specific presentation variants.

Recommended patterns:

```text
ProductCard
  - desktop
  - mobile

CatalogFilters
  - desktop sidebar
  - mobile bottom sheet

Navigation
  - desktop public header
  - mobile retail bottom nav
  - reseller shell
  - admin shell

ProductPurchase
  - desktop PDP purchase area
  - mobile sticky purchase bar
```

Do not force one DOM tree to satisfy desktop and mobile when that causes compromised fidelity or inaccessible layout.

Do not duplicate pricing/authorization logic inside variants.

---

## 27. Anti-Slop Checklist

Reject a UI change if it introduces any of these without a concrete product reason:

- generic AI/SaaS hero replacement;
- random gradient blobs;
- floating 3D decoration;
- gradients on every section/card;
- arbitrary glassmorphism;
- fake charts;
- fake testimonials;
- fake awards/trust badges;
- random icon styles;
- arbitrary radius/shadow values;
- excessive pills;
- oversized desktop cards;
- desktop that looks like widened mobile;
- mobile that looks like stacked desktop;
- decorative animation competing with products;
- hidden decision-critical product terms;
- client-only concealment of reseller pricing.

When a reference pattern already exists, prefer matching it over inventing a new visual pattern.

---

## 28. Visual QA Acceptance

### Desktop comparison order

1. Page width and horizontal start/end positions.
2. Header height/alignment.
3. Hero footprint and left/right balance.
4. Card width/height and media ratio.
5. Grid/carousel gaps.
6. Category layout.
7. Catalog sidebar/toolbar proportions.
8. Typography scale and line height.
9. Border/radius/shadow intensity.
10. Orange recolor.

A correct orange palette with incorrect geometry is not complete.

### Mobile acceptance

Confirm:

- app-like top controls;
- prominent search;
- strong orange promo card;
- compact horizontal category shortcuts;
- stable two-column product grid;
- inset rounded bottom navigation;
- safe-area behavior;
- mobile PDP large media + sticky price/CTA;
- no desktop sidebar/header leakage;
- no accidental horizontal overflow.

---

## 29. Canonical Implementation Primitives

Prefer or create consistent primitives for:

- `PageWidth` / `Container`
- `DesktopHeader`
- `MobileTopBar`
- `SearchField`
- `SearchSuggestions`
- `ProductCard`
- `CategoryCard`
- `PromoCard`
- `PriceDisplay`
- `FilterSidebar`
- `FilterBottomSheet`
- `CatalogToolbar`
- `BottomNavigation`
- `ProductMedia`
- `VariantSelector`
- `FulfillmentFacts`
- `StickyPurchaseBar`
- `StatusBadge`
- `SkeletonState`
- `EmptyState`
- `ErrorState`
- `RetryAction`

Names may follow repository conventions; the important requirement is consistent responsibility and reuse.

---

## 30. Final Design Rule

Desktop should visibly belong to the supplied storefront reference after Bacshop content and orange branding are applied.

Mobile should visibly belong to a dedicated premium commerce app inspired by the supplied mobile reference rather than to the reference desktop site collapsed vertically.

The design is finished only when visual fidelity, commerce clarity, role correctness, responsive behavior, accessibility, and implementation quality are all simultaneously satisfied.
