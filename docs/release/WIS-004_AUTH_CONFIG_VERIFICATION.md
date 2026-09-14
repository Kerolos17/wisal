# WIS-004 — Auth configuration verification

**Date:** 14 September 2026  
**Scope:** non-secret production and Preview configuration evidence  
**Status:** partial — Preview/Production separation remains a P0 release gate

## Dedicated Preview boundary — 14 September 2026

- A stable, branch-scoped Preview deployment now uses a dedicated non-production
  Neon branch and a separately provisioned Neon Auth instance. Its trusted-origin
  allowlist contains only the stable Preview origin used for this verification.
- Branch-only Vercel overrides now exist for the database, Auth provider and base
  URL, cookie secret, and canonical site URL. Production settings were not
  changed. The database credential was rotated during setup and is not recorded
  here.
- Deployment `dpl_DMmHjHfH7wE6xuUjBmRTLZfWj4vp` was READY. Read-only smoke checks
  passed: health endpoint returned `200` with application/database `ok`; sign-in
  rendered; the canonical URL matched the stable Preview origin; and a hostile
  callback `returnTo` value stayed local.
- This is evidence for the named stable Preview branch only. The generic
  Production/Preview entries listed below still exist for other Preview branches,
  so the global Preview/Production separation acceptance criterion remains open.

## Safe verification procedure

This procedure reports configuration names, scopes, and non-secret Auth metadata
only. It must never print, download, commit, or paste environment-variable values,
connection strings, cookie secrets, OAuth client secrets, account emails, or tokens.

1. In an empty temporary directory, link the Vercel CLI to the `wisal` project and
   run `vercel env ls --scope kerolos17s-projects`. Record only variable names and
   target scopes.
2. Run `npm run env:check` only inside the intended deployment environment. The
   checker reports configured/missing state and format errors without values.
3. In Neon, inspect the production branch's Auth configuration, trusted domains,
   and OAuth provider list. Record domains and provider type only; do not export
   credentials.
4. Run the read-only public auth smoke suite against the approved production
   hostname. Do not submit credentials, create accounts, or mutate production data.

## Evidence collected

- Vercel lists all required keys for Production: `DATABASE_URL`,
  `WISAL_AUTH_PROVIDER`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`,
  `PLATFORM_OWNER_EMAIL`, and `NEXT_PUBLIC_SITE_URL`. The production Sentry DSN
  is also configured.
- Neon production Auth is active with email/password support and the shared Google
  provider. The approved production hostname is a trusted origin.
- The current trusted-origin list also contains the legacy checkpoint hostname and
  one explicitly named Preview deployment. It is not evidence that arbitrary new
  Preview deployments are trusted.
- Vercel currently reports single configuration entries scoped to both Production
  and Preview for `DATABASE_URL`, `WISAL_AUTH_PROVIDER`, `NEON_AUTH_BASE_URL`,
  and `NEON_AUTH_COOKIE_SECRET`. Those scopes do not demonstrate separate trust
  boundaries and therefore do not meet the WIS-004 acceptance criterion.

## Required remediation before closure

1. Establish a durable non-production Neon branch/project for Preview that contains
   only approved test data and has a documented expiry/cleanup owner.
2. Configure Preview-only `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and a unique
   `NEON_AUTH_COOKIE_SECRET`; retain distinct Production values. Do not copy a
   production connection string or cookie secret into Preview.
3. Add the exact stable Preview origin(s) to that Preview Auth configuration. Do
   not use production trusted origins as a substitute for Preview verification.
4. Verify Preview sign-up, sign-in, sign-out, reset delivery, safe callback,
   expired session, and Arabic/English mobile rendering using disposable accounts.
5. Re-run this procedure and record only pass/fail evidence, deployment ID, date,
   and operator.

## Rollback

If a Preview configuration change blocks authentication, restore only the prior
Preview-scoped configuration and trusted-origin entry. Do not change Production
variables or production Auth configuration as part of Preview rollback.
