# BACSHOP

## Product Requirements Document

**Product:** Digital Premium Commerce + Reseller Ecosystem  
**Primary surfaces:** Public Storefront, Customer Account, Reseller Center, Admin Center  
**Product model:** B2C + B2B2C digital commerce with a reseller-only ecosystem  
**UI direction:** Mobile app-first; white-dominant premium marketplace with deep orange-to-warm-red gradients, Kumo-style blue tertiary accents, commerce-first desktop storefronts, and compact application shells for authenticated business areas

---

## 1. Product Overview

Bacshop is a single-merchant digital commerce platform for premium applications, digital subscriptions, vouchers, licenses, gift cards, and similar digital products.

Bacshop controls the catalog, product information, pricing, availability, fulfillment rules, warranty policy, promotions, and customer experience. External sellers do not list products on the platform.

The platform serves three primary roles:

- **Customer** - discovers, purchases, activates, tracks, and renews digital products.
- **Reseller** - receives dedicated reseller pricing and operational tools to sell Bacshop products to their own customers.
- **Admin** - operates catalog, pricing, orders, fulfillment, reseller access, balances, promotions, support, and content.

A fourth state, **Guest**, represents users who have not authenticated and must receive a complete public shopping experience without any authenticated or reseller-only information leaking into the UI.

### 1.1 Product goals

- Make digital-product shopping feel clear, trustworthy, fast, familiar, and visually premium.
- Make mobile feel like a purpose-built commerce app, not a responsive desktop website compressed onto a phone.
- Keep desktop commerce-first, information-dense, and easy to scan without turning the storefront into a generic SaaS landing page.
- Use a disciplined visual hierarchy: white-dominant surfaces, deep orange-to-warm-red brand gradients, Kumo-style blue as a tertiary accent, and selective near-black contrast.
- Keep product terms transparent, including duration, plan, activation method, region, account requirements, device restrictions, processing time, warranty, and support terms.
- Reduce discovery friction through strong search, contextual filters, meaningful suggestions, useful empty states, recent browsing context, and predictable category navigation.
- Reduce purchase friction through preserved cart intent, clear validation, visible checkout progress, explicit payment feedback, and concise forms.
- Make post-purchase experience as important as pre-purchase discovery through order timelines, activation guidance, support, expiry reminders, renewal, and repurchase.
- Create repeat-purchase behavior through order history, entitlement tracking, recently viewed products, and fast renewal or repurchase.
- Create a reseller program based on real purchase-price margin and useful business tools.
- Keep reseller operations simple by avoiding seller-marketplace complexity.
- Give admins enough operational control that routine catalog, pricing, reseller, order, and content changes do not require code changes.
- Ensure visual polish never overrides product truth, pricing transparency, authorization, accessibility, or performance.

### 1.2 Product boundaries

Bacshop is intentionally:

- **Not a multi-vendor marketplace.** There are no third-party seller listings, seller stores, seller payouts, or seller-side disputes.
- **Not a recruitment/downline commission system.** Reseller economics are based on dedicated purchase prices and margin.
- **Not an internal social network.** Community discussion may happen in external community channels while Bacshop provides announcements, academy resources, campaigns, and community links.
- **Not a generic SaaS marketing site.** Shopping, search, products, pricing, and promotions must dominate the commerce experience.

---

## 2. Roles, Authentication States, and UI Separation

Authentication state and reseller-program state must drive both navigation and commercial visibility.

The UI must never visually or commercially mix Guest, Customer, Reseller Pending, Reseller Approved, Reseller Suspended, and Admin contexts.

### 2.1 Access-state matrix

| State | Description | Commercial Price | Primary UI | Must Not Appear |
|---|---|---|---|---|
| Guest | User is not authenticated | Retail | Public Storefront | Orders, customer identity, active subscriptions, reseller prices, reseller dashboard, wallet, tier |
| Customer | Authenticated retail user | Retail | Storefront + account | Reseller price outside authorized Reseller Center |
| Reseller Pending | Customer has applied but is not approved | Retail | Customer UI + application status | Special reseller prices, reseller purchase flow, active tier benefits |
| Reseller Approved | Approved reseller | Retail in storefront; reseller price in Reseller Center | Retail Store + separate Reseller Center | Reseller pricing on public storefront product cards |
| Reseller Suspended | Reseller-program access restricted | Retail | Customer UI + reseller status notice | Reseller purchase tools, wallet spending, special reseller pricing |
| Admin | Internal operator | Not applicable | Separate Admin Center | Customer or reseller navigation inside admin workflows |

### 2.2 Never-mix rule

An approved reseller has two explicit contexts:

1. **Retail Store** - public/customer-oriented shopping with retail pricing.
2. **Reseller Center** - reseller-oriented purchasing with reseller pricing, reseller wallet, customer management, and reseller tools.

Switching context must be explicit, for example:

- `Buka Reseller Center`
- `Kembali ke Toko`

The system must never automatically turn retail browsing into reseller mode because the account happens to be an approved reseller.

### 2.3 Mobile navigation by state

| State | Bottom Navigation |
|---|---|
| Guest | Beranda - Belanja - Promo - Bantuan - Masuk |
| Customer | Beranda - Belanja - Promo - Pesanan - Akun |
| Reseller Pending | Same as Customer; reseller application status is shown inside Akun |
| Reseller Approved inside Reseller Center | Dashboard - Beli - Pesanan - Pelanggan - Akun |
| Admin | No consumer bottom navigation; use responsive admin sidebar/drawer |

### 2.4 Desktop header by state

| State | Header Behavior |
|---|---|
| Guest | Logo, category navigation, search, Promo, Program Reseller, Bantuan, cart, Masuk/Daftar. No profile identity. |
| Customer | Logo, categories, search, Promo, Pesanan, wishlist/cart, profile/account. |
| Reseller Approved | Retail header remains retail. A clear Reseller Center entry appears in account/header. Reseller Center uses its own business navigation. |
| Admin | Separate admin shell with no retail header. |

---

## 3. Experience Architecture

Bacshop uses one design language across devices, but each surface is composed for its device and task instead of scaling the same layout up or down.

### 3.1 Responsive surface behavior

| Surface | Desktop | Mobile |
|---|---|---|
| Public Storefront | Commerce-first centered layout with strong search, category navigation, compact campaign modules, dense product rails/grids, and premium modular surfaces | Native-app look with compact top region, prominent search, horizontal chips, promo carousel, 2-column cards or intentional horizontal rails, and state-aware bottom navigation |
| Product Detail | Two-column product summary and purchase panel with product terms, trust information, and details below | Single-column decision flow with touch-friendly selectors and sticky bottom purchase CTA |
| Catalog | Sidebar filters, visible sort, product grid, hybrid lazy loading / explicit `Muat lainnya` | Search-led layout, horizontal filter chips, bottom-sheet filters, 2-column grid, hybrid lazy loading / explicit `Muat lainnya` |
| Customer Account | Contained application shell with compact navigation and functional cards | App-like account sections with reachable navigation and clear status cards |
| Customer Orders | Dense status tabs/list, order timeline, quick actions, support and repurchase entry points | Vertical order cards with strong status language and reachable actions |
| Reseller Center | Contained business application shell with sidebar, compact cards, searchable operational tables/lists, and explicit retail-store context switch | Dedicated app-like reseller navigation with Dashboard, Beli, Pesanan, Pelanggan, and Akun |
| Admin Center | Contained operational shell with sidebar, tables, filters, bulk actions, attention queues, and compact information density | Responsive support access only; desktop remains the primary heavy-operations interface |

### 3.2 Mobile app-look contract

Mobile Bacshop must visually and behaviorally resemble a native marketplace application.

Required composition:

1. Compact top bar with only state-relevant identity/actions.
2. Large reachable search field near the top of commerce screens.
3. Horizontally scrollable category or filter chips where useful.
4. One prominent promotional campaign card/carousel without pushing product discovery too far below the fold.
5. Product sections using a dense two-column grid or intentional horizontal product rail.
6. Product cards with consistent image/logo container, concise metadata, visible retail price, fulfillment cue, and clear CTA/interaction.
7. Bottom navigation that changes by authentication/context state exactly as defined in Section 2.
8. Sticky purchase action on product detail and other high-intent flows when useful.
9. Bottom sheets for mobile filter/selector tasks that would otherwise require cramped controls.
10. Touch targets, spacing, typography, and motion that feel intentionally mobile rather than browser-default.

Mobile visual composition is a strict requirement. Desktop navigation patterns, oversized desktop cards, or wide multi-column forms must not be mechanically collapsed into mobile.

### 3.3 Desktop public-storefront contract

Desktop Bacshop must remain a marketplace first.

The public storefront uses:

- dominant search and category discovery;
- white-dominant canvas and surfaces;
- large but restrained rounded containers;
- premium whitespace without reducing catalog density;
- deep orange-to-warm-red gradient only for important campaign/brand moments and primary commerce actions;
- selective near-black surfaces for premium contrast;
- Kumo-style blue only as a tertiary informational/interactive accent;
- compact campaign hero rather than giant generic marketing typography;
- 5-6 product cards per row where content width and readability permit;
- product rails and category modules before generic marketing sections;
- a clear premium footer with help, program, legal, and social/company destinations where applicable.

Desktop must not become an enlarged mobile UI or a generic SaaS landing page.

### 3.4 Desktop application-shell contract

Customer Account, Reseller Center, and Admin Center use a contained premium application-shell direction:

- centered application canvas on large screens;
- compact sidebar or role-appropriate navigation;
- multiple functional regions visible in one viewport where useful;
- small efficient controls rather than oversized decorative cards;
- clear separation between navigation, status, actions, and data;
- rounded white surfaces, subtle borders, controlled elevation, and selective contrast cards;
- no fake analytics or decorative charts that do not map to real product data.

### 3.5 Public home structure

The public homepage prioritizes shopping and discovery.

Recommended desktop sequence:

1. Header with logo, category access, dominant search, state-correct navigation, cart, and authentication/account actions.
2. Compact campaign hero plus at most a limited number of supporting promo cards.
3. Category shortcuts such as AI, Streaming, Design, Editing, Productivity/Office, Gaming/Gift Card, and More.
4. Popular products.
5. Category-based product rails/grids.
6. Selective promotional inserts between catalog sections.
7. Recently viewed for eligible returning contexts.
8. Trust/support block focused on fulfillment, warranty, processing, and support.
9. FAQ preview.
10. Desktop footer.

Recommended mobile first viewport:

1. Compact state-correct top bar.
2. Search.
3. Category/filter chips.
4. Promotional card/carousel.
5. First product section as early as practical.
6. Bottom navigation always available for primary destinations.

### 3.6 Guest-specific homepage rule

Before authentication, the homepage must not show:

- `Premium Kamu`;
- active-subscription counts;
- expiry reminders tied to an account;
- order widgets;
- account-specific recommendations that imply identity;
- reseller tier;
- wallet balance;
- reseller pricing.

Guest content must feel complete without pretending the user is already logged in. Guest-local recent searches or recently viewed items may be retained locally/session-scoped when privacy and storage policy permit, but must not be represented as account history.

### 3.7 Marketplace UX behavior contract

Across storefront, catalog, product detail, cart, checkout, and post-purchase surfaces:

- clarity takes priority over novelty;
- the same interaction pattern should behave consistently across pages;
- every asynchronous or consequential action must communicate loading, success, failure, disabled, retry, or waiting states;
- search should provide useful suggestions and product/category matches rather than act as a basic submit-only text box;
- filters should be contextual to the category/product model instead of forcing irrelevant generic filters everywhere;
- empty search/catalog states must help users recover through alternative queries, category suggestions, popular products, or clear-filter actions;
- product cards and product pages must expose decision-critical information before purchase;
- forms should validate contextually, support autofill where appropriate, and explain errors in user language;
- multi-step checkout must expose progress when more than one meaningful step exists;
- post-purchase screens must explain what happens next, not merely display payment success;
- catalog browsing uses hybrid lazy loading / explicit `Muat lainnya`, not endless unbounded infinite scroll;
- role-specific UI must remain isolated as defined in Section 2.

---

## 4. Public and Guest Experience

### 4.1 Guest capabilities

A Guest can:

- Browse homepage, categories, search results, product detail, promotions, FAQ, help, and reseller-program information.
- See retail pricing and public promotions.
- Read activation method, duration, region, compatibility, account requirements, warranty, support terms, and processing SLA before login.
- Add products to a session/local cart when the cart feature is enabled.
- Start Masuk or Daftar from clear authentication CTAs.
- Preserve product/cart intent across login where possible.

Checkout requires authentication so digital delivery, activation tracking, support, warranty, order history, and renewal have a persistent owner.

### 4.2 Guest UI acceptance rules

| ID | Requirement |
|---|---|
| GUEST-UI-01 | No avatar, customer name, order count, subscription count, reseller tier, wallet balance, or personalized subscription content before authentication. |
| GUEST-UI-02 | Guest auth CTA is `Masuk` / `Daftar`. Mobile Guest bottom navigation ends in `Masuk`, not `Akun`. |
| GUEST-UI-03 | Protected deep links redirect to authentication with a clear return path instead of showing an empty authenticated shell. |
| GUEST-UI-04 | Program Reseller pages may explain benefits but must not expose active reseller prices before approval and entry into Reseller Center. |
| GUEST-UI-05 | Guest cart must always retain retail pricing. Referral parameters or marketing links must never switch it into reseller pricing. |

### 4.3 Authentication behavior

After successful authentication:

1. Server resolves authoritative account state and reseller-program status.
2. Protected UI renders only after authorization state is known.
3. Standard Customers return to the requested retail flow.
4. Approved Resellers enter Reseller Center only when they intentionally request the reseller context.
5. Retail Store remains retail even for approved reseller accounts.

---

## 5. Customer Commerce Experience

The primary customer journey is:

**Discover -> Understand -> Buy -> Activate -> Manage -> Renew**

### 5.1 Customer modules

| Module | Requirement |
|---|---|
| Search & Discovery | Autocomplete/suggestions, product/category matches, contextual filters, recent searches where allowed, recently viewed items, typo-tolerant or forgiving matching where technically feasible, and useful empty states |
| Catalog | Category browsing, contextual filters, sorting, 2-column mobile grid, dense desktop grid, explicit `Muat lainnya` / hybrid lazy loading, and clear no-result recovery |
| Product Card | Product identity/logo, concise variant summary, retail price, optional compare-at price/promo badge, fulfillment/processing cue, availability state, and consistent interaction |
| Product Detail | Product identity, retail price, variants, duration, activation type, region, requirements, SLA, warranty/support terms, `Yang Kamu Dapat`, activation preview, FAQ, review/rating when enabled, and primary purchase CTA |
| Cart | SKU, variant, quantity where applicable, price, promo/voucher state, total, clear edit/remove actions, and preserved intent through authentication |
| Checkout | Selected SKU, required recipient/customer data, voucher, payment method, total, terms acknowledgement, contextual validation, progress where multi-step, and explicit payment feedback |
| Orders | Status filters, detail timeline, activation instructions, support entry, needs-customer-input recovery, repurchase/renew action |
| Entitlements | Active, expiring, expired, or not-applicable lifecycle where relevant |
| Personalization | Popular/trending content for Guest; recently viewed, buy again, renewal, and related products for eligible Customers; recommendations must not leak reseller context |
| Notifications | Payment, processing, activation, issue, expiry reminder, renewal confirmation |
| Support | Order-scoped support entry so operations immediately know order and product context |

### 5.2 Product transparency requirement

Every digital SKU must clearly state what the buyer receives.

A product page must not use only vague labels such as `Premium 1 Bulan` when any of the following materially changes the experience:

- activation method
- account ownership model
- invitation vs license/voucher delivery
- region
- supported device
- account requirement
- duration
- renewal behavior
- warranty/support coverage
- processing time

### 5.3 Product detail requirements

Product detail must support:

- Brand and product name.
- Product logo/visual.
- Variant selection.
- Duration selection.
- Retail price and promo state.
- Activation method.
- Processing SLA.
- Region restrictions.
- Device/account requirements.
- Warranty/support terms.
- `Yang Kamu Dapat` summary.
- Activation instructions preview.
- FAQ.
- Review/rating when review functionality is enabled.
- Primary purchase CTA.

On mobile, the primary purchase action should be sticky at the bottom when appropriate.

### 5.4 Customer order states

Customer-facing order UI must communicate states clearly and avoid ambiguous success messaging.

Examples:

- Menunggu Pembayaran
- Pembayaran Diterima
- Diproses
- Membutuhkan Data Tambahan
- Aktif / Selesai
- Bermasalah
- Dibatalkan
- Refund

Payment success must not be visually presented as fulfillment success when activation is still pending.

### 5.5 Search and discovery UX

Search must behave as a discovery tool, not only a keyword form.

Minimum behavior:

- show product and category suggestions while typing when useful;
- rank direct product/brand matches above generic content;
- support query recovery for common spacing or minor spelling mistakes where technically feasible;
- expose recent searches locally or account-aware according to authentication state and privacy policy;
- expose recently viewed products where useful;
- provide contextual filters such as duration, price, activation/delivery type, region, denomination, or brand only when relevant to the current catalog context;
- provide a clear way to remove all filters;
- return a recovery-oriented empty state rather than a dead-end message.

An empty state should be able to offer relevant alternatives such as:

- corrected/broader query suggestions;
- nearby categories;
- popular products;
- recently viewed items;
- `Hapus semua filter`.

### 5.6 Cart, authentication, and checkout UX

Checkout requires authentication because digital delivery, activation ownership, warranty/support, order history, entitlement tracking, and renewal require a persistent owner.

Authentication must not destroy shopping intent.

Requirements:

- preserve selected SKU/variant, cart contents, voucher state where valid, and return path through login/registration;
- explain why sign-in is required in concise product language;
- keep checkout forms as short as fulfillment allows;
- validate fields contextually and re-validate authoritatively on the server;
- use mobile-appropriate keyboard/input types;
- support autofill where safe and relevant;
- expose progress when checkout contains multiple meaningful steps;
- communicate pending/failed/expired payment state explicitly;
- never show a generic success screen when the order still requires activation, processing, or customer action.

### 5.7 Post-purchase and repeat-purchase UX

Post-purchase is a first-class commerce surface.

After payment, the customer should see:

- what was purchased;
- payment state;
- order/fulfillment state;
- expected processing time/SLA;
- what happens next;
- whether action is required;
- activation instructions when available;
- order-scoped support entry;
- repurchase/renew action when appropriate.

Products with expiry or repeat-purchase behavior should support fast renewal/repurchase without unnecessary re-entry of previously valid information.

---

## 6. Reseller Program

The reseller program is a separate business mode built around margin, purchasing speed, repeat orders, customer follow-up, learning resources, and community support.

### 6.1 Economic model

The core model is **purchase-price margin**:

- Bacshop defines a retail price per SKU.
- Bacshop defines reseller prices per SKU and reseller tier.
- The reseller purchases at their authorized reseller price.
- The reseller sells to their own customer at a price they determine within program rules.
- Bacshop does not rely on per-order seller commissions or recruitment/downline economics.

### 6.2 Reseller lifecycle

| State | Behavior |
|---|---|
| Not Applied | Customer can view reseller-program information and start an application. |
| Pending | Application status is visible in account. No special prices, reseller wallet spending, or Reseller Center access. |
| Approved | Dedicated Reseller Center is unlocked with reseller pricing and reseller tools. |
| Rejected | Reason or guidance may be shown; account remains a retail customer. |
| Suspended | Retail account remains usable unless separately restricted; Reseller Center and special pricing are blocked. |

### 6.3 Tier and benefit model

Tier structure is configurable from Admin Center.

A recommended structure:

| Capability | Reseller | Plus | Pro |
|---|---:|---:|---:|
| SKU-level reseller price | Yes | Yes | Yes |
| Additional price advantage | Base | Configurable | Configurable |
| Marketing materials | Yes | Yes | Yes |
| Campaign eligibility | Standard | Standard + selected | All eligible campaigns |
| Support priority | Standard | Priority | Highest configured priority |
| Order/usage limits | Standard | Higher | Highest |
| Early promo access | Optional | Optional | Optional |

Commercial thresholds, discounts, and benefits must be admin-configurable rather than embedded in frontend code.

### 6.4 Reseller Center modules

| Module | Core Behavior |
|---|---|
| Dashboard | Purchase balance, monthly orders, tier/progress, expiring customer products, recent orders, campaign notices |
| Beli Produk | Reseller catalog with retail reference price, `Harga Kamu`, suggested sell price when enabled, variants, and margin calculator |
| Pesanan | Orders placed for reseller customers with status, activation details, support, and repurchase |
| Pelanggan | Lightweight CRM for customer contact, purchased products, expiry, and repeat-order shortcuts |
| Saldo | Purchase-balance top-up, ledger, refunds, credits, and transaction history |
| Harga Reseller | Searchable reseller price list by product, SKU, and tier with effective-date support |
| Promo & Campaign | Eligible campaigns, progress, target, rules, reward status |
| Materi Promo | Product/campaign assets, captions, usage notes, and sharing helpers |
| Academy | Selling guides, operational guides, articles, video links, and checklists |
| Komunitas | Announcements, events, program updates, and external community links |
| Bantuan | Reseller-aware support and order-scoped issue reporting |

### 6.5 Reseller wallet

The reseller wallet is a **purchase balance**, not an earnings wallet.

Primary behavior:

- Reseller can top up balance.
- Purchases debit reseller balance.
- Refunds and approved credits can return to balance.
- Every financial change creates an immutable ledger entry.
- Admin financial adjustments require a reason and audit trail.
- Cash withdrawal is not a core reseller workflow.

This design keeps the reseller model focused on purchasing rather than commission payout operations.

### 6.6 Reseller customer management

A reseller can maintain lightweight customer records containing only the data required for selling and support.

Typical fields:

- Customer name
- Contact method
- Email/identifier required by product
- Purchased SKU
- Activation date
- Expiry date
- Last order
- Status
- Notes

The system should surface customers with upcoming expiry and provide a fast repurchase/renewal path without requiring unnecessary re-entry of data.

### 6.7 Reseller marketing materials

Admin can publish materials per product or campaign:

- Square feed asset
- Story asset
- WhatsApp-friendly banner
- Product image
- Short caption
- Long caption
- Product talking points
- Selling notes
- Campaign terms

Resellers should be able to copy text and download available assets directly from Reseller Center.

### 6.8 Campaigns

Campaigns may include:

- Eligible reseller tiers
- Eligible SKUs
- Start/end date
- Order or GMV target
- Progress calculation
- Reward type
- Reward status

Recommended early reward types:

- Purchase-balance credit
- Temporary reseller price benefit
- Access benefit
- Campaign voucher

Campaign rewards must be tied to commerce activity, not reseller recruitment chains.

### 6.9 Community and Academy

Bacshop should provide a Community Hub containing:

- Announcements
- Campaign updates
- Events
- Academy resources
- Product education
- Selling guides
- Community link

Discussion may take place in an external WhatsApp, Telegram, or Discord community. Bacshop remains the source of truth for official program information.

---

## 7. Admin Center

Admin Center is an operational product, not a decorative analytics dashboard.

The first screen should prioritize actions that require attention.

### 7.1 Admin areas

| Area | Core Capabilities |
|---|---|
| Dashboard | GMV/orders, payment state, processing backlog, SLA breaches, open issues, low availability, reseller application queue |
| Products | Brands, products, SKUs, variants, media, category, description, activation type, region, duration, warranty, SLA, availability |
| Pricing | Retail price, compare-at price, reseller price matrix by SKU/tier, promo overrides, effective dates |
| Orders | Search/filter, timeline, fulfillment actions, notes, resend instructions, issue handling, refund handling |
| Resellers | Applications, verification information, approve/reject/suspend, tier override, notes, limits |
| Reseller Balance | Top-up reconciliation, credits/debits, refund credits, ledger audit |
| Campaigns | Eligibility, SKU scope, period, target, reward, progress rules, publication state |
| Marketing Materials | Assets and captions by product/campaign |
| Community & Academy | Announcements, resources, events, external community links |
| Promotions & CMS | Homepage hero, banners, product rails, category placement, promo pages, FAQ, static pages |
| Support | Customer/reseller tickets linked to order, priority, assignment, resolution notes |
| System | Admin users, RBAC, audit logs, notification templates, system settings |

### 7.2 Admin roles

| Role | Typical Access |
|---|---|
| Super Admin | Full platform access, permissions, sensitive system configuration |
| Operations | Orders, fulfillment, product availability, support operations |
| Finance | Payments, top-ups, refunds, credits/debits, reconciliation |
| Content | CMS, banners, product content, marketing materials, Academy |
| Customer Support | Order read access, tickets, customer/reseller communication, limited remedial actions |

### 7.3 Admin security baseline

Admin access requires stronger controls than customer access:

- MFA.
- Least-privilege RBAC.
- Server-side authorization on every protected action.
- Immutable audit events for sensitive changes.
- Required reason fields for financial adjustments.
- Re-authentication for high-risk actions where appropriate.
- No frontend-only permission enforcement.

---

## 8. Product, Pricing, and Commerce Model

### 8.1 Product hierarchy

**Brand**  
Commercial brand, for example ChatGPT, CapCut, Canva, Netflix.

**Product**  
Product family, for example `ChatGPT Plus`.

**SKU / Variant**  
Purchasable configuration containing the details that materially affect fulfillment or pricing, such as:

- duration
- plan
- region
- activation method
- account type or ownership model where permitted
- device constraints
- processing SLA
- warranty/support policy

**Price**  
Pricing belongs to SKU, not only to brand or product.

Each SKU can support:

- Retail price
- Compare-at price
- Public promotional price
- Reseller price by tier
- Effective start/end time

### 8.2 Pricing isolation

Reseller pricing is protected business data.

Requirements:

- Reseller price must be authorized server-side.
- Retail product APIs/pages must not return hidden reseller pricing to unauthorized users merely for frontend concealment.
- Guest and retail cart totals are calculated using retail pricing.
- Reseller Center totals are calculated using the reseller's authoritative tier and currently effective reseller price.
- Pricing changes must support auditability and effective dates.

### 8.3 Payment states

Suggested payment states:

- `pending`
- `paid`
- `failed`
- `expired`
- `refunded`

### 8.4 Order states

Suggested order states:

- `created`
- `processing`
- `needs_customer_input`
- `fulfilled`
- `issue`
- `cancelled`

### 8.5 Entitlement states

Where the product has an activation/expiry lifecycle:

- `pending_activation`
- `active`
- `expiring_soon`
- `expired`
- `revoked`
- `not_applicable`

### 8.6 Support states

- `open`
- `waiting_customer`
- `waiting_ops`
- `resolved`
- `closed`

### 8.7 Fulfillment principles

- Every SKU declares its fulfillment/activation method.
- Required customer fields are known before checkout completion.
- Payment callbacks are idempotent.
- Duplicate provider callbacks must not create duplicate orders or duplicate fulfillment.
- Non-instant activation must display a clear processing state and SLA.
- Invalid or incomplete recipient information moves the order to `needs_customer_input` instead of showing false completion.
- Warranty/support eligibility is derived from SKU/order rules and shown in order detail.
- Manual fulfillment overrides must be auditable.

---

## 9. UI Design System and Interaction Principles

Bacshop must feel like a premium retail/digital-commerce product: white-dominant, mobile app-like, visually deep but restrained, commerce-first, and operationally clear.

### 9.1 Visual hierarchy and color system

The brand hierarchy is:

1. **White / warm white** - dominant canvas and surfaces.
2. **Deep orange gradient** - primary brand expression, primary commerce CTA, campaign emphasis, and selected high-value modules.
3. **Kumo-style blue** - tertiary informational/interactive accent.
4. **Near-black / neutral** - typography and selective contrast surfaces.
5. **Semantic colors** - success, warning, and error only for their actual status meanings.

Recommended tokens:

| Token | Direction |
|---|---|
| Background | `#F6F7F8` |
| Surface | `#FFFFFF` |
| Soft Surface | `#FBFBFC` |
| Primary Text | `#16181D` |
| Strong Text | `#0C0D10` |
| Muted Text | `#6D7179` |
| Border | `rgba(16,18,22,0.10)` |
| Orange Start | `#FF9A32` |
| Orange Mid | `#F77A24` / `#EF6126` |
| Warm Orange-Red End | `#CF472D` |
| Kumo Blue | `oklch(0.5772 0.2324 260)` with implementation fallback close to `#056DFF` |
| Success | Green reserved for success/active states |
| Warning | Amber reserved for expiry/attention states |
| Error/Destructive | Red reserved for destructive/error states |

The visual field should remain predominantly white. Orange is the main expressive/commerce color. Blue must not compete with orange for primary attention.

### 9.2 Signature deep gradient

Primary gradient direction:

```css
linear-gradient(
  135deg,
  #ff9a32 0%,
  #f77a24 30%,
  #ef6126 58%,
  #df4f2c 82%,
  #cf472d 100%
)
```

For premium campaign/hero surfaces, the gradient should have internal depth through restrained layered highlights and darker warm edges rather than appearing as a flat two-stop gradient.

Rules:

- brightest highlight may sit near the top-left or focal content;
- lower/right areas may become slightly darker and warmer;
- do not drift into pure crimson or neon red;
- do not use the signature gradient on every card;
- use gradient for primary CTA, hero/promo moments, selected business cards, and important brand emphasis;
- preserve accessible text contrast on all gradient states.

### 9.3 Surface, depth, and shape

- Use borders and spacing before heavy shadows.
- Default surfaces are opaque; glassmorphism is not a default Bacshop pattern.
- Product cards should generally use approximately 14-18px radius depending on density.
- Inputs/buttons/chips should generally use approximately 10-14px radius.
- Major promotional/application containers may use approximately 20-28px radius when scale justifies it.
- Reuse a consistent radius scale rather than assigning arbitrary radii per component.
- Shadows should be soft, low-opacity, and reserved for elevation or important floating actions.
- Near-black contrast surfaces are selective, not the default background.

### 9.4 Typography and information density

- Use a modern sans-serif such as Plus Jakarta Sans or a compatible product sans-serif.
- Body text generally remains in the 14-16px range.
- Mobile typography prioritizes compact hierarchy and scan speed.
- Desktop may use larger section headings, but giant marketing typography must not delay product discovery.
- Numeric prices, status, variant labels, SLA, and key terms must be easy to scan.
- Avoid long centered paragraphs inside commerce surfaces.

### 9.5 Mobile commerce direction

Mobile is a strict app-like surface.

Required patterns:

- compact state-correct top bar;
- dominant rounded search field;
- horizontal category/filter chips;
- one strong promo card/carousel near the top;
- two-column product grid or intentional horizontal rails;
- consistent rounded product cards;
- reachable bottom navigation based on auth/context state;
- sticky purchase CTA on product detail when appropriate;
- bottom sheets for filters, selectors, and compact tasks;
- strong touch targets;
- no accidental horizontal overflow outside intentional rails;
- no desktop sidebar patterns squeezed into phone layouts.

### 9.6 Desktop public commerce direction

Desktop public storefront should emphasize:

- search-led header;
- category navigation;
- compact campaign hero;
- multiple product rails/grids;
- contextual filters and sorting;
- promotional inserts between selected product modules;
- high catalog discoverability;
- clear help/trust information;
- premium footer;
- 5-6 product cards per row where content permits.

Desktop styling may use large rounded white containers, premium whitespace, deep gradient accents, and selective dark contrast while remaining obviously a commerce product.

### 9.7 Customer, Reseller, and Admin application shells

Authenticated operational surfaces use a contained premium application-shell direction:

- compact sidebar/navigation on desktop where appropriate;
- high information density without clutter;
- small efficient controls;
- functional cards tied to real data/actions;
- clear priority of action-required items over decorative analytics;
- role-specific navigation only;
- state-aware empty/loading/error handling;
- responsive adaptation rather than simple scaling.

### 9.8 Search, filter, and content-loading interaction rules

Search should support suggestions, product/category matches, recent context where allowed, and forgiving matching where technically feasible.

Filters must be contextual. Examples:

- AI/subscription products: duration, activation type, region, price;
- gift cards/vouchers: denomination, region, brand, price;
- other categories: only filters backed by actual SKU/product metadata.

Catalog content loading:

- use hybrid lazy loading and/or explicit `Muat lainnya`;
- do not use endless unbounded infinite scroll as the default catalog behavior;
- keep footer/help reachable;
- preserve scroll/query/filter state when users return from product detail where practical.

### 9.9 Empty, loading, feedback, and recovery states

Major components and flows must define at least:

- default;
- hover where relevant;
- pressed/active;
- keyboard focus;
- loading/skeleton;
- disabled;
- empty;
- error;
- success/confirmation where relevant.

Page-level async flows must also account for:

- partial loading;
- no search results;
- network failure;
- unauthorized access;
- expired session;
- unavailable product/variant;
- price changed;
- payment pending/failed/expired;
- order delayed;
- `needs_customer_input`.

Skeletons should approximate real content shape instead of showing arbitrary gray rectangles.

### 9.10 CTA hierarchy

- **Primary commerce action:** deep orange gradient or solid orange equivalent with high contrast.
- **Secondary action:** neutral/outlined surface, or blue only when the action is informational/navigation rather than competing purchase intent.
- **Tertiary action:** text/link treatment.
- **Destructive action:** semantic red and explicit labeling.

The same action class must not randomly alternate between orange and blue.

### 9.11 Product-card decision hierarchy

Product cards prioritize:

1. product identity/logo/visual;
2. product name;
3. concise variant/duration summary;
4. fulfillment or processing cue;
5. retail price;
6. compare-at/promo state when applicable;
7. small status badge if necessary;
8. clear click/tap affordance.

Avoid filling cards with all PDP metadata. Decision-critical details belong on the product detail page.

### 9.12 Visual restraint and anti-template rules

Avoid:

- decorative glassmorphism as a default pattern;
- random abstract blobs;
- floating 3D cards used only for decoration;
- gradient backgrounds on every section;
- giant generic SaaS hero typography;
- fake analytics or charts with no product meaning;
- generic testimonial sections where a commerce module would be more useful;
- different decorative card styles for every category;
- arbitrary radius/shadow/color values per component;
- excessive animation;
- desktop layouts that are merely enlarged mobile screens;
- mobile layouts that expose desktop complexity.

Prefer:

- real product identity/logo;
- consistent product media containers;
- strong information hierarchy;
- familiar shopping patterns;
- clear pricing;
- concise status badges;
- meaningful promotional artwork only inside intentional campaign areas;
- motion that confirms interaction rather than decorating idle screens.

---

## 10. Functional Requirements

Priority definitions:

- **Must** - required for launch quality and core commerce integrity.
- **Should** - important growth or usability capability after the core is stable.
- **Later** - intentionally deferred until demand or operational maturity justifies it.

| ID | Priority | Requirement |
|---|---|---|
| AUTH-01 | Must | Resolve authoritative user and reseller-program state server-side after login and protect routes accordingly. |
| AUTH-02 | Must | Guest storefront renders without account-specific components. |
| AUTH-03 | Must | Checkout requires login and preserves product/cart/variant intent through authentication. |
| AUTH-04 | Must | Approved Resellers enter reseller context only through an explicit context switch; retail browsing stays retail-priced. |
| CAT-01 | Must | Admin-managed brand/product/SKU hierarchy with transparent activation metadata. |
| CAT-02 | Must | Search, category browsing, product detail, and variant selection. |
| CAT-03 | Must | Search provides useful product/category suggestions and recovery-oriented no-result behavior. |
| CAT-04 | Must | Filters are contextual to catalog metadata and support clear-all/reset behavior. |
| CAT-05 | Must | Catalog content uses hybrid lazy loading and/or explicit `Muat lainnya`; endless unbounded infinite scroll is not the default. |
| UX-01 | Must | Mobile storefront conforms to the app-like composition contract: compact top bar, dominant search, chips, promo module, dense product cards, bottom navigation, and mobile-appropriate sheets/sticky actions. |
| UX-02 | Must | Desktop public storefront remains commerce-first and does not use generic SaaS page architecture. |
| UX-03 | Must | Customer Account, Reseller Center, and Admin Center use contained role-specific application shells with real functional data/actions. |
| UX-04 | Must | Major async components and purchase flows implement loading/skeleton, empty, error, disabled, and recovery states where applicable. |
| UX-05 | Must | Checkout forms provide contextual validation while server-side validation remains authoritative. |
| UX-06 | Must | Multi-step checkout exposes progress and explicit payment/processing feedback. |
| UX-07 | Must | Product and order UI distinguish payment success from fulfillment/activation completion. |
| UX-08 | Must | Post-purchase experience exposes next step, SLA, activation state/instructions, action-required state, support, and renewal/repurchase where applicable. |
| UX-09 | Must | Visual implementation follows the white-dominant, deep orange-gradient, Kumo-blue tertiary hierarchy and consistent component token system. |
| PRICE-01 | Must | SKU-level retail pricing and reseller price matrix by tier. |
| PRICE-02 | Must | Reseller prices visible only inside authorized Reseller Center. |
| ORDER-01 | Must | Create, pay, process, fulfill, and track digital orders using separate payment, order, and entitlement states. |
| ORDER-02 | Must | Order detail shows timeline, activation instructions, support eligibility, and warranty information where relevant. |
| SUB-01 | Must | Track active, expiring, and expired entitlement-like products and support repurchase/renewal. |
| RES-01 | Must | Reseller application with pending, approved, rejected, and suspended states. |
| RES-02 | Must | Reseller catalog, reseller pricing, buy-for-customer flow, and reseller order history. |
| RES-03 | Must | Reseller purchase-balance wallet with top-up and immutable ledger. |
| RES-04 | Must | Lightweight reseller customer and expiry management. |
| ADMIN-01 | Must | Admin management for products, pricing, orders, reseller states, balances, promotions/CMS, and support. |
| ADMIN-02 | Must | RBAC and audit logs for sensitive actions. |
| NOTIF-01 | Must | Transactional notifications for payment, processing, activation, issues, and expiry reminders. |
| RES-05 | Should | Configurable tier progression and tier benefits. |
| RES-06 | Should | Reseller campaigns with target, progress, and reward rules. |
| RES-07 | Should | Marketing material center and Academy/Community Hub. |
| UX-10 | Should | Wishlist/favorites for retail customers. |
| UX-11 | Should | Recently viewed and recent search history behave state-appropriately for Guest and authenticated users. |
| UX-12 | Should | Returning Customers receive explainable buy-again, renewal, related-product, and browsing-context recommendations. |
| AN-01 | Should | Operational and conversion analytics dashboards. |
| RES-08 | Later | Optional reseller storefront/microsite after the core purchasing model proves demand. |

---

## 11. Core Data Model

| Entity | Purpose |
|---|---|
| User | Identity, contact, authentication state, retail profile |
| ResellerProfile | Application status, tier, limits, community/program metadata |
| Brand | Product brand identity |
| Product | Commercial product family |
| SKU | Purchasable variant and fulfillment configuration |
| Price | Retail/reseller-tier price, promo relation, effective dates |
| Cart | Selected products before checkout |
| Checkout | Recipient data, voucher, totals, payment intent |
| Payment | Provider reference, amount, state, timestamps, refund relation |
| Order | Commercial transaction and overall order state |
| OrderItem | Purchased SKU, price snapshot, recipient/fulfillment data |
| Entitlement | Activation and expiry lifecycle where applicable |
| ResellerCustomer | Reseller-owned lightweight customer record and renewal context |
| Wallet | Reseller purchase-balance account |
| LedgerEntry | Immutable wallet credit/debit record |
| Campaign | Eligibility, SKU scope, period, target, reward, progress rules |
| MarketingAsset | Product/campaign creative and caption resource |
| SupportTicket | Order-linked support lifecycle |
| Notification | Transactional/customer/reseller notification record |
| AuditEvent | Sensitive admin/reseller/financial change history |

---

## 12. Analytics

### 12.1 Retail analytics

Track at minimum:

- Product-view to checkout conversion.
- Checkout to paid conversion.
- Repeat purchase rate.
- Renewal/repurchase rate.
- Search to product-click rate.
- Promo usage.
- Refund rate.
- Support/issue rate.

### 12.2 Reseller analytics

Track at minimum:

- Reseller application conversion.
- Approval rate.
- Approved-to-first-order activation.
- Monthly active resellers.
- Orders per active reseller.
- Reseller GMV share.
- Wallet top-up frequency.
- Reseller customer renewal rate.
- Campaign participation and completion.
- Tier progression where enabled.

### 12.3 Operations analytics

Track at minimum:

- Median fulfillment time.
- SLA breach rate.
- Activation failure rate.
- `needs_customer_input` rate.
- Support-ticket rate.
- Refund rate.
- Payment failure rate.
- Reseller-balance adjustment volume.

### 12.4 Auth and UI-state analytics

Track:

- Guest-to-login conversion.
- Checkout authentication conversion.
- Route-gate failures.
- Unauthorized reseller-price access attempts.
- Retail-to-Reseller-Center context switches.

---

## 13. Non-Functional Requirements

### 13.1 Performance

- Mobile-first performance budget.
- Aim for Core Web Vitals in the good range on major storefront, catalog, search, and product-detail pages.
- Search input, filter changes, cart interactions, and navigation should provide immediate visual feedback even when network work continues.
- Lazy-load non-critical campaign media and product imagery.
- Optimize image formats, responsive image sizing, and product-logo delivery.
- Avoid decorative animation, blur, shadow, or oversized media that materially hurts interaction performance.
- Skeleton states should be used for meaningful async content rather than blank page regions.
- Avoid blocking authenticated-state resolution longer than necessary.

### 13.2 Security

- Secure session management.
- Server-side authorization.
- MFA for admin accounts.
- Rate limiting on authentication, payment, and sensitive endpoints.
- Webhook signature validation.
- Secret isolation from client bundles.
- Re-authentication for high-risk admin actions where appropriate.
- Client-side validation is never treated as an authorization or pricing boundary.

### 13.3 Payments

- Do not store raw payment-card credentials.
- Use provider tokens, redirects, or hosted components where applicable.
- Payment callbacks must be idempotent.
- Payment and order transitions must be retry-safe.
- UI payment success must map to actual payment state and must not imply fulfillment completion.

### 13.4 Privacy

- Collect only data needed for fulfillment, customer service, reseller operations, analytics needed for product operation, and compliance.
- Reseller customer records must be isolated per reseller.
- Retail users cannot access reseller customer data.
- One reseller cannot access another reseller's customer data.
- Sensitive fields must be encrypted or appropriately protected at rest when required.
- Guest recent search/recently viewed behavior, when enabled, should remain local/session-scoped unless the user authenticates and policy explicitly allows account association.

### 13.5 Auditability

Create audit events for:

- Financial adjustments.
- Reseller approval/rejection/suspension.
- Tier changes and overrides.
- Price changes.
- Fulfillment overrides.
- Refund actions.
- Admin permission changes.
- Sensitive settings changes.

### 13.6 Accessibility

- Keyboard-friendly desktop flows.
- Visible focus states.
- Semantic labels.
- Sufficient contrast, including text over gradient surfaces.
- Status meaning must not rely on color alone.
- Alt text for meaningful imagery.
- Touch-friendly target sizes on mobile.
- Error messages must identify the field/problem and provide a recovery path.
- Sticky mobile purchase controls must not cover essential content or system/browser UI.
- Motion should respect reduced-motion preferences where applicable.

### 13.7 Reliability

- Order/payment state transitions must be transactionally safe.
- Wallet balance changes must use immutable ledger entries and protected transactions.
- Duplicate callbacks must not duplicate fulfillment.
- Availability updates must be protected from overselling where inventory-like limits exist.
- Price changes during a shopping session must be reconciled explicitly before payment rather than silently charging a different value.

### 13.8 Responsive behavior

The product must support small mobile devices through large desktop screens without simply scaling mobile components.

Mobile requirements:

- preserve the native-app marketplace composition contract;
- use bottom navigation for primary mobile destinations by state;
- use sheets/chips/sticky actions for mobile-native task handling;
- avoid desktop-style sidebars and dense multi-column forms.

Desktop requirements:

- increase information density, grid columns, and navigation complexity where useful;
- keep public pages commerce-first;
- use contained application shells for authenticated business/operational areas;
- preserve the same design tokens, status language, product truth, and authorization rules.

### 13.9 UX state completeness

Launch-critical pages must define meaningful states for:

- initial loading;
- partial loading;
- empty data;
- no search result;
- network failure;
- unauthorized/protected route;
- expired session;
- unavailable product/variant;
- changed price;
- payment pending/failed/expired;
- processing delay;
- `needs_customer_input`;
- success/fulfilled state.

A page is not implementation-complete if it only designs the happy path.

---

## 14. Launch Scope

Core launch scope includes:

- Guest storefront with state-correct header/navigation.
- Strict app-like mobile storefront composition and state-aware bottom navigation.
- Commerce-first premium desktop storefront.
- Search suggestions and category/product discovery.
- Contextual filtering and sorting.
- Recovery-oriented search/catalog empty states.
- Hybrid lazy loading / explicit `Muat lainnya` catalog loading.
- Product rails and catalog.
- Product detail and variants.
- Sticky mobile purchase action where appropriate.
- Public promo pages.
- Help and FAQ.
- Customer authentication.
- Cart and checkout with preserved intent through authentication.
- Contextual form validation and clear checkout progress/feedback.
- Payment integration.
- Order tracking with payment/fulfillment state separation.
- Activation instructions.
- `needs_customer_input` recovery flow.
- Order-scoped support.
- Entitlement/expiry tracking.
- Renewal/repurchase.
- Recently viewed/recent-search behavior where enabled and appropriate to auth state.
- Reseller application and approval states.
- Dedicated Reseller Center with contained application-shell UX.
- SKU-level reseller pricing.
- Buy-for-customer flow.
- Reseller purchase balance and top-up ledger.
- Reseller customer/expiry tracking.
- Admin catalog and pricing.
- Admin order and fulfillment operations.
- Reseller management.
- Wallet operations.
- Promotions/CMS.
- Support operations.
- RBAC and audit logs.
- Transactional notifications.
- Basic analytics instrumentation.
- Loading, skeleton, empty, error, disabled, and recovery states for launch-critical pages/components.
- White-dominant visual system with deep orange signature gradient and Kumo-style blue tertiary accents.

The reseller growth layer should only be expanded after pricing isolation, wallet accounting, fulfillment reliability, expiry tracking, admin auditability, and launch-critical UX state completeness are proven stable.

---

## 15. Growth Enhancements

Once the core transaction and reseller operations are stable, Bacshop can add:

- Configurable reseller tier progression.
- Campaign targets and rewards.
- Marketing material center.
- Academy content.
- Community announcements and event tools.
- Advanced expiry follow-up helpers.
- Reseller customer renewal workflows.
- Cohort and retention reporting.
- Wishlist/favorites.
- More advanced operational dashboards.

---

## 16. Future Considerations

The following capabilities should remain outside the core architecture unless product demand clearly justifies them:

- Reseller microsite/storefront.
- Affiliate or commission-based acquisition model.
- Internal social feed/forum.
- Complex gamification or public leaderboard.
- Multi-vendor seller marketplace.

These features must not shape the initial data model in ways that add unnecessary seller or payout complexity.

---

## 17. Product Policy Defaults

The following defaults provide implementation guidance while remaining configurable:

| Policy | Default Direction |
|---|---|
| Reseller application | Account + identity/contact + program agreement; require extra business documents only when operational/compliance policy needs them |
| Tier thresholds | Admin-configurable based on actual unit economics and reseller distribution |
| Guest cart | Session cart allowed; authentication required before checkout |
| Wallet top-up minimum | Admin-configurable; avoid unnecessarily high minimum for new resellers |
| Campaign rewards | Prefer purchase-balance credits or price benefits before introducing cash payouts |
| Suggested reseller selling price | Guidance only unless a commercial or legal policy requires bounds |
| Community channel | External community linked from Community Hub |
| Fulfillment types | Enable only methods Bacshop can reliably source, support, and operate under applicable supplier/provider terms |

---

## 18. End-to-End Acceptance Journeys

| Journey | Expected Result |
|---|---|
| Guest -> Mobile Home | Guest sees an app-like storefront with compact top bar, search, chips, promo, product discovery, retail pricing, and Guest bottom navigation; no account/reseller identity leaks into the UI. |
| Guest -> Search -> No Exact Result | Search offers useful alternatives, related categories/products, and filter reset rather than a dead-end empty screen. |
| Guest -> Product -> Login -> Checkout | Guest sees only retail UI; product/cart/variant context survives authentication; retail checkout resumes and completes; order appears in account. |
| Guest -> Program Reseller | Guest sees program benefits and application CTA; no reseller price is exposed; authentication is required to apply. |
| Customer -> Product -> Checkout | Product terms, variant, SLA, activation method, region/account requirements, warranty/support, and price are understandable before payment; checkout validates required data and communicates progress. |
| Customer -> Payment Paid -> Fulfillment Processing | UI shows payment received while fulfillment remains `processing`; next step and SLA are visible; the order is not falsely shown as fulfilled. |
| Customer -> Needs Customer Input | Order enters `needs_customer_input`; the UI explains exactly what must be corrected and provides a direct recovery action. |
| Customer -> Completed Order -> Renew | Customer can review activation/support details and repurchase or renew without unnecessary re-entry of data. |
| Customer -> Desktop Account | Account uses a contained application shell with compact navigation, real functional cards, orders/entitlements/support access, and no decorative fake analytics. |
| Customer -> Apply Reseller -> Pending | Retail experience remains unchanged; pending status is visible; no Reseller Center access or reseller price. |
| Approved Reseller -> Retail Store | Storefront remains retail-priced and buyer-oriented; clear Reseller Center entry is available; reseller price is not shown on retail cards/PDP. |
| Approved Reseller -> Reseller Center -> Buy for Customer | Reseller enters a distinct business shell, sees authorized tier price, selects SKU/customer, pays using balance/allowed method, and receives correct order tracking. |
| Reseller -> Expiry Follow-up | Expiring reseller customer appears in customer management; reseller can repurchase without re-entering unnecessary data. |
| Admin -> Change Reseller Price | Change applies only to the intended SKU/tier, is auditable, respects effective time, and appears only in authorized Reseller Center. |
| Admin -> Suspend Reseller | Reseller Center and special pricing are blocked promptly; retail account remains usable unless independently restricted. |
| Payment Callback Retried | Only one valid paid transition and fulfillment flow occurs; duplicate callback is safe. |
| Catalog -> Load More -> Product -> Back | Catalog preserves useful query/filter/scroll context where practical and does not force the user to restart discovery. |

---

## 19. Definition of Product Readiness

Bacshop is ready for implementation when the product design and engineering model can satisfy all of the following:

- Designers can create desktop and mobile screens without guessing which user state sees which component.
- Guest UI is complete and never contains authenticated placeholders.
- Retail pricing and reseller pricing are isolated by authorization and context.
- Mobile storefront screens consistently look and behave like a purpose-built commerce app rather than a responsive website.
- Desktop public pages remain commerce-first while using the premium white/orange visual language.
- Customer Account, Reseller Center, and Admin Center have distinct contained application shells with role-correct navigation.
- Search behavior, contextual filters, empty-state recovery, and catalog content loading are defined rather than left to implementation guesswork.
- Product cards communicate identity, variant, fulfillment cue, price, and promo state consistently.
- Product detail communicates exactly what the buyer receives, how activation works, how long it takes, what restrictions apply, and what support/warranty is available.
- Checkout preserves intent through authentication, validates required data clearly, and never treats client-side validation as authoritative security.
- Payment, order, and entitlement states are visibly distinct to the user.
- Post-purchase UX explains what happens next and supports activation, issue recovery, support, renewal, and repurchase.
- Launch-critical pages/components define loading, skeleton, empty, error, disabled, and recovery states in addition to happy paths.
- The design system consistently uses white-dominant surfaces, deep orange-to-warm-red signature gradients, Kumo-style blue tertiary accents, and semantic status colors.
- Decorative effects do not introduce generic SaaS/AI-template patterns, fake analytics, unnecessary glassmorphism, or excessive gradient use.
- Engineers can model products, SKUs, prices, payments, orders, entitlements, reseller profiles, balances, and reseller customers without introducing seller concepts.
- Operations can control catalog, pricing, reseller status, orders, fulfillment, promotions, support, and wallet adjustments from Admin Center.
- Sensitive financial and permission changes are auditable.
- Accessibility and mobile touch behavior are defined for all primary purchase and account flows.
- Performance requirements allow the product to retain premium visual quality without sacrificing responsive interaction or major Core Web Vitals targets.
- Digital-product terms are explicit enough that the buyer understands exactly what they are purchasing before payment.
