# Wisal Backup & Restore Runbook

## Retention

- **Point-in-time recovery (PITR):** Neon retains WAL for 7 days on the production branch. RPO ≤ 1 minute within window.
- **Base backup export:** `pg_dump --no-owner` of `public` schema weekly to encrypted storage; retain 8 weekly copies (2 months). Verified via `scripts/verify-migrations.mjs` against `db/postgres-migrations`.
- **Pre-event export:** Before each live event, owner exports guest list CSV via dashboard (`/api/events/[id]/guests` CSV import/export path) and stores locally.

## Restore Drill

Run on an isolated Neon branch (never production):

```bash
# 1. Create isolated branch from production (Neon dashboard)
# 2. Verify migrations
npm run db:verify
# 3. Seed catalog check
psql $ISOLATED_DATABASE_URL -c "SELECT count(*) FROM platform_plans; SELECT count(*) FROM platform_templates;"
# 4. Restore test write + read
psql $ISOLATED_DATABASE_URL -c "INSERT INTO events ... ; SELECT * FROM events LIMIT 1;"
# 5. Point-in-time restore test (Neon branch restore to 5 minutes ago)
```

Record evidence: date, branch ID, reviewer, output of `db:verify` + row counts, and a screenshot of Neon branch restore confirmation. Store in `docs/release/restore-drill-YYYY-MM-DD.md`.

## RTO / RPO Targets

- RPO: ≤ 1 min (within PITR window), ≤ 1 week outside (base backup)
- RTO: ≤ 30 min (branch restore + `db:verify` + health check)

## Monitoring

- Health: `GET /api/health` → `{ application: ok, database: ok }` (checked by Vercel cron + external uptime ping)
- Errors: Sentry (`@sentry/nextjs`) with `instrumentation.ts` server/edge hooks; synthetic drill via `POST /api/ops/sentry-smoke` (preview-only, Bearer SENTRY_SMOKE_TEST_TOKEN, VERCEL_ENV=preview)
- Logs: `lib/logger.ts` structured JSON (redacted PII) via `logger.info/warn/error`

## Synthetic Alert Drill (TASK-005)

Preview-only: `curl -X POST https://<preview>.vercel.app/api/ops/sentry-smoke -H "Authorization: Bearer $SENTRY_SMOKE_TEST_TOKEN"` → expect 200 `{ accepted: true }` and a Sentry issue tagged `ops_smoke=preview`. Confirm notification reaches on-call (Slack/email) and close the loop in the runbook.

## Owner Checklist

- [ ] Weekly backup export file exists and is decryptable
- [ ] Last restore drill evidence dated ≤ 30 days
- [ ] Uptime ping on `/api/health` green
- [ ] Last Sentry smoke drill delivered to on-call (≤ 30 days)
