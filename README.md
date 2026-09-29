# Bacshop — frontend storefront

This app is built from scratch in the Tokopedia workspace and does not load Tokopedia production scripts or use the separate Bacshop project. Tokopedia files are the only interface reference.

## Open locally

Install Node.js, then run `node server.js` from this directory. Open the local URL printed by the server. The server binds to `127.0.0.1`; it serves the sample catalog and stores catalog edits locally.

On first startup, the server prints a one-time setup code. Open `/#/admin`, enter that code, and create an admin email and password (at least 12 characters). The code expires when the server stops. Admin credentials and sessions stay on this computer; stop and restart the server to end all sessions. Do not expose the local server to a network.

## What is included

- Public storefront with search, categories, product details, retail-only cart, promotions, reseller-program information, help, and FAQ.
- Customer preview with orders, fulfillment and activation states, input-recovery example, entitlements, support, retail browsing, and reseller-application status.
- Separate reseller preview with example-only prices, buy-for-customer, orders, customer expiry, and balance/ledger screens.
- Authenticated admin area for editing every catalog product, including price, product details, search ordering values, pre-order state, and stock confirmation.
- Responsive manual and automatic homepage carousel. Desktop's first slide carries the storefront message; mobile and remaining slides are empty image placeholders.
- Advanced category, price range, and sorting filters. Pre-order items link to Telegram and stay out of the cart until stock is confirmed by admin.
- Mobile storefront uses a sticky search header and full-width, safe-area-aware tab navigation. The site footer is hidden on phones, with support linked from the FAQ page instead.
- Empty image placeholders for future banner, category, and product photography, with a text-only Bacshop name.
- Local Plus Jakarta Sans font and selected Feather icons. Font license is in `assets/fonts/OFL.txt`; Feather icons are MIT licensed.

Customer and reseller routes remain sample previews selected from the sign-in screen. Checkout and customer authentication are not connected. Only the admin area has authentication and persistent product editing; no orders, payments, fulfillment, or customer records are processed.

Admin state is stored in `.bacshop-private/`, outside the server's static file allow-list. Keep that directory private. Product changes are stored in `data/products.json`.

The new app is authored independently. The Tokopedia archive and supplied Tokopedia HTML are the only visual/code references. The user-provided Bacshop PRD is used only as a product-behavior brief. Plus Jakarta Sans and Feather are included as explicitly requested design assets.
