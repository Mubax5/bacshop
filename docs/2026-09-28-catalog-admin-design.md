# Catalog, Admin, and Storefront Update

## Intent and constraints

Continue the from-scratch Bacshop app in this directory. The local Tokopedia archive and the user's supplied Tokopedia HTML remain the only interface references. Use the supplied PRD only to clarify product behavior. Do not read or reuse the separate Bacshop implementation. Keep product photography as empty placeholders.

## Storefront

- Remove both secondary desktop navigation rows shown in the attached screenshots. Remove Help from mobile navigation and provide a Telegram contact in the footer.
- Replace category chips and the duplicate inline sort select with one Feather Filter button. A dialog contains category selection on mobile, min/max retail price, and one sort choice: relevant, lowest price, highest price, best selling, newest, and highest rated. Keep state in the URL and preserve search/category state.
- Make the full banner surface one empty placeholder with overlaid copy only on desktop's primary slide. Mobile shows the same banner ratio and no copy. Secondary slides remain image-only. Circle previous/next buttons straddle the banner's left and right edges at its vertical midpoint.
- Present the reseller program as a short explanation and direct contact/application steps. Make unknown routes a standalone page with only a heading, a return sentence, and a home CTA.
- On desktop, make the footer a dark card with rounded top corners and a square bottom edge; on short pages it sits at the viewport bottom. Put help and `@Mubacs` contact there. On phones, omit the footer entirely, keep search pinned at the top, dock primary tabs edge-to-edge above the safe area, and expose support from the FAQ page.

## Product availability

Each product has `orderMode` (`ready` or `preorder`) and `preOrderConfirmed`. A preorder with unconfirmed stock cannot be added to the cart and exposes a direct Telegram contact. The admin marks stock confirmed after checking it with the customer; only then does the normal purchase action appear. Enforce this rule in both the UI and cart state handling.

## Admin authentication and editing

- Replace the read-only admin role preview with a local admin area backed by a small Node HTTP server.
- First run uses a random one-time setup code printed only to the local server console. The admin creates one account; the password is stored as a salted scrypt hash. Later access requires login.
- Bind the server to `127.0.0.1` by default. Use HttpOnly, SameSite=Strict, short-lived in-memory sessions. Protect all admin endpoints server-side, check request Origin for writes, limit login attempts, and never expose the private data directory through static serving.
- Store the sample catalog as JSON outside the public asset path. Admin can edit each SKU's public details, price, terms, sort metadata, order mode, and preorder stock confirmation. Persist updates atomically and return refreshed data to the storefront.
- This iteration authenticates one local admin account. It does not add customer/reseller accounts, payments, or remote deployment.

## Verification evidence

Manually verify the screenshot-derived nav removal, mobile and desktop filter controls, filter combinations and URL state, three carousel requirements, contact links, clean 404 route, first-run setup/login/logout, unauthorized API rejection, authenticated edit persistence, preorder block and confirmed-stock purchase, and responsive overflow. Do not add or run tests unless requested.
