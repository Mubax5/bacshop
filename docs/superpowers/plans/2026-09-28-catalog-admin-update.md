# Catalog and Admin Implementation Plan

Spec: `docs/2026-09-28-catalog-admin-design.md`

1. **Catalog and local server:** move the current sample products into `data/products.json`; serve the static storefront and a versioned catalog API with Node built-ins; keep private admin state outside the static root.
2. **Admin authentication:** implement one-time first setup, salted password hashing, loopback-only serving, HttpOnly SameSite sessions, origin checks, login throttling, logout, and authenticated product update endpoints.
3. **Admin product editor:** replace the fake admin preview with authenticated product forms that edit every SKU and persist product content, retail price, ranking fields, order mode, and stock confirmation.
4. **Preorder path:** render a Telegram contact and block cart addition until admin confirms stock; permit purchase after confirmation; reject stale preorder items at cart entry.
5. **Catalog filters:** replace duplicate category chips and inline sorting with an advanced filter dialog; preserve search, category, price range, sorting, and active filter state in the URL.
6. **Navigation and public pages:** remove the two screenshot navigation bars, move Help to a Telegram footer contact, redesign the reseller program, implement the standalone not-found state, make the footer a bottom-aligned card, and revise desktop/mobile carousel geometry.
7. **Review:** inspect fresh setup and login, API authorization, saved product edits, preorder states, advanced filtering, all public routes, responsive screenshots, and the running server output.

Implementation stays in `C:\Downloaded Web Sites\www.tokopedia.com\bacshop-redesign`; there are no external package installs and no tests are added or run.
