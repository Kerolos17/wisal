console.error(`Database migration stopped by Wisal's safety gate.

A canonical fresh-database PostgreSQL history now exists in
db/postgres-migrations/. The generated files in drizzle/ remain a legacy SQLite
history and must not be applied to Neon/Postgres. Existing Neon environments may
also contain manually applied revisions without a Drizzle migration ledger.

Before enabling automated migrations:
1. run npm run db:verify;
2. validate the fresh baseline against a disposable Neon branch;
3. reconcile and test the upgrade path from a copy of the current schema;
4. record revisions in a migration ledger and obtain production approval.

See docs/release/PHASE-1-DATABASE-MIGRATION-AUDIT.md.`);

process.exitCode = 1;
