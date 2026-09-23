# Desktop Reference Audit

Audit date: 2026-09-23

The requested `store.buildwithreys.com/` directory is not present in this workspace. The public reference is reachable read-only at [store.buildwithreys.com](https://store.buildwithreys.com/), so the initial visual audit used its rendered DOM and linked stylesheets without importing runtime code or configuration.

## Observed reference surfaces

- `/` — hero/search, popular products, category cards, trust block, compact footer.
- `/shop` — search-led catalog and product grid.
- `/categories` — category discovery page.
- `/products/<slug>` — product detail surface.
- `/cart`, `/orders`, `/account` — authenticated-entry states when unauthenticated.

## Observed desktop-source inputs

The rendered storefront links these CSS resources:

- `/_next/static/css/710253ed18be27b0.css`
- `/_next/static/css/0cc2f29bacc16a78.css`
- `/_next/static/css/16c2f265ed036394.css`
- `/_next/static/css/76bc6c6349b680a8.css`

The primary stylesheet exposes the source palette as navy/blue/sky/mint/green/orange/violet/paper/surface/line/muted/shadow tokens. Bacshop must translate brand-intent blue tokens to the documented orange system while retaining semantic success/warning/danger meaning.

## Visible structure mapped to Bacshop

The reference header exposes logo, cart preview, account entry, and mobile menu/navigation. The home surface starts with a commerce-oriented heading, supporting copy, search control, CTA, and trust cues, followed by popular products, category shortcuts, a contained trust section, and a compact footer with shopping/account/help/community links. Product cards expose product identity, category, short description, retail price, availability, sold count, and add/disabled state. Unauthenticated cart/orders/account routes present a login gate instead of an empty authenticated shell.

## Safety boundary

Only visible structure, page inventory, and style tokens are used as reference evidence. No reference API endpoint, credential, auth configuration, analytics identifier, user/session data, or compiled runtime is copied into Bacshop.
