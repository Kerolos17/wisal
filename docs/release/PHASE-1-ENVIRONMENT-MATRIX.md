# Phase 1 environment matrix

This matrix records configuration status only. It must never contain secret
values, connection strings, tokens, or copied provider output.

Run `npm run env:check` in the intended deployment environment to validate the
Production contract. The command reports only whether each key is configured
and validates formats without printing values. For local checks, run
`node --env-file=.env scripts/check-environment.mjs --target=local`.

| Variable | Local | Preview | Production | Purpose / acceptance rule |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Configured and local contract checked | Not externally verified | Not externally verified | Neon Postgres URL for the intended environment; production and test URLs must differ |
| `WISAL_AUTH_PROVIDER` | Not configured | Required: `neon` | Required: `neon` | Selects Neon Auth for the Vercel application |
| `NEON_AUTH_BASE_URL` | Not configured | Required | Required | Must belong to the matching Neon branch and trusted origin |
| `NEON_AUTH_COOKIE_SECRET` | Not configured | Required | Required | Server-only random secret, minimum 32 characters, unique per trust boundary |
| `PLATFORM_OWNER_EMAIL` | Not configured | Required before admin acceptance | Required | Canonical owner account; never place the real address in source control |
| `NEXT_PUBLIC_SITE_URL` | Optional; safe fallback exists | `https://wisal-self.vercel.app` until a custom Preview domain is adopted | Not externally verified; currently served aliases are Vercel-owned | Must be an HTTPS origin with no path; it drives metadata, canonical, robots, and sitemap |
| `PAYMENT_TEST_MODE` | Disabled by default | Disabled | Disabled | Opt-in guard for database-mutating payment tests only |
| `PAYMENT_TEST_DATABASE_URL` | Not configured | Not applicable | Must never be configured | Isolated disposable database only; must not equal `DATABASE_URL` |

## Environment gates

### Local

- The app can build and run without exposing any environment value.
- Authentication is not accepted as verified until the three Neon Auth settings
  are configured in a local-only file.
- Database writes must target a disposable branch during migration and payment tests.

### Preview

- Configure the required variables in Vercel Preview scope.
- Add the exact Preview origin to Neon Auth trusted origins.
- Verify email sign-up, sign-in, Google sign-in if enabled at the provider,
  password reset, callback, safe `returnTo`, expired session, and sign-out.
- Verify `/api/health` returns 200 and `/api/platform-content` returns public data
  without SQL, parameters, stack traces, or provider details.

### Production

- Copy no secret from Preview unless it is intentionally shared by policy.
- Confirm `NEXT_PUBLIC_SITE_URL` before build because public variables are frozen
  into the Vercel build output.
- Apply only migrations already proven on an isolated Neon branch.
- Run the production smoke checks after deployment and record date, deployment,
  and operator in the release evidence.

Preview and Production remain unverified because this workspace does not provide
authenticated access to their Vercel or Neon configuration. Their rows are
release gates, not assumptions.

## Evidence update — 2 September 2026

- The local non-secret environment contract passed: `DATABASE_URL` is configured
  and format-checked. No value was printed.
- Vercel reports the `wisal` production deployment as `READY`, sourced from
  GitHub `Kerolos17/wisal` branch `main` at commit `658267e`.
- The production aliases are `wisal-self.vercel.app`,
  `wisal-kerolos17s-projects.vercel.app`, and
  `wisal-git-main-kerolos17s-projects.vercel.app`. They are Vercel-owned
  hostnames; no custom final domain is connected yet.
- Vercel project inspection does not expose environment-variable values or
  scopes through the available read-only interface. Before a custom-domain cutover,
  an owner must confirm the Production and Preview scopes for all required rows
  above, including distinct database targets and matching Neon Auth trusted origins.

This establishes the current baseline for TASK-006. It does not complete the
final-domain cutover or authorize public paid launch.
