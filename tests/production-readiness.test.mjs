import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function apiRouteSources() {
  const apiDirectory = new URL("../app/api/", import.meta.url);
  const entries = await readdir(apiDirectory, { recursive: true });
  const routeFiles = entries.filter((entry) => entry.endsWith("route.ts"));
  return Promise.all(routeFiles.map(async (entry) => ({
    path: entry,
    source: await readFile(join(fileURLToPath(apiDirectory), entry), "utf8"),
  })));
}

test("canonical metadata, robots, and sitemap share the deployed site origin", async () => {
  const [siteUrl, layout, robots, sitemap] = await Promise.all([
    read("lib/site-url.ts"),
    read("app/layout.tsx"),
    read("app/robots.ts"),
    read("app/sitemap.ts"),
  ]);

  assert.match(siteUrl, /https:\/\/wisal-self\.vercel\.app/);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /openGraph: \{\s+url: "\/"/);
  assert.match(robots, /siteUrl/);
  assert.match(sitemap, /siteUrl/);
  assert.doesNotMatch(`${layout}${robots}${sitemap}`, /wisal-wedding\.vercel\.app/);
});

test("public platform content failures do not expose internal error messages", async () => {
  const route = await read("app/api/platform-content/route.ts");

  assert.match(route, /crypto\.randomUUID\(\)/);
  assert.match(route, /Unable to load platform content/);
  assert.match(route, /private, no-store/);
  assert.doesNotMatch(route, /error instanceof Error \? error\.message/);
});

test("server failures use request IDs without returning raw error messages", async () => {
  const [helper, overview, notifications] = await Promise.all([
    read("lib/api-error.ts"),
    read("app/api/admin/overview/route.ts"),
    read("app/api/notifications/route.ts"),
  ]);

  assert.match(helper, /crypto\.randomUUID\(\)/);
  assert.match(helper, /api_request_failed/);
  assert.match(helper, /private, no-store/);
  assert.doesNotMatch(helper, /\{ error: rawMessage/);
  assert.match(overview, /apiErrorResponse/);
  assert.match(notifications, /apiErrorResponse/);
  assert.doesNotMatch(`${overview}${notifications}`, /error instanceof Error \? error\.message/);
});

test("API route handlers do not serialize raw exception messages", async () => {
  const routes = await apiRouteSources();
  const sources = routes.map(({ source }) => source).join("\n");

  assert.ok(routes.length >= 35, "expected the API route inventory to be inspected");
  assert.doesNotMatch(sources, /error instanceof Error \? error\.message/);
  assert.doesNotMatch(sources, /error:\s*error\.message/);
  assert.doesNotMatch(sources, /error:\s*rawMessage/);
});

test("database migration command is protected from the legacy dialect history", async () => {
  const [packageJson, gate] = await Promise.all([
    read("package.json"),
    read("scripts/migration-safety-gate.mjs"),
  ]);

  assert.match(packageJson, /node scripts\/migration-safety-gate\.mjs/);
  assert.match(gate, /legacy SQLite\s+history/);
  assert.match(gate, /process\.exitCode = 1/);
});

test("canonical migrations are PostgreSQL, ordered, and checksum-verified", async () => {
  const [config, journal, verifier, checks] = await Promise.all([
    read("drizzle.config.ts"),
    read("db/postgres-migrations/meta/_journal.json"),
    read("scripts/verify-migrations.mjs"),
    read("db/postgres-migrations/0001_domain-checks.sql"),
  ]);

  assert.match(config, /out: "\.\/db\/postgres-migrations"/);
  assert.match(config, /dialect: "postgresql"/);
  assert.match(journal, /"tag": "0000_baseline"/);
  assert.match(journal, /"tag": "0001_domain-checks"/);
  assert.match(journal, /"tag": "0002_media-blobs"/);
  assert.match(journal, /"tag": "0003_account-message-domains"/);
  assert.match(journal, /"tag": "0004_shared-rate-limits"/);
  assert.match(verifier, /createHash\("sha256"\)/);
  assert.match(checks, /payment_requests_status_check/);
  assert.match(checks, /segment_rsvps_status_check/);
});

test("database role constraints match the administration permission model", async () => {
  const [schema, migration, adminData] = await Promise.all([
    read("db/schema.ts"),
    read("db/postgres-migrations/0003_account-message-domains.sql"),
    read("lib/admin-data.ts"),
  ]);

  for (const role of ["admin", "support", "content_manager", "couple"]) {
    assert.match(schema, new RegExp(role));
    assert.match(migration, new RegExp(role));
    assert.match(adminData, new RegExp(role));
  }
  assert.match(migration, /DROP CONSTRAINT IF EXISTS "users_role_check"/);
});

test("canonical schema includes the raw-SQL media storage table", async () => {
  const [schema, migration, storage] = await Promise.all([
    read("db/schema.ts"),
    read("db/postgres-migrations/0002_media-blobs.sql"),
    read("lib/wisal-storage.ts"),
  ]);

  assert.match(schema, /mediaBlobs = pgTable\("media_blobs"/);
  assert.match(schema, /media_blobs_size_limit/);
  assert.match(migration, /CREATE TABLE "media_blobs"/);
  assert.match(migration, /octet_length/);
  assert.match(storage, /public\.media_blobs/);
});

test("environment readiness can be checked without printing secret values", async () => {
  const [packageJson, checker] = await Promise.all([
    read("package.json"),
    read("scripts/check-environment.mjs"),
  ]);

  assert.match(packageJson, /scripts\/check-environment\.mjs --target=production/);
  assert.match(checker, /NEON_AUTH_COOKIE_SECRET/);
  assert.match(checker, /Values were not printed/);
  assert.doesNotMatch(checker, /console\.(log|error)\(process\.env/);
});
