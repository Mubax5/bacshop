# Phase 2 — Durable identity and admin security

Date: 2026-10-02. Candidate runtime only; the approved legacy storefront on 4173 is still the live migration reference.

## Implemented boundaries

- PostgreSQL users, password identities, verification/reset tokens, sessions, role assignments, encrypted MFA factors and hashed recovery codes.
- Passwords use versioned scrypt with a random salt. New passwords require 10 characters and at most 1024 UTF-8 bytes. Login can verify an existing shorter credential; imported legacy hashes require the separate import compatibility work.
- Customer registration/login/logout, profile, password change/reset, verification/resend and session listing/revocation have server routes and account forms.
- Opaque session tokens are stored only as SHA-256 digests. Password reset/change revoke existing sessions and invalidate outstanding reset tokens. Verification invalidates outstanding verification tokens.
- Customer and admin session kinds and cookies are separate. Production cookies use `__Host-`, HttpOnly, Secure and SameSite=Lax. An admin password grants a ten-minute MFA challenge session, not privileged access. Successful MFA rotates it into an eight-hour session by default.
- TOTP secrets use AES-256-GCM with the account ID as authenticated data. Used TOTP counters and recovery codes cannot be replayed. Factor or role revocation is checked on every session resolution.
- Five server roles: Super Admin, Operations, Finance, Content, Customer Support. Pricing, reseller-state and balance mutations require a recent password plus MFA confirmation. Additional operational permissions are introduced with their corresponding later-phase workflows.
- Signed CSRF tokens are forwarded by middleware to the first server render. Auth/account/admin/cart/checkout/reseller browser mutation forms submit them and validate the exact configured Origin. Provider callbacks are exempt from browser CSRF and retain their provider verification boundary.
- Authentication rate limits use atomic PostgreSQL windows, independent client and account buckets, and HMAC keys. MFA/account actions resolve their session to a stable user ID for the account bucket. Bucket expiry uses database time.
- SMTP delivery is optional and configured only server-side. Disabled/unavailable delivery produces an honest unavailable state. Required email verification requires enabled SMTP configuration; pending users cannot authenticate before verification.

## Admin bootstrap

Apply migrations, set database runtime and configured session/MFA keys in a private environment, then temporarily set:

```dotenv
ADMIN_BOOTSTRAP_EMAIL=<initial-admin-email>
ADMIN_BOOTSTRAP_PASSWORD=<new-password-at-least-10-characters>
ADMIN_BOOTSTRAP_DISPLAY_NAME=<display-name>
```

Run `npm run admin:bootstrap`. The command closes its database connection and prints no credentials. It is permanently closed once any admin role assignment has existed, including a subsequently revoked or disabled administrator. It does not reset existing accounts. Remove bootstrap password configuration afterwards.

Open `/auth/sign-in?returnTo=%2Fadmin`; enroll an authenticator and store the recovery codes shown once. A verified admin session is required for operational routes. Save recovery codes privately; only their hashes remain in the database. If both the authenticator and recovery codes are lost, ordinary login cannot bypass MFA. An audited operator recovery workflow belongs to the later admin-management phase.

## Environment and deployment

`SESSION_SECRET` and `MFA_ENCRYPTION_KEY` each require at least 32 random bytes encoded as hexadecimal or base64, including in database development mode. Preserve the MFA key with protected backups; losing or replacing it makes existing factors unreadable.

`APP_ORIGIN` is the actual public origin. `TRUSTED_ORIGINS` is an exact comma-separated origin allowlist. Production requires HTTPS. Redirects use the validated configured origin. Next middleware URL normalization is disabled to preserve the origin and host-only cookies on local loopback development.

`TRUST_PROXY=false` ignores forwarded client headers and uses a conservative shared unknown-client bucket. With a real reverse proxy, configure `TRUST_PROXY=true` only when the application cannot be reached directly and the proxy strips/replaces untrusted forwarding headers. Do not expose a trusted-proxy application directly to the internet.

`ADMIN_SESSION_TTL_SECONDS` defaults to 28800; `ADMIN_REAUTH_TTL_SECONDS` defaults to 300. SMTP variables and auth settings are listed in `.env.example`. SMTP uses TLS/STARTTLS and bounded timeouts.

## Migration

`20261001020000_identity_security` is additive: separate session kinds, MFA/reauthentication timestamps, revocation reasons, TOTP replay counters, active grant/factor/password uniqueness, and grant-actor foreign keys. Readiness now requires this migration to be applied. Earlier migrations are unchanged.

## Acceptance evidence

- Unit: 19 files, 85 tests passed.
- PostgreSQL: 4 integration files, 23 tests passed. Includes concurrent TOTP acceptance, reset/recovery replay, role/factor revocation, session ownership and an actual bootstrap CLI rehearsal against a newly created disposable database.
- Browser: 8 tests passed on 1440×900 and 390×844 Chromium. Registration/profile/session revocation/password change/logout, signed first-render CSRF and forged Origin rejection, guest admin denial, mandatory MFA, recovery display and Content-role financial denial.
- Candidate registration screenshots were inspected on both viewports. The existing Next visual composition has not yet achieved parity with the approved legacy storefront; that remains the explicit Phase 3 gate.
- Lint: zero errors, five previously recorded unused-variable warnings. TypeScript checking and production build passed; the build generated 60 route entries. Production dependency audit found zero vulnerabilities.

## Remaining migration gates

Admin operational data, checkout/payment and reseller purchase/top-up are not yet durable end-to-end workflows in this candidate. Database runtime refuses the old development financial/admin mutation stores instead of reporting fake success. These are completed by their planned commerce/reseller/admin phases. Catalog/storefront parity, customer post-purchase data, data import, object storage, provider payment acceptance, backup/restore rehearsal and production deployment are still required before cutover.

CI runs install, migrations, lint, typecheck, unit, real PostgreSQL integration, build and browser tests. Its database is disposable and contains no production credentials. Browser traces/automatic screenshots are disabled because MFA pages contain transient security material. Only blank registration screenshots are captured locally. Integration fixtures remain in the integration database until it is discarded; only test rate-limit buckets are reset before a single-worker browser run. Bootstrap testing creates and drops only its own randomly named database and requires CREATEDB privileges in the isolated test environment.

Browser-run preparation warms the default landing route before tests and checks actual database readiness separately. A cold Next development compile previously caused one navigation assertion to fail while the session had already been created; the focused rerun passed. Browser assertions are retained without retries.

## CI concurrency correction

The first GitHub run (36941128918) passed install, migrations, lint, typecheck and unit checks, then found a PostgreSQL serialization conflict during simultaneous MFA requests. Prisma raw queries exposed SQLSTATE 40001 inside P2010 driver-adapter metadata. The transaction boundary now recognizes this exact nested code as well as 40P01 deadlocks; validation, uniqueness and arbitrary raw-query errors remain non-retryable. A regression test exercises the observed wrapper and bounded retry. Local acceptance after the correction: 86 unit tests and 23 PostgreSQL tests passed. The correction receives a separate commit and a new CI run; the first failed run is retained as evidence.
