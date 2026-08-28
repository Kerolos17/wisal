# Phase 1 database migration audit

Status: canonical fresh baseline created; execution remains blocked pending isolated-branch and legacy-upgrade verification.

## Finding

The repository currently has three competing migration locations:

| Location | Observed role | Risk |
| --- | --- | --- |
| `drizzle/` | History used by the former `drizzle-kit migrate` command | SQL uses legacy SQLite syntax even though current configuration targets Postgres |
| `docs/database/` | Product migrations 0007–0010 | Executable SQL is stored under documentation and is absent from the advertised migration directory |
| `db/neon-migrations/` | Neon/Postgres migrations 0007 and 0011–0016 | Sequence 0007 conflicts with `docs/database/0007`; 0008–0010 are missing |

Running the previous `npm run db:migrate` could therefore apply the wrong dialect
or produce an incomplete schema. The command now stops with an explicit safety
message instead of touching a database.

## Canonical history created

- `db/postgres-migrations/0000_baseline.sql` creates the ORM-managed application schema
  from `db/schema.ts` for a fresh PostgreSQL database.
- `db/postgres-migrations/0001_domain-checks.sql` enforces status, locale,
  invitation-style, RSVP, support, notification, and payment domains at the
  database boundary.
- `db/postgres-migrations/0002_media-blobs.sql` adds the raw-SQL media storage
  table, its 5 MB database limit, and cleanup index. Adding it exposed and fixed
  a prior gap between `lib/wisal-storage.ts` and the ORM schema.
- `db/postgres-migrations/0003_account-message-domains.sql` aligns database
  roles with the application's `admin`, `support`, `content_manager`, and
  `couple` permission model while preserving the deployed message lifecycle.
- `db/postgres-migrations/checksums.json` pins SHA-256 checksums for migrations
  and the explicit catalog seed.
- `npm run db:verify` checks the PostgreSQL dialect, contiguous ordering, journal
  alignment, file set, and checksums without connecting to a database.
- `drizzle.config.ts` now writes future migrations to this canonical directory.

## Required remediation

1. Apply the canonical history to an empty disposable branch and run application tests.
2. Capture a schema-only copy of the current deployed database without row data.
3. Generate and review an upgrade migration from that schema to the canonical model.
4. Test the upgrade on a second disposable branch with representative non-secret data.
5. Confirm the Drizzle migration ledger and checksums after both paths.
6. Only then replace the safety gate with the reviewed runner.

## Seed policy

Public templates, plans, and landing content are no longer inserted by the public
GET endpoint. The idempotent seed is `db/seeds/0001_platform_catalog.sql` and must
be applied explicitly after the three platform tables exist. Re-running it does
not overwrite administrator-managed records.

No migration was run against staging or production during this audit.

## Read-only deployed-schema evidence

A metadata-only inspection of the configured Neon database found all 22
canonical tables plus four legacy tables: `media_assets`, `payments`, `plans`,
and `subscriptions`. It also found no Drizzle migration ledger. Business rows,
emails, invitation content, and secrets were not read.

The deployed `users.email` uses `citext` while the fresh canonical model uses
normalized lowercase `text`; this is an upgrade-path difference and must not be
changed in place without a specific decision. Aggregate checks showed only
`admin` and `couple` roles currently exist, so broadening the role constraint to
the application's four supported roles is data-compatible. Exact constraint and
index names differ between the manually provisioned schema and Drizzle output,
even where their structure is equivalent; the upgrade migration must reconcile
by structure rather than assuming names indicate missing protection.
