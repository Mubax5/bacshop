# Task 2 mobile touch target fix

## Change

- Increased the mobile `.quick-filter` and `.product-card__action` minimum heights to 44px in `app/globals.css`.
- Kept the existing mobile `.product-grid` two-column layout unchanged.
- Added a focused stylesheet regression assertion for both minimum heights and the two-column grid in `src/public-commerce.test.ts`.

## Verification

- Focused public commerce tests: 6 passed.
- Full test suite: 13 passed.
- Lint: passed.
- `git diff --check`: passed (Git emitted line-ending normalization warnings).
- Typecheck overlapped Next.js build regeneration and reported temporarily missing `.next/types` files; it was not rerun.
- Production build was stopped at the user's request while finalizing traces; no build result is claimed.

## Scope

Only the mobile hit-area sizes and their regression assertion changed. Authentication and other surfaces were not changed.
