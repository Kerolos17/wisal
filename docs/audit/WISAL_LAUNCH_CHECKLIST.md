# Wisal Launch Checklist

Completion of every P0 and P1 item is required for a real-user launch.

## Environment and deployment

- [ ] Set and verify production `DATABASE_URL`, Neon Auth URL, 32+ char cookie secret, platform-owner email, canonical site URL and Sentry DSN in Vercel; do not print values in CI/logs.
- [x] Record a non-secret Vercel/Neon configuration inventory and production trusted-origin/provider evidence; see `docs/release/WIS-004_AUTH_CONFIG_VERIFICATION.md` (14 September 2026).
- [x] Verify a stable isolated Preview branch: dedicated database/Auth boundary, health, sign-in rendering, canonical origin and hostile-callback safety; see `docs/release/WIS-004_AUTH_CONFIG_VERIFICATION.md` (14 September 2026).
- [ ] Verify production and preview use separate auth callback allowlists, secrets and databases where appropriate.
- [ ] Run `npm ci`, tests, lint, `tsc --noEmit`, build, migration checksum verification and environment checker in CI against Node 22.
- [ ] Confirm Vercel production is built from the approved commit and domain/canonical URL are correct.
- [ ] Confirm `/api/health` reports application and database healthy from an external monitor; alert a named owner on failure.
- [ ] Enable Neon backups/PITR, record RPO/RTO, and perform a restore drill against non-production.

## Authentication and authorization

- [ ] Test email signup, verification policy, sign-in, sign-out, password reset email and reset completion.
- [ ] Test Google new-account sign-in, password-account → Google behavior, Google-account → password behavior, expired/invalid OAuth state and revoked consent.
- [ ] Implement and verify the WIS-001 recovery/linking decision; no duplicate account or automatic unsafe email merge.
- [x] Configure and run the isolated Owner A/B authorization CI gate against a dedicated non-production database; [run 34821961307](https://github.com/Kerolos17/wisal/actions/runs/34821961307) passed on 14 September 2026. Guest-token and full role-matrix coverage remain required before launch.
- [ ] Run Owner A vs Owner B IDOR test matrix for every event/guest/group/segment/message/cover/payment endpoint.
- [ ] Run couple/support/content-manager/admin permission matrix; verify owner protection and audit log entries.
- [ ] Verify cookies, CSRF/origin policy and session expiry behavior in the deployed environment.

## Product paths

- [ ] New user: account → create event → template → details → segments/groups → guests → preview → publish.
- [ ] Guest: public invite, private invite with valid/invalid token, opening skip, locale change, RSVP, deadline and duplicate/edit handling.
- [ ] Owner: RSVP appears in dashboard and segment counts; CSV export/import keeps data intact and protects formula cells.
- [ ] Payment: start/cancel/submit valid receipt, reject wrong file, review/approve/reject/request-info, entitlement and audit record.
- [ ] Verify messages are labeled manual until an actual provider/worker delivers them.

## Quality, privacy and discoverability

- [ ] Audit at 320/360/375/390/430 px, tablet, desktop; Chrome, Safari, Firefox and Edge.
- [ ] Run Lighthouse/PageSpeed on home and a representative invitation under mobile throttling; record baseline and budget.
- [ ] Check keyboard, visible focus, dialog trapping, labels, contrast, RTL/LTR and reduced-motion behavior.
- [ ] Verify home metadata, canonical, OpenGraph/Twitter, sitemap and robots. Verify `/invite/*`, `/workspace`, `/admin`, `/api/*` are not indexable.
- [ ] Publish final Privacy/Terms contact and retention/deletion policy; verify PII/Sentry redaction.

## Operations

- [ ] Configure Sentry release/environment, error alerts and PII scrubbing; execute preview smoke only.
- [ ] Assign incident owner, support SLA, vulnerability contact, database escalation and rollback owner.
- [ ] Ensure product analytics is privacy-reviewed and has a consent/notice decision before enabling.
- [ ] Rehearse rollback and restore; retain deployment runbook.
- [ ] Replace illustrative testimonial/copy with approved customer claims or remove it.

