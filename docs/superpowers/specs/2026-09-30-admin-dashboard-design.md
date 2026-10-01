# Admin Dashboard UI Design

## Intent

Polish Bacshop's existing admin area into a clear operational dashboard. Keep the storefront's current visual language, improve spacing and page hierarchy, add an expandable/collapsible sidebar, and reuse the existing storefront product card for admin catalog rows. The user explicitly deferred payment work; this design does not change payment behavior or code.

## Current implementation

- Admin routes are `/admin`, `/admin/produk`, `/admin/produk/:id`, `/admin/konten`, and `/admin/pesanan`.
- `renderAdminPage()` authenticates the admin and loads products, storefront content, and orders from existing protected API endpoints.
- Navigation currently uses `adminTabs()` (horizontal tabs) inside a top header.
- The storefront catalog uses `productCard(product)` and `.product-card` styles. Admin catalog markup is separate in `productEditor(product)` with `.admin-product-card` styles.
- Product create/edit uses `productFields()` and existing submit handlers; CMS and order management already persist through the server.

## Design

### Admin shell and navigation

- Replace the horizontal admin tabs with a dashboard shell: a left sidebar and a main workspace.
- Desktop sidebar has expanded and compact states. Expanded mode shows Bacshop branding, icon plus label navigation, and a visible collapse control. Compact mode keeps icon targets accessible and shows descriptive tooltips. The chosen state is kept in local browser storage across admin routes and reloads.
- Sidebar destinations are Ringkasan, Produk, Konten toko, and Pesanan. Active route styling must remain clear in either width.
- The workspace header shows the current page title, a link back to the storefront, the signed-in admin identity, and the existing logout action.
- On narrow viewports, the sidebar becomes a drawer opened by a menu button. It closes after route selection, overlay click, or Escape; focus and `aria-expanded` stay synchronized.

### Product component reuse

- Extend the existing `productCard(product)` renderer with a small presentation option for storefront or admin use; do not create a second base product-card renderer.
- Both modes share the product image/placeholder, category, name, and retail-price presentation. Preserve storefront actions and availability behavior in storefront mode.
- Admin mode adds only admin-specific controls: selection, archived/stock status, reseller price when configured, stock summary, and a Kelola link. Admin mode must not expose add-to-cart behavior.
- Keep `productFields()` as the single create/edit form so existing validation, upload, CRUD endpoints, archive, and bulk-action behavior continue working.

### Page polish and motion

- Apply one spacing scale to the dashboard header, page headings, toolbars, content sections, cards, and forms. Give content a wider responsive workspace and make each page's primary action easy to locate.
- Ringkasan remains operational and data-backed: existing product and order counts plus the real pending-order list. Do not add invented sales, customer, or revenue figures.
- Product, CMS, and order pages keep their current capabilities and data flow while adopting the new shell, consistent card surfaces, and clearer grouping.
- Use short, restrained transitions for sidebar width, active navigation, hover/focus, and page entry. Respect `prefers-reduced-motion`; no dependency or animation library is added.

## Boundaries and compatibility

- Preserve admin authentication, protected API routes, product data shape, image-upload handling, CMS persistence, and order fulfillment actions.
- Do not edit payment API behavior, QRIS handling, environment variables, storefront navigation, or customer/reseller layouts as part of this task.
- Use the existing Feather icon helper and CSS design tokens. No new external dependency is needed.

## Acceptance criteria

1. Admin can expand and collapse the desktop sidebar; the choice persists when changing admin route and reloading.
2. Active navigation, page title, storefront shortcut, admin identity, and logout are visible and usable in expanded and compact states.
3. On mobile, the menu opens as a drawer and can be closed by selecting a route, tapping the backdrop, or pressing Escape; the admin content has no horizontal overflow.
4. Storefront and admin product cards share the existing product-card renderer and core presentation. Storefront cart behavior remains unchanged; admin cards expose management controls and never add to cart.
5. Product create/edit, upload, archive/bulk actions, CMS save, order view, and fulfillment update remain wired to their existing endpoints.
6. Spacing, typography, card surfaces, and motion feel consistent across Ringkasan, Produk, Konten toko, and Pesanan, with reduced-motion support.
7. No payment-related files or behavior are changed.

## Verification approach

Review the admin screens in the running preview at desktop and mobile widths, including compact/expanded navigation, drawer dismissal, catalog cards, product editor, CMS, and orders. Confirm the existing admin actions still use their current API handlers. Do not add or run automated tests unless the user asks.
