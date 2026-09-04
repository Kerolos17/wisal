# Production health monitor runbook

## What runs

The `Production health monitor` GitHub Actions workflow runs every 15 minutes
and can also be dispatched manually. It reads the public health endpoint and
fails when the application or database does not return the expected healthy
contract within 15 seconds.

The check sends no credentials and logs no response body, customer data, or
configuration values.

## Initial response

1. Open the failed workflow run and note its timestamp and HTTP status only.
2. Check the current Vercel deployment state and `/api/health` once manually.
3. If the database is unavailable, pause paid acquisition and avoid retries
   that could duplicate a payment decision.
4. If service recovery requires a rollback, use the previously ready Vercel
   deployment; do not change database state as part of a frontend rollback.
5. Record the incident, affected interval, decision, and recovery result in
   the launch record without copying request URLs, receipt details, or PII.

## Remaining setup

- Assign a named on-call owner and confirm GitHub failure notifications reach
  that person.
- Add error aggregation, route-level latency/error dashboards, and alerts for
  auth, RSVP, invitation resolution, and payment transitions.
- Set and approve SLO/error-budget thresholds, then run and acknowledge one
  synthetic alert.
