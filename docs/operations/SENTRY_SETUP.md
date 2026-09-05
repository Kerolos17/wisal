# Sentry production error monitoring

## Purpose and scope

Sentry is the error aggregation service for Wisal production. It collects
unhandled browser and server errors only when a DSN is configured. Performance
tracing and session replay are deliberately disabled for this launch baseline.

The integration sends no default PII and strips request cookies, headers,
request bodies, query strings, user profiles, and breadcrumbs before an event
is delivered. Do not add invitation data, RSVP answers, payment references,
email addresses, or phone numbers to error messages or Sentry tags.

## One-time owner setup

1. Create a Sentry project for **Next.js** in the production organization.
2. In Vercel Production environment variables, add `NEXT_PUBLIC_SENTRY_DSN`
   using the DSN supplied by that project. This value is public by design, but
   must still be entered in Vercel rather than committed to this repository.
3. Add the same `NEXT_PUBLIC_SENTRY_DSN` to Vercel **Preview** only, then add
   a unique `SENTRY_SMOKE_TEST_TOKEN` to Preview only. Never set this token in
   Production.
4. Redeploy Preview and make one authenticated `POST` request to
   `/api/ops/sentry-smoke` with `Authorization: Bearer <SENTRY_SMOKE_TEST_TOKEN>`.
   The route is deliberately unavailable outside Vercel Preview and reports a
   single synthetic error without customer data.
5. Verify the issue and alert arrive, then resolve the synthetic issue in
   Sentry. Do not run this check against production.
6. Optionally add the server-only `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
   `SENTRY_PROJECT` variables in Vercel to upload source maps. Create a token
   with the narrowest release/upload permissions and never copy it into code,
   chat, or documentation.
7. Create an alert for a new unresolved production issue and direct it to the
   same owner who receives GitHub Actions failures. Acknowledge one synthetic
   alert and record the result in the launch record.

## Alert and retention policy

- Severity: alert immediately for a new production issue; investigate repeated
  errors or customer-facing failures as an incident.
- Owner: the primary GitHub account is the sole initial responder.
- Data policy: retain only Sentry's minimum default event data; do not enable
  replay, user profiling, or tracing until a separate privacy review approves
  them.
- Review: reassess alert volume and retention before widening beta access.
