# Bacshop Agent Operating Contract

## 0. Purpose

This file defines how coding agents must work inside the Bacshop repository.

It is an execution contract, not a product specification and not a visual mood board. Agents must use the existing project documents together and must not invent requirements to fill gaps.

The intended working model is:

- Codex acts as the orchestrator.
- GPT-5.6 Luna agents perform focused implementation, inspection, testing, and QA tasks.
- The orchestrator owns decomposition, architecture, integration, review, conflict resolution, and final acceptance.
- A task is not complete merely because code compiles; functional correctness, role isolation, responsive behavior, and visual fidelity must also pass.

---

## 1. Required Reading and Authority

Before changing implementation, read the current versions of:

1. `PRD.md`
2. `BACSHOP_UI_UX_GUIDE.md`
3. `ARCHITECTURE.md`
4. `DESIGN_SYSTEM.md`
5. The relevant files inside `store.buildwithreys.com/` for any desktop screen being implemented or changed

Use the following authority rules:

### Product behavior, security, data, and permissions

`PRD.md` is authoritative for:

- roles and authentication state;
- authorization;
- retail versus reseller pricing;
- checkout requirements;
- payment, order, fulfillment, entitlement, and support state;
- reseller lifecycle and wallet rules;
- admin permissions;
- auditability;
- privacy and reliability.

### UI composition and fidelity

`BACSHOP_UI_UX_GUIDE.md` is authoritative for:

- desktop reference fidelity;
- mobile composition;
- responsive behavior;
- page hierarchy;
- component geometry;
- visual states;
- accessibility expectations;
- visual QA.

### Technical boundaries

`ARCHITECTURE.md` is authoritative for implementation boundaries and system invariants unless the existing repository has a stronger, already-established equivalent. Do not replace a working architecture merely to make folder names match documentation.

### Tokens and component styling

`DESIGN_SYSTEM.md` is the implementation-level design contract for tokens, states, dimensions, component variants, and desktop/mobile styling rules.

### Reference storefront

`store.buildwithreys.com/` is a visual reverse-engineering source for desktop, not a codebase to transplant.

Never copy its production configuration, credentials, API endpoints, auth configuration, analytics identifiers, user/session data, or compiled runtime architecture into Bacshop.

---

## 2. Non-Negotiable Product Invariants

Every implementation must preserve these invariants.

### 2.1 Context isolation

The following contexts must never be visually or commercially mixed:

- Guest
- Customer
- Reseller Pending
- Reseller Approved in Retail Store
- Reseller Approved in Reseller Center
- Reseller Suspended
- Admin

An approved reseller has two explicit contexts:

- Retail Store: retail pricing and customer-oriented commerce.
- Reseller Center: authorized reseller pricing and business tools.

Never switch a reseller into reseller pricing merely because the authenticated account is approved.

### 2.2 Pricing isolation

- Guest and Customer retail surfaces use retail pricing.
- Reseller prices are protected business data.
- Reseller prices are resolved only inside authorized Reseller Center flows.
- Do not return reseller prices in public/retail payloads and hide them with CSS or client logic.
- Price calculations and authorization are server-authoritative.
- Checkout must reconcile changed prices explicitly rather than silently charging a different amount.

### 2.3 Authorization

- Client-side state is never an authorization boundary.
- Protected actions require server-side authorization.
- Admin access uses least privilege.
- Sensitive financial and permission changes require auditability.
- Never move sensitive validation into the client for convenience.

### 2.4 Transaction integrity

- Payment callbacks must be idempotent.
- Duplicate callbacks must not duplicate fulfillment.
- Payment success is not the same as fulfillment success.
- Wallet balance changes use an immutable ledger model.
- Manual fulfillment, refund, reseller-state, pricing, and financial overrides must be auditable.

---

## 3. UI Non-Negotiables

### 3.1 Desktop

Desktop is a fidelity implementation.

When an equivalent exists inside `store.buildwithreys.com/`, inspect it and reproduce its visible layout language instead of redesigning it.

Preserve, where applicable:

- approximately 1320px content canvas;
- approximately 92px desktop header;
- source-like header alignment and search proportions;
- hero footprint and split geometry;
- source-like section rhythm;
- four-column full-width product grid;
- approximately 320px catalog filter sidebar;
- source-like catalog toolbar;
- desktop product-card proportions and 16:9 media treatment;
- two-column PDP geometry;
- border-first depth and restrained shadows.

The source blue accent is converted semantically to Bacshop orange. Geometry must not be changed merely to accommodate the recolor.

### 3.2 Mobile

Mobile is intentionally not the reference storefront collapsed into one column.

Use the app-like composition defined by the UI guide:

- compact top utility row;
- large rounded search;
- orange promo surface;
- horizontal category/filter shortcuts;
- dense two-column product cards;
- bottom sheets for compact selection tasks;
- inset rounded bottom navigation;
- safe-area support;
- sticky mobile purchase bar on PDP and other appropriate high-intent surfaces.

### 3.3 No AI-template redesign

Do not add generic visual filler such as:

- gradient blobs;
- floating decorative 3D cards;
- fake analytics;
- fake testimonials;
- fake awards or trust badges;
- unrelated SaaS feature sections;
- gradients on every card;
- excessive glassmorphism;
- random icon families;
- arbitrary one-off radii or shadows;
- oversized marketing copy that delays product discovery.

If a visible element does not support navigation, discovery, decision-making, transaction, status, trust, account operation, or intentional campaign branding, remove it.

---

## 4. Start-of-Task Protocol

Before writing code:

1. Fetch the latest intended remote/base branch.
2. Inspect branch, working tree, and uncommitted changes.
3. Do not delete or overwrite user work.
4. Read the relevant documentation listed in Section 1.
5. Inspect the current Bacshop implementation before proposing replacement architecture.
6. For desktop UI work, inspect the matching `store.buildwithreys.com/` HTML/CSS/assets first.
7. Identify affected roles, pricing context, states, routes, and domain modules.
8. Define a bounded implementation plan.
9. Delegate non-conflicting work to focused Luna agents.
10. Review agent output before integration.

Do not begin with broad rewrites before the repository has been audited.

---

## 5. Orchestration Rules

The orchestrator should remain the reviewer and integrator rather than becoming the only implementation agent.

Use separate focused agents when useful, for example:

- reference auditor;
- repository/architecture auditor;
- desktop shell implementation;
- mobile shell implementation;
- commerce page implementation;
- reseller/admin integration;
- tests and accessibility;
- screenshot/visual QA.

Each delegated task should contain:

- exact scope;
- files or modules allowed to change;
- source-of-truth documents;
- acceptance criteria;
- security and pricing constraints;
- expected tests/checks.

Do not ask multiple agents to rewrite the same core files concurrently unless the orchestrator has an explicit merge plan.

The orchestrator must inspect diffs and resolve architectural or visual conflicts before accepting a task.

---

## 6. Implementation Discipline

### 6.1 Prefer incremental change

Prefer targeted refactoring and reusable primitives over replacing the entire codebase.

A broad rewrite is justified only when the current structure objectively prevents required correctness or fidelity, and that reason must be documented before execution.

### 6.2 Reuse before duplication

Before adding a new primitive, search for an existing equivalent.

Prefer shared implementations for:

- page/container width;
- desktop header;
- mobile top bar;
- search field and suggestions;
- product cards with desktop/mobile variants;
- category cards;
- promo cards;
- filter sidebar;
- mobile filter sheet;
- catalog toolbar;
- bottom navigation;
- product media;
- sticky purchase bar;
- status badges;
- skeleton, empty, error, and retry states.

Desktop and mobile may use intentionally different DOM structures when forcing a single structure would reduce fidelity, accessibility, or maintainability.

### 6.3 No speculative features

Do not invent:

- new business models;
- new reseller economics;
- seller-marketplace concepts;
- unsupported fields;
- fake data visualizations;
- fake account personalization;
- new product states.

If a requirement is missing, preserve the current behavior and record the gap instead of making up product behavior.

---

## 7. Data and Server-Boundary Rules

- Resolve authorization and protected price context on the server.
- Keep secrets out of client bundles.
- Treat client validation as UX only; revalidate authoritatively on the server.
- Do not trust client-provided price, tier, role, order state, wallet balance, or permission claims.
- Preserve price snapshots on commercial transactions where required by the existing model.
- Use idempotency for externally retried payment/fulfillment operations.
- Do not mutate wallet balance without a ledger entry.
- Isolate reseller customer data per reseller.
- Never expose one reseller's customers to another reseller or to retail users.

---

## 8. Required UX States

A launch-critical component or page is incomplete if only the happy path exists.

Implement applicable states for:

- initial loading;
- partial loading;
- skeleton;
- empty data;
- no search result;
- disabled;
- active/pressed;
- keyboard focus;
- network failure;
- retry;
- expired session;
- unauthorized route;
- unavailable product/variant;
- changed price;
- payment pending;
- payment failed;
- payment expired;
- payment callback delay;
- order processing delay;
- `needs_customer_input`;
- completed/fulfilled success.

Skeleton geometry should resemble final content.

---

## 9. Testing and Verification

Run the repository's existing checks appropriate to the changed area, including where available:

- formatter;
- lint;
- typecheck;
- unit tests;
- integration tests;
- end-to-end tests;
- build.

Add or update regression coverage when changing:

- authorization gates;
- price selection;
- payment/order transitions;
- wallet logic;
- role/context navigation;
- route protection;
- critical checkout behavior.

A passing build does not replace functional verification.

---

## 10. Visual QA Protocol

Screenshot comparison is mandatory for UI work.

### Desktop

For every page with a reference equivalent:

1. Run Bacshop and the reference at identical viewport dimensions.
2. Capture screenshots.
3. Compare geometry before color.
4. Fix page width, header, hero, section offsets, grid/card dimensions, type scale, filters/toolbars, PDP proportions, radii, and borders.
5. Confirm orange mapping after geometry is correct.

Minimum checkpoints:

- 1440px desktop;
- one compact desktop/tablet width before the mobile shell switch.

### Mobile

Validate:

- approximately 390px width;
- one smaller phone width;
- bottom safe-area behavior;
- two-column card rhythm;
- bottom navigation;
- sticky purchase bar;
- no accidental horizontal overflow.

Do not accept a screen merely because the same components are present. Compare visible proportions and spacing.

---

## 11. Accessibility and Performance

Every implementation must preserve:

- semantic HTML;
- keyboard access on desktop;
- visible focus;
- accessible names for icon-only controls;
- touch targets around 44px minimum for primary mobile controls;
- status meaning that is not color-only;
- understandable field/error messages;
- meaningful image alt text;
- reduced-motion behavior;
- safe-area-aware fixed mobile controls.

Performance is part of quality:

- reserve image dimensions to reduce layout shift;
- use optimized responsive media;
- lazy-load non-critical assets;
- avoid unnecessary client-only state resolution;
- keep blur and large shadow effects restrained;
- do not ship copied compiled reference-site runtime code.

---

## 12. Git Rules

Before committing:

- inspect the diff;
- remove accidental generated files or secrets;
- confirm tests and visual QA for the completed phase;
- do not include unrelated user changes in the commit.

Use professional conventional-style commits, for example:

- `feat: port desktop storefront visual system`
- `feat: rebuild mobile commerce shell`
- `feat: align product detail responsive layouts`
- `fix: preserve reseller pricing isolation in storefront`
- `refactor: centralize bacshop design tokens`
- `test: add responsive commerce regression coverage`
- `docs: align architecture and design system`

If repository policy allows direct push to `main`, push only after the phase passes its acceptance checks. If protection rules require a pull request, follow repository policy rather than bypassing it.

---

## 13. Definition of Done

A phase is done only when all applicable statements are true:

- product behavior still matches the PRD;
- protected data and reseller prices remain server-authorized;
- desktop equivalents visually track the supplied reference;
- mobile uses the dedicated app-like composition;
- orange design tokens are used consistently;
- Guest/Customer/Reseller/Admin contexts are correct;
- loading, empty, failure, disabled, retry, and recovery states are present;
- responsive variants are complete;
- accessibility checks are acceptable;
- tests/build/typecheck/lint pass as applicable;
- screenshot-based visual QA has been performed;
- remaining deviations are required by Bacshop behavior or explicitly documented;
- no production integration or secret was copied from the reference storefront.

Never report a phase complete while known acceptance failures remain.

---

## 14. Escalation Rules

Stop and surface the issue instead of guessing when:

- the PRD and implementation appear to disagree on security or pricing behavior;
- a requested UI would expose protected data;
- payment/order transitions cannot be made idempotent or transactionally safe;
- a migration could destroy existing production data;
- an existing user change would be overwritten;
- the required reference asset/page cannot be located;
- a business rule is genuinely unspecified and cannot be derived from current project sources.

For visual ambiguity, inspect the reference first. For product ambiguity, defer to the PRD. For security ambiguity, choose the safer server-authoritative boundary and report the discrepancy.
