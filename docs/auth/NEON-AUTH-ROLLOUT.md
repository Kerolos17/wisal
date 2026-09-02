# Neon Auth rollout

## Current decision

Neon Auth is integrated behind `WISAL_AUTH_PROVIDER=neon`. Without that flag, the existing ChatGPT Sites identity flow remains active. This makes activation reversible and keeps the current production login working until the isolated branch is verified.

## Required runtime variables

- `WISAL_AUTH_PROVIDER=neon`
- `NEON_AUTH_BASE_URL` — the Auth URL for the intended Neon branch.
- `NEON_AUTH_COOKIE_SECRET` — a production secret of at least 32 characters.

Never commit the cookie secret or copy a development value into production.

## Verification gate

1. Use the isolated Neon development branch.
2. Add the checkpoint domain as a trusted origin in Neon Auth.
3. Verify email sign-up, sign-in, sign-out, expired session handling, and safe `returnTo` redirects.
4. Verify Arabic/English layout and mobile keyboard behavior.
5. Confirm account creation maps the Neon email to the existing Wisal account table.
6. Only after approval, repeat the configuration on the production branch and deploy a new saved Sites version.

## Production path evidence — 2 September 2026

- The production sign-in, sign-up, and password-recovery routes each returned
  HTTP 200 with `Cache-Control: private, no-store`. Because these routes render
  the Neon Auth forms only when `WISAL_AUTH_PROVIDER=neon`, this is runtime
  evidence that the production application is serving the Neon Auth path.
- A callback request with a protocol-relative `returnTo` value returned a 307
  redirect to the Wisal root, proving the live safe-return guard rejects an
  external destination.
- The source-contract suites for authentication and production readiness passed
  14/14. They cover secret-backed activation, safe return paths, bilingual
  email/Google UI, and non-disclosure of server failures.
- Still required: controlled test-account signup/sign-in/sign-out, inbox proof
  for recovery delivery to major providers, expired-session/revocation checks,
  and mobile Arabic/English interaction. Do not treat an HTTP-only probe as
  proof of those user journeys.

## Rollback

Set `WISAL_AUTH_PROVIDER` back to `chatgpt` or remove it, then deploy a new environment revision. The platform returns to the existing Sites identity flow without a database migration.
