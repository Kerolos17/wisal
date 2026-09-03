# Restore drill — 3 September 2026

## Scope

This drill created a short-lived, isolated Lakebase Postgres branch from the
Wisal production default branch. It used read-only schema and aggregate queries
only: no source data was changed and no personal, invitation, receipt, or
payment values were displayed.

## Evidence

- The branch reached `ready` state after creation and was derived from the
  production parent at the recorded branch point.
- The restored schema includes the application, invitation, guest, payment,
  media, and managed-auth tables required by the current release.
- Exact aggregate checks confirmed data in the core domains. Foreign-key checks
  found zero orphan events, invitations, guests, and payment requests.
- The branch was created with an expiry and then removed after verification.

## Outcome

The current production branch can be cloned into an isolated verification
environment and its core relationships remain intact. This is restore evidence,
not a substitute for a longer retention window, a named incident owner, or a
scheduled quarterly drill.

## Remaining operational controls

- Approve business RPO and RTO targets.
- Name the incident and restore owner.
- Schedule and retain evidence for a quarterly restore drill.
- Keep production credentials and branch connection strings out of source
  control and launch records.
