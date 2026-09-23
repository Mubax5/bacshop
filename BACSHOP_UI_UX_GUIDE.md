# Bacshop UI/UX Design Guide

## 0. Status and Authority

This document is the visual and interaction authority for Bacshop.

The Product Requirements Document remains authoritative for product behavior, roles, authorization, pricing isolation, cart/checkout behavior, payment and order state, reseller rules, security, data integrity, auditability, and operational requirements.

This UI/UX guide is authoritative for visual composition, layout, responsive behavior, component geometry, spacing, typography, color, interaction patterns, feedback states, and visual fidelity.

If the PRD contains visual styling language that conflicts with this guide, use this guide for the visual decision. Do not change product behavior merely to imitate a reference screen.

Decision precedence:

1. Security, authorization, pricing isolation, payment integrity, and data correctness from the PRD.
2. Role and state separation from the PRD.
3. Product behavior and flow requirements from the PRD.
4. UI composition and visual fidelity from this guide.
5. Decorative choices only after the above are satisfied.

Visual polish must never override product truth.

---

## 1. Design North Star

Bacshop should feel like the supplied `store.buildwithreys.com` storefront on desktop and like a purpose-built premium shopping app on mobile.

The target is not a loose inspiration. Desktop must reuse the reference storefront's visual grammar closely enough that the relationship is immediately obvious: the same layout rhythm, header proportions, section density, card geometry, catalog composition, whitespace behavior, and page structure, adapted to Bacshop content and orange branding.

Mobile is the intentional exception. The desktop reference site's mobile layout must not simply be copied. Mobile should be re-composed to follow the supplied mobile commerce reference: compact app chrome, rounded controls, a prominent search field, promotional card, dense two-column shopping layout, large touch targets, bottom navigation, and a sticky purchase surface on product detail.

Core qualities:

- Commerce first, not SaaS marketing first.
- Clean, confident, and highly structured.
- White and warm-neutral surfaces with expressive orange gradient moments.
- Desktop layout fidelity to the supplied storefront source.
- Mobile app-like behavior instead of stacked desktop sections.
- Clear product, price, activation, fulfillment, and support information.
- Strict separation between Guest, Customer, Reseller, and Admin contexts.

---

## 2. Locked Reference Hierarchy

### 2.1 Desktop reference - strict replica contract

The folder `store.buildwithreys.com/` is the primary desktop visual source of truth.

Coding agents must inspect the actual reference files rather than re-creating the design from memory. Important reference files include:

- `index.htm`
- `shop.html`
- `categories.html`
- `products/*.html`
- `cart.html`
- `orders.html`
- `account.html`
- `_next/static/css/710253ed18be27b0.css`
- `_next/static/css/76bc6c6349b680a8.css`
- the local image assets under `_next/` and `auth/`

On desktop, preserve the reference site's:

- page width and horizontal rhythm;
- sticky header height and layout;
- desktop navigation proportions;
- pill search treatment;
- hero footprint and split composition;
- section spacing;
- product carousel geometry;
- four-column catalog grid;
- card borders, radii, image ratios, and content density;
- category-card composition;
- filter sidebar width and sticky behavior;
- catalog toolbar proportions;
- page-heading bands;
- product-detail two-column ratio;
- subtle border-first depth model;
- compact white footer behavior where applicable.

The desktop implementation is not a redesign exercise. When a matching reference pattern exists, port that pattern instead of inventing a new one.

### 2.2 What may change from the desktop reference

The following must be adapted to Bacshop rather than copied blindly:

- brand name, logo, labels, and copy;
- Bacshop catalog data and imagery;
- auth and role behavior;
- navigation destinations required by the PRD;
- retail versus reseller price behavior;
- order/payment/entitlement states;
- product activation, region, warranty, and support information;
- accessibility semantics;
- orange brand palette defined in this guide.

Do not copy production API endpoints, Clerk configuration, keys, analytics, third-party scripts, user data, compiled runtime assumptions, or unrelated business logic from the reference folder.

Compiled `_next/static/chunks` are a reverse-engineering reference, not the architecture to transplant. Re-implement the visual structure cleanly in Bacshop's own component system.

### 2.3 Mobile reference - strict composition reference

The supplied mobile marketplace screenshot is the primary mobile visual reference.

Mobile should closely reproduce its composition language:

- circular top utility buttons;
- clean compact top bar;
- a large rounded search surface;
- promotional card/carousel near the top;
- compact horizontal category shortcuts;
- dense two-column product discovery;
- soft image/media panels;
- restrained card text and visible price;
- bottom navigation inside a rounded elevated surface;
- app-like spacing and safe-area behavior;
- large product media on PDP;
- sticky bottom price plus purchase CTA.

Do not copy fashion-specific content, seller-following behavior, or multi-vendor trust patterns. Translate the same visual grammar into Bacshop's digital-commerce model.

### 2.4 Orange reference image - material and color reference only

The supplied orange desktop image is a reference for color, gradient depth, contrast, and material quality, not for information architecture.

Use it to guide:

- rich orange gradient surfaces;
- warm highlights and darker orange edges;
- crisp white cards over warm accent backgrounds;
- occasional near-black pills or contrast elements;
- restrained internal lines and subtle depth;
- premium rounded geometry.

Do not turn Bacshop into a SaaS features landing page.

---

## 3. Desktop Fidelity Rules

### 3.1 Geometry before creativity

Desktop implementation should begin by matching the source geometry.

Reference baseline from the source storefront:

```css
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
```

Equivalent reference patterns:

```css
.page-width {
  width: min(1320px, calc(100% - 40px));
  margin-inline: auto;
}

.site-header {
  min-height: 92px;
}

.product-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.shop-layout {
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 34px;
}
```

Agents may translate class names and implementation details, but should not casually change the visible result.

### 3.2 Pixel-fidelity priorities

When validating desktop, compare in this order:

1. Overall page width and section start/end positions.
2. Header height, logo/nav/search/cart alignment.
3. Hero height, left/right balance, and search placement.
4. Product-card width, height, image ratio, title line count, and price baseline.
5. Grid and carousel gaps.
6. Category-card layout.
7. Filter sidebar and catalog toolbar dimensions.
8. Heading scale and line height.
9. Border, radius, and shadow intensity.
10. Color conversion from blue to Bacshop orange.

A screen that uses the right colors but different proportions is not visually complete.

---

## 4. Brand Color and Material System

### 4.1 Hierarchy

The brand field is locked to:

1. White / warm white - dominant surfaces.
2. Orange gradient - primary brand expression and commerce action.
3. Charcoal / near-black - primary text and selective contrast.
4. Warm neutral gray - secondary surfaces and borders.
5. Semantic colors - only for status meaning.

Blue is not a Bacshop brand accent in the new implementation. If old source CSS uses blue for interaction, map it to the orange system unless it is a semantic state that should use another color.

### 4.2 Recommended tokens

```css
:root {
  --bac-bg: #f6f4f2;
  --bac-surface: #ffffff;
  --bac-surface-soft: #fbfaf9;
  --bac-surface-recessed: #f1efec;

  --bac-text: #191613;
  --bac-text-strong: #0f0d0b;
  --bac-text-muted: #746d67;
  --bac-text-subtle: #9d9690;

  --bac-line: rgba(36, 28, 22, 0.10);
  --bac-hairline: rgba(36, 28, 22, 0.06);

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

  --bac-success: #198754;
  --bac-warning: #c87912;
  --bac-danger: #d43d3d;
}
```

### 4.3 Signature orange gradient

Primary gradient:

```css
--bac-gradient-primary:
  linear-gradient(
    135deg,
    #ff9a32 0%,
    #f77a24 30%,
    #ef6126 58%,
    #df4f2c 82%,
    #cf472d 100%
  );
```

Premium campaign material:

```css
background:
  radial-gradient(circle at 18% 10%, rgba(255,255,255,.28), transparent 36%),
  radial-gradient(circle at 84% 92%, rgba(105,20,8,.22), transparent 42%),
  linear-gradient(135deg, #ff9a32 0%, #f77a24 30%, #ef6126 58%, #df4f2c 82%, #cf472d 100%);
```

Rules:

- brightest area near top-left or focal artwork;
- warmer/darker lower-right edge;
- no neon red;
- no purple or rainbow drift;
- no gradient on every card;
- primary CTA and main promotional surfaces may use gradient;
- ordinary product cards remain white.

### 4.4 Mapping the source storefront palette

When porting the reference desktop CSS:

| Reference intent | Bacshop mapping |
|---|---|
| `--blue` | `--bac-orange-600` or gradient for primary CTA |
| `--blue-deep` | `--bac-orange-700` |
| `--sky` | `--bac-orange-tint` |
| blue hover border | `--bac-orange-line` |
| blue focus halo | accessible orange focus halo |
| navy text | Bacshop charcoal text |
| mint/green stock state | keep semantic green |
| warning amber | keep semantic warning |
| red destructive | keep semantic danger |

This is a semantic recolor, not a layout rewrite.

---

## 5. Typography

Desktop should preserve the reference storefront's compact, technical-retail proportions.

Recommended stack:

```css
font-family: Bahnschrift, Aptos, "Trebuchet MS", system-ui, sans-serif;
```

Headings may use an Aptos Display / Bahnschrift-like stack when available.

Do not force a different font if it visibly changes the reference proportions.

Desktop scale:

- Hero H1: approximately `clamp(2.75rem, 4vw, 4.15rem)`.
- Page-heading H1: approximately `clamp(2.15rem, 3.05vw, 3rem)`.
- PDP H1: approximately `clamp(2rem, 3.2vw, 3.4rem)`.
- Section H2: compact, generally 1.55rem to 2.5rem.
- Product title: around 1rem desktop.
- Body: 0.8rem to 1rem depending on context.
- Metadata: approximately 0.68rem to 0.82rem.

Mobile should feel more like a native app:

- top-level page title: 20-26px;
- section title: 17-20px;
- product title: 13-15px;
- body: 14-16px;
- metadata: 11-13px;
- price: visually dominant over metadata.

Use weight and spacing before adding extra colors.

---

## 6. Surface, Radius, Border, and Shadow

### 6.1 Desktop source behavior

The reference storefront relies on clean white surfaces, subtle borders, restrained shadows, and moderate rounding.

Use these approximate values when matching source components:

- product card radius: 17px;
- product media radius: 13px;
- category card radius: 16px;
- filter sidebar radius: 18px;
- page controls: 10-14px;
- search pill in header: 999px;
- product card border: 1px subtle warm-neutral;
- product card shadow: very soft, low opacity;
- hero search radius: 14px;
- main buttons: about 11-12px radius;

Use borders before stronger shadows.

### 6.2 Mobile rounding

Mobile intentionally uses more rounded, app-like geometry:

- utility circles: 44-48px;
- search field: 22-28px radius or pill;
- promo card: 22-28px;
- product card: 16-20px;
- product image panel: 16-20px;
- bottom navigation container: 28-36px;
- sticky purchase container: 24-32px;
- bottom sheets: 24-30px top corners.

### 6.3 No generic glassmorphism

Small translucent layers are acceptable for mobile bottom navigation or a floating sticky action bar, but Bacshop must not become a blur-heavy glass UI.

Avoid:

- frosted cards everywhere;
- neon borders;
- transparent text panels over busy imagery;
- uncontrolled shadow stacking.

---

## 7. Desktop Header Contract

Desktop header should closely reproduce the reference source.

Core structure:

```text
[ Bacshop logo ] [ primary nav ] [ dominant search ] [ cart/account tools ]
```

Geometry and behavior:

- sticky at top;
- approximately 92px minimum height;
- content aligned to the 1320px desktop canvas;
- four-region grid structure matching the source;
- generous 40px-ish region gap where width permits;
- navigation text vertically centered within the tall header;
- active navigation state shown with an orange underline/accent;
- header search remains a wide rounded pill;
- cart and utility controls remain compact square/rounded controls;
- subtle translucent white background is allowed if performance remains good.

Guest state follows PRD navigation and must not show customer identity.

Customer and approved-reseller retail state may add account controls, but must preserve the same visible geometry as much as possible.

---

## 8. Desktop Homepage Contract

The desktop homepage should follow the source storefront's structure instead of inventing a new landing-page composition.

### 8.1 Hero

Reference geometry:

- minimum height around 455px;
- two-column layout;
- left side around 650px max content width;
- right visual region fills remaining space;
- about 35px column gap;
- vertical padding around 48px;
- large heading but not full-screen marketing typography;
- search is embedded as a major hero action;
- small proof/trust row sits below the search;
- right side contains a deliberate product/commerce visual composition.

Bacshop adaptation:

- use orange highlight text instead of source blue;
- hero primary visual may use orange gradient material;
- preserve search prominence;
- keep product discovery immediately below the hero;
- use real Bacshop value propositions, not fake metrics.

### 8.2 Product section

The source uses a horizontal product carousel with desktop cards roughly 285-330px wide and an 18px gap.

Use the same interaction language:

- visible section heading;
- compact `Lihat semua` action;
- scroll-snap carousel;
- circular previous/next controls on desktop;
- no oversized card treatment;
- product cards use the same base component as the catalog grid.

### 8.3 Category section

Desktop category grid follows the source:

- four columns;
- approximately 14px gap;
- compact horizontal card anatomy;
- icon on left;
- category name and concise description in center;
- arrow affordance on right;
- orange-tinted accents instead of blue.

### 8.4 Trust / why-Bacshop strip

Preserve the source's contained trust-strip idea:

- large rounded bordered container;
- warm orange-tinted background;
- small set of functional trust cards;
- text focused on stock/availability, checkout safety, fulfillment, activation, warranty, or support;
- no fake awards or invented testimonials.

### 8.5 Footer

For public desktop, preserve the reference storefront's compact footer behavior unless a product/legal requirement requires more content.

Do not replace it with a giant unrelated marketing footer simply for decoration.

---

## 9. Mobile App-Look Contract

Mobile is not a scaled-down version of Section 8.

### 9.1 Shell

Required:

- full-height app-like page;
- 14-18px horizontal page gutter;
- compact top utility row;
- prominent rounded search directly below the top row;
- scrollable category shortcuts;
- one strong promotional card;
- dense product discovery;
- persistent bottom navigation;
- safe-area-aware spacing;
- no desktop sidebar or desktop header squeezed into a phone.

### 9.2 Mobile home first viewport

Target sequence:

1. Top utility row.
2. Search pill.
3. Main orange promotional card/carousel.
4. Small category shortcut row.
5. First product section.
6. Bottom navigation remains reachable.

The first viewport must immediately read as a shopping app.

### 9.3 Top utility row

Visual direction from the mobile reference:

- left: circular menu/back/context control;
- center: brand or page title only when useful;
- right: cart or state-relevant utility;
- 44-48px circular hit areas;
- white or warm-white surfaces with subtle elevation;
- no desktop nav links stacked into the top bar.

### 9.4 Search

Mobile search should be one of the most prominent controls:

- about 50-56px tall;
- large pill or 22-28px radius;
- search icon on left;
- optional filter/tune control on right;
- white surface with soft shadow and subtle border;
- immediate focus state;
- suggestions rendered in an app-like overlay/sheet.

### 9.5 Promo card

The main promo card should visually echo the mobile reference, recolored into Bacshop orange:

- 22-28px radius;
- rich orange gradient background;
- concise label/badge;
- short campaign title;
- one primary CTA;
- one coherent product/brand visual;
- no excessive text;
- carousel dots when multiple campaigns exist.

### 9.6 Mobile category shortcuts

Use compact horizontally scrollable shortcut cards/chips.

Each shortcut may include:

- icon or compact product artwork;
- short label;
- soft warm surface;
- visible selected state when applicable.

Avoid wide desktop category cards on mobile.

### 9.7 Mobile product cards

Mobile product cards should follow the supplied app reference more closely than the desktop source.

Required anatomy:

- two-column grid;
- 10-12px grid gap;
- rounded 16-20px card;
- large clean image/logo region;
- subtle warm-neutral media background;
- favorite button only when wishlist is enabled and user state allows it;
- product name limited to two lines;
- concise duration/activation/processing cue;
- price visually strong;
- compact badge only when meaningful;
- consistent card height.

For digital products, a square or slightly portrait media panel may be used on mobile even though desktop keeps the source storefront's 16:9 media ratio. This is an intentional mobile exception to achieve the app-like reference composition.

---

## 10. Bottom Navigation

The bottom navigation should look like a polished app component, not a browser footer.

Visual treatment:

- fixed near the bottom with safe-area support;
- horizontally inset around 12-16px where screen width allows;
- rounded outer container approximately 28-36px;
- white/near-white surface;
- soft shadow and subtle border;
- active item may use an orange-tinted pill/capsule plus orange icon/text;
- labels remain visible;
- minimum 44px touch targets.

State mapping must follow the PRD exactly.

Guest:

- Beranda
- Belanja
- Promo
- Bantuan
- Masuk

Customer:

- Beranda
- Belanja
- Promo
- Pesanan
- Akun

Approved Reseller inside Reseller Center:

- Dashboard
- Beli
- Pesanan
- Pelanggan
- Akun

Admin does not use the consumer bottom navigation.

---

## 11. Search, Catalog, Filters, and Sorting

### 11.1 Desktop catalog

Desktop should closely reproduce the reference `shop.html` layout:

```text
[ page heading band ]

[ 320px sticky filter sidebar ] [ results area                         ]
                                [ search | sort | supporting controls ]
                                [ four-column product grid             ]
                                [ load more / pagination               ]
```

Reference behavior:

- sidebar width around 320px;
- gap around 34px;
- sidebar sticky below header;
- rounded white sidebar with subtle border;
- contextual filter groups separated by hairlines;
- active filter uses orange tint and orange checkbox/accent;
- catalog search around 48px high;
- sorting control around 48px high;
- four product columns at full desktop width;
- hybrid load-more/pagination behavior rather than endless unbounded scroll.

### 11.2 Mobile catalog

Do not render the desktop sidebar.

Use:

- compact top bar;
- search field;
- horizontally scrollable quick-filter chips;
- `Filter` button opening a bottom sheet;
- `Urutkan` control;
- optional active-filter count;
- two-column product grid;
- explicit `Muat lainnya` or hybrid loading.

### 11.3 Search behavior

Search remains a first-class marketplace feature and should support PRD behavior such as useful suggestions, category/product matches, recent context where allowed, typo recovery where technically feasible, and recovery-oriented empty states.

The desktop visual shell must match the reference; the behavior remains Bacshop-specific.

---

## 12. Product Card System

### 12.1 Desktop product card - source match

Desktop card should preserve the source storefront's composition:

- white surface;
- 1px subtle border;
- 17px outer radius;
- low-opacity shadow;
- 10px media inset from top/sides;
- media radius around 13px;
- 16:9 media ratio;
- body padding around 13px 14px 15px;
- compact category/status pill;
- title limited to two lines;
- concise description/metadata limited to roughly two lines where used;
- price and stock/status aligned in the footer region;
- compact primary add/buy action.

Reference desktop grid uses four columns at full width.

### 12.2 Mobile product card - app match

Mobile card is intentionally re-authored:

- more visual media prominence;
- two-column grid;
- cleaner metadata;
- app-style favorite/action placement;
- warm surface and tighter spacing;
- price near the bottom of the card;
- no desktop description paragraph if it makes the card dense.

### 12.3 Information hierarchy

Regardless of device:

1. Product identity/visual.
2. Product name.
3. Critical variant/duration cue.
4. Activation or processing cue where important.
5. Retail price.
6. Promo/compare-at state when applicable.
7. Stock/availability state when meaningful.
8. Optional wishlist action only when enabled.

Never expose reseller price in public retail cards.

---

## 13. Product Detail Page

### 13.1 Desktop PDP

Desktop should preserve the source storefront's two-column geometry:

```text
[ product media / artwork ]    [ product title             ]
                               [ description / key terms   ]
                               [ price                     ]
                               [ facts                     ]
                               [ variant / duration        ]
                               [ primary purchase action   ]
```

Reference dimensions:

- left column approximately `minmax(380px, .9fr)`;
- right column approximately `minmax(0, 1.1fr)`;
- gap approximately `clamp(35px, 7vw, 90px)`;
- vertical padding around 55px top and 80px bottom;
- PDP title approximately 2rem-3.4rem;
- price around 2rem;
- primary action around 52px minimum height.

Bacshop must still show the PRD-required activation method, SLA, region, requirements, warranty/support, and other decision-critical product terms.

Do this without destroying the reference geometry: use compact facts, grouped sections, accordions, or below-the-fold detail blocks.

### 13.2 Mobile PDP - app reference

Mobile PDP should follow the supplied reference photo:

1. top bar with back, centered context/title when useful, and cart/share utility;
2. large rounded product media panel;
3. carousel pagination dots if multiple media items exist;
4. brand/category label;
5. product title and optional wishlist action;
6. large visible price;
7. Bacshop fulfillment/trust row;
8. variant/duration selector chips;
9. activation/processing/requirements summary;
10. collapsible or structured detail sections;
11. sticky bottom purchase bar.

Do not copy the reference's marketplace seller-following row. Replace it with Bacshop-specific trust, such as `Diproses oleh Bacshop`, SLA, activation method, warranty, and support.

### 13.3 Sticky mobile purchase bar

Visual target:

- fixed/inset above safe area;
- large rounded white container;
- soft elevation;
- left side: total/current price;
- right side: orange gradient primary CTA;
- CTA height at least 48px;
- must not cover content or system UI.

---

## 14. Cart and Checkout

Desktop cart and checkout may reuse the reference storefront's compact border-first application surfaces where useful.

Mobile should remain app-like:

- cards instead of desktop rows when width is constrained;
- compact quantity/variant controls;
- summary stays readable without horizontal compression;
- sticky checkout action is allowed when it improves reachability;
- auth requirement must preserve cart intent;
- payment success and fulfillment success must remain visually distinct.

Primary checkout CTA uses orange gradient or strong orange fill.

Error, pending, changed-price, unavailable-product, and retry states must be designed, not left as browser defaults.

---

## 15. Authentication and Role-Aware UI

The UI must never mix Guest, Customer, Reseller Pending, Approved Reseller, Suspended Reseller, and Admin contexts.

Visual fidelity never justifies leaking protected data.

Desktop should preserve the reference storefront's public shell where possible, then swap state-relevant controls without changing the overall grid unnecessarily.

Mobile bottom navigation and top utility actions must switch by state according to the PRD.

Approved Reseller has two explicit contexts:

- Retail Store - retail pricing and customer-oriented UI.
- Reseller Center - authorized reseller pricing and business tools.

Switching contexts must be explicit.

---

## 16. Customer Account

Customer Account should use the same Bacshop visual family but does not need to literally duplicate a page from the reference folder when no equivalent exists.

Desktop:

- centered contained application canvas;
- compact navigation;
- white cards with source-like borders/radii;
- orange used for primary actions and active state;
- efficient information density;
- recent orders and active/expiring entitlements prioritized over decorative charts.

Mobile:

- same app shell as storefront;
- reachable sections;
- vertical cards;
- status and next action obvious;
- bottom navigation remains state-correct.

---

## 17. Reseller Center

Reseller Center is operational, but it should still feel visually related to the public storefront.

Desktop:

- contained business shell;
- compact sidebar/navigation;
- source-inspired white surfaces and subtle borders;
- orange active states and primary actions;
- dense lists/tables where useful;
- no decorative enterprise dashboard styling.

Mobile:

- dedicated app-like bottom navigation;
- compact purchase cards;
- strong `Harga Kamu` hierarchy;
- purchase balance, orders, customers, and quick buy actions prioritized.

Never reuse reseller price cards in the public storefront.

---

## 18. Admin Center

Admin is an operational product.

Use:

- desktop-first contained shell;
- compact sidebar;
- tables and filters;
- sticky headers where useful;
- clear attention queues;
- orange for primary non-destructive action;
- semantic red only for destructive/error action;
- audit context for sensitive operations.

Do not spend the first screen on decorative KPI tiles if there is operational work requiring attention.

---

## 19. Buttons and Interactive Hierarchy

### Primary

Use for one dominant local action:

- Beli Sekarang
- Tambah ke Keranjang
- Bayar
- Tambah Saldo
- Simpan in a critical flow

Style:

- orange gradient or strong orange fill;
- high text contrast;
- 44px+ minimum mobile height;
- source-like 40-48px desktop height depending on context.

### Secondary

- white/neutral surface;
- subtle border;
- charcoal text;
- orange border/text on hover or selected state where appropriate.

### Tertiary

- text/ghost action;
- no competing fill.

### Destructive

- semantic red only.

Never alternate orange and unrelated colors for the same action class.

---

## 20. Inputs, Chips, Badges, and Status

Inputs:

- desktop dimensions should match the source components;
- mobile controls should be larger and rounder;
- focus state must be visible;
- error includes text, not border alone.

Chips:

- quick categories;
- filters;
- duration/variant selection;
- sorting triggers on mobile.

Badges:

- Promo;
- Popular;
- Baru;
- Instant / processing cue;
- stock/availability;
- order or entitlement status.

Do not create a rainbow of arbitrary badge colors.

Status meaning must not rely on color alone.

---

## 21. Loading, Empty, Error, and Recovery States

Every major component/page must define:

- default;
- hover where relevant;
- pressed/active;
- keyboard focus;
- loading/skeleton;
- disabled;
- empty;
- error;
- retry;
- success/confirmation where relevant.

Commerce flows must additionally account for:

- partial loading;
- offline/network failure;
- stale or changed price;
- unavailable product/variant;
- expired session;
- unauthorized route;
- payment pending/failed/expired;
- payment callback delay;
- fulfillment delay;
- `needs_customer_input`.

Skeletons should match final geometry.

---

## 22. Motion

Motion confirms interaction; it does not decorate idle screens.

Recommended:

- 120-180ms micro interactions;
- 180-260ms sheets/dialogs;
- 220-320ms larger layout transitions.

Useful motion:

- button press;
- chip selection;
- bottom sheet entrance;
- toast;
- cart addition feedback;
- carousel movement.

Avoid:

- looping floating cards;
- scroll-jacking;
- excessive parallax;
- animation required to understand state.

Respect `prefers-reduced-motion`.

---

## 23. Accessibility

Minimum requirements:

- semantic HTML;
- keyboard-usable desktop flows;
- visible focus;
- sufficient text/background contrast;
- 44px recommended mobile touch targets;
- accessible names for icon-only controls;
- error/status messages not communicated by color alone;
- logical content order under zoom/reflow;
- meaningful alt text for product imagery;
- sticky mobile controls must not obscure content or system UI.

The desire to visually match the reference does not override accessibility.

---

## 24. Performance

Visual fidelity must be implemented efficiently.

- Rebuild reference visuals with reusable components rather than shipping copied compiled runtime code.
- Optimize product media and promo artwork.
- Use responsive images.
- Reserve dimensions to reduce CLS.
- Lazy-load non-critical media.
- Limit font families and weights.
- Avoid unnecessary client-only state resolution.
- Keep blur and shadow effects restrained.
- Mobile interaction feedback should feel immediate.

---

## 25. Anti-AI-Slop Rules

Forbidden unless explicitly required by product behavior:

- redesigning the desktop reference into a generic modern template;
- giant SaaS hero sections unrelated to shopping;
- random gradient blobs;
- floating 3D cards used only as decoration;
- gradients on every card;
- arbitrary glassmorphism;
- fake analytics;
- fake testimonials;
- invented trust badges;
- inconsistent radii;
- random icon families;
- random card styles from section to section;
- excessive pill buttons;
- oversized desktop cards that reduce catalog density;
- desktop layouts that are merely stretched mobile UI;
- mobile layouts that are merely stacked desktop sections;
- hiding important product terms to make a page cleaner;
- client-only hiding of protected pricing data.

Most importantly: do not replace a reference pattern with a new design just because it looks more "modern" to the agent.

---

## 26. Responsive Breakpoint Intent

Exact breakpoints may follow Bacshop's stack, but the behavior should roughly follow:

### Large desktop

- full 1320px canvas;
- full desktop header;
- source-like hero;
- four-column product grid;
- 320px filter sidebar;
- two-column PDP.

### Tablet / compact desktop

- preserve desktop visual DNA;
- reduce header/search widths carefully;
- catalog may reduce columns when necessary;
- do not switch to mobile app chrome too early.

### Mobile

- switch to dedicated app shell;
- hide desktop header/nav/sidebar;
- top utility row plus search;
- two-column product cards;
- bottom sheets for filters/selectors;
- floating/inset bottom navigation;
- sticky purchase surface on PDP.

Do not implement responsiveness as a single continuous scaling curve. Desktop and mobile are intentionally different compositions.

---

## 27. Page-Specific Acceptance Criteria

### 27.1 Desktop Home

Ready only if:

- header proportions visibly match the source storefront;
- hero footprint and two-column balance match;
- search sits in the expected place;
- product carousel/card widths match;
- category grid uses the same density;
- trust strip uses the same contained rhythm;
- orange recolor is consistent;
- no new generic landing-page sections have been invented.

### 27.2 Desktop Catalog

Ready only if:

- heading band matches source composition;
- filter sidebar width/stickiness matches;
- toolbar proportions match;
- four-column grid is preserved at full width;
- product-card dimensions are consistent;
- active filters use orange tint/accent;
- load-more/pagination is implemented.

### 27.3 Desktop PDP

Ready only if:

- two-column source geometry is preserved;
- product media and copy alignment match;
- title/price/action hierarchy matches;
- Bacshop decision-critical terms remain clear;
- purchase action is obvious without inventing an unrelated card layout.

### 27.4 Mobile Home

Ready only if:

- it looks like the supplied mobile app reference, not the desktop source collapsed vertically;
- top utility buttons are app-like;
- search is prominent;
- promo card is strongly visual and orange;
- category shortcuts are compact and horizontally browsable;
- product grid is two columns;
- bottom navigation is polished, inset, rounded, and reachable.

### 27.5 Mobile PDP

Ready only if:

- large rounded product media leads the page;
- title, price, variant, and fulfillment information are scannable;
- Bacshop trust replaces multi-vendor seller-follow patterns;
- sticky price + CTA bar is present and safe-area aware.

---

## 28. Visual QA and Comparison Process

Implementation is not complete until visual comparison has been performed.

For desktop pages with a source equivalent:

1. Run the Bacshop page and source reference at the same viewport dimensions.
2. Capture screenshots.
3. Compare geometry before color.
4. Correct header, hero, section, card, grid, and typography differences.
5. Confirm orange mapping after geometry matches.
6. Repeat at least at 1440px and one compact desktop width.

For mobile:

1. Compare against the supplied mobile reference composition.
2. Validate at approximately 390px width and one smaller phone width.
3. Confirm safe-area behavior.
4. Confirm bottom nav and sticky purchase surfaces do not cover content.
5. Confirm two-column card rhythm remains stable.

Do not accept "close enough" because the same components exist. Compare visible spacing and proportions.

---

## 29. Implementation Contract for Coding Agents

Any coding agent implementing Bacshop UI must:

1. Read the current PRD for product behavior and security.
2. Read this UI/UX guide for all visual decisions.
3. Inspect the `store.buildwithreys.com/` folder before changing desktop UI.
4. Treat the desktop source as a strict visual reference, not a mood board.
5. Re-implement source visuals cleanly in Bacshop's existing stack instead of shipping copied compiled Next.js runtime artifacts.
6. Never copy source API endpoints, production integrations, auth configuration, analytics, or user data.
7. Apply the orange recolor through semantic tokens, not scattered raw replacements.
8. Treat mobile as an intentional re-composition based on the supplied mobile app reference.
9. Never expose reseller data in retail UI.
10. Never use client-side hiding as authorization.
11. Implement loading, empty, error, disabled, and recovery states.
12. Reuse components consistently.
13. Preserve accessibility and semantic HTML.
14. Treat performance as part of UI quality.
15. Perform screenshot-based visual QA before calling a page complete.
16. Do not call a phase complete while its responsive and state variants are unfinished.

---

## 30. Source Adaptation Notes

### Desktop source storefront

The `store.buildwithreys.com/` folder is the primary source for desktop layout, spacing, sizing, card composition, page structure, and interaction shell.

The source's blue accent is intentionally replaced by Bacshop orange. Layout should remain recognizably the same.

### Mobile reference image

The supplied mobile marketplace screenshot is the primary source for mobile composition, control shape, bottom navigation, promo placement, card rhythm, and product-detail hierarchy.

### Orange reference image

The supplied orange desktop screenshot is used only for orange gradient depth, premium material treatment, warm highlights, white-card contrast, and selective dark accents.

### PRD

The PRD remains the source of truth for behavior, permissions, role separation, pricing isolation, checkout, payment/order states, reseller behavior, and admin operations.

Visual styling inside the PRD should not override this guide.

---

## 31. Final Design Principle

Desktop: copy the supplied storefront's visible design language as faithfully as possible, then recolor it into Bacshop's orange system and connect it to Bacshop behavior.

Mobile: do not copy the source storefront's mobile output. Build a purpose-made commerce app surface that follows the supplied mobile reference, using the same Bacshop orange visual system.

If an implementation looks like a generic AI-generated redesign instead of the supplied references, it is not finished.
