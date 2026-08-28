import assert from "node:assert/strict";
import test from "node:test";

// ─── Runtime Unit Tests for lib/platform-owner.ts ────────────────────────────
// These tests actually import and call the functions, not just check source patterns.

const originalEnv = process.env.PLATFORM_OWNER_EMAIL;

function setOwnerEmail(value) {
  process.env.PLATFORM_OWNER_EMAIL = value;
}

function clearOwnerEmail() {
  delete process.env.PLATFORM_OWNER_EMAIL;
}

function restoreEnv() {
  if (originalEnv !== undefined) {
    process.env.PLATFORM_OWNER_EMAIL = originalEnv;
  } else {
    clearOwnerEmail();
  }
}

// ─── getPlatformOwnerEmail ───────────────────────────────────────────────────

test("getPlatformOwnerEmail: returns normalized email when set", async () => {
  setOwnerEmail("  Owner@Wisal.App  ");
  try {
    const { getPlatformOwnerEmail } = await import("../lib/platform-owner.ts");
    const result = getPlatformOwnerEmail();
    assert.equal(result, "owner@wisal.app");
  } finally {
    restoreEnv();
  }
});

test("getPlatformOwnerEmail: throws when env var is missing", async () => {
  clearOwnerEmail();
  try {
    const { getPlatformOwnerEmail } = await import("../lib/platform-owner.ts");
    assert.throws(
      () => getPlatformOwnerEmail(),
      { message: /PLATFORM_OWNER_EMAIL is not set/ },
    );
  } finally {
    restoreEnv();
  }
});

test("getPlatformOwnerEmail: throws for invalid email format", async () => {
  setOwnerEmail("not-an-email");
  try {
    const { getPlatformOwnerEmail } = await import("../lib/platform-owner.ts");
    assert.throws(
      () => getPlatformOwnerEmail(),
      { message: /PLATFORM_OWNER_EMAIL must be a valid email address/ },
    );
  } finally {
    restoreEnv();
  }
});

test("getPlatformOwnerEmail: throws for empty string", async () => {
  setOwnerEmail("   ");
  try {
    const { getPlatformOwnerEmail } = await import("../lib/platform-owner.ts");
    assert.throws(
      () => getPlatformOwnerEmail(),
      { message: /PLATFORM_OWNER_EMAIL must be a valid email address/ },
    );
  } finally {
    restoreEnv();
  }
});

// ─── isPlatformOwner ─────────────────────────────────────────────────────────

test("isPlatformOwner: returns true for matching email (case-insensitive)", async () => {
  setOwnerEmail("owner@wisal.app");
  try {
    const { isPlatformOwner } = await import("../lib/platform-owner.ts");
    assert.equal(isPlatformOwner("Owner@Wisal.App"), true);
    assert.equal(isPlatformOwner("owner@wisal.app"), true);
    assert.equal(isPlatformOwner("OWNER@WISAL.APP"), true);
  } finally {
    restoreEnv();
  }
});

test("isPlatformOwner: returns false for non-matching email", async () => {
  setOwnerEmail("owner@example.com");
  try {
    const { isPlatformOwner } = await import("../lib/platform-owner.ts");
    assert.equal(isPlatformOwner("other@example.com"), false);
    assert.equal(isPlatformOwner("admin@wisal.app"), false);
  } finally {
    restoreEnv();
  }
});

test("isPlatformOwner: returns false for null/undefined", async () => {
  setOwnerEmail("owner@example.com");
  try {
    const { isPlatformOwner } = await import("../lib/platform-owner.ts");
    assert.equal(isPlatformOwner(null), false);
    assert.equal(isPlatformOwner(undefined), false);
  } finally {
    restoreEnv();
  }
});

test("isPlatformOwner: throws when env var is missing", async () => {
  clearOwnerEmail();
  try {
    const { isPlatformOwner } = await import("../lib/platform-owner.ts");
    assert.throws(
      () => isPlatformOwner("owner@example.com"),
      { message: /PLATFORM_OWNER_EMAIL is not set/ },
    );
  } finally {
    restoreEnv();
  }
});

// ─── isPlatformOwnerConfigured ───────────────────────────────────────────────

test("isPlatformOwnerConfigured: returns true when env var is valid", async () => {
  setOwnerEmail("owner@example.com");
  try {
    const { isPlatformOwnerConfigured } = await import("../lib/platform-owner.ts");
    assert.equal(isPlatformOwnerConfigured(), true);
  } finally {
    restoreEnv();
  }
});

test("isPlatformOwnerConfigured: returns false when env var is missing", async () => {
  clearOwnerEmail();
  try {
    const { isPlatformOwnerConfigured } = await import("../lib/platform-owner.ts");
    assert.equal(isPlatformOwnerConfigured(), false);
  } finally {
    restoreEnv();
  }
});

// ─── Source Contract Tests ───────────────────────────────────────────────────
// These verify that the source code uses the centralized module.

test("admin-data: source uses getPlatformOwnerEmail instead of hardcoded email", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8");
  assert.match(source, /import.*getPlatformOwnerEmail.*from.*@\/lib\/platform-owner/);
  assert.doesNotMatch(source, /const OWNER_EMAIL = "/);
  assert.doesNotMatch(source, /kerolosmorkos1124/);
});

test("admin-data: source uses isPlatformOwner for demotion check", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8");
  assert.match(source, /isPlatformOwner\(target\.email\) && role !== "admin"/);
  assert.match(source, /The platform owner must remain an admin/);
});

test("admin-data: allowedRoles includes all four roles", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8");
  assert.match(source, /"admin".*"support".*"content_manager".*"couple"/);
});

test("admin-data: getAdminOverview returns roleLocked per user", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8");
  assert.match(source, /roleLocked: isPlatformOwner\(row\.email\)/);
});

test("account-data: source uses isPlatformOwner instead of hardcoded email", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/account-data.ts", import.meta.url), "utf8");
  assert.match(source, /import.*isPlatformOwner.*from.*@\/lib\/platform-owner/);
  assert.doesNotMatch(source, /const PLATFORM_OWNER_EMAIL = "/);
  assert.doesNotMatch(source, /kerolosmorkos1124/);
});

test("account-data: owner email gets admin role on account creation", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/account-data.ts", import.meta.url), "utf8");
  assert.match(source, /isPlatformOwner\(email\) \? "admin" : "couple"/);
});

test("account-data: an existing owner is promoted before administration authorization", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/account-data.ts", import.meta.url), "utf8");
  const existingBranch = source.slice(source.indexOf("if (existing)"), source.indexOf("const [created]"));
  assert.match(existingBranch, /isPlatformOwner\(email\) \? "admin" : existing\.role/);
  assert.match(existingBranch, /set\(\{ displayName: identity\.displayName, role,/);
});

test("admin-auth: permission matrix covers all roles", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
  assert.match(source, /admin:.*overview\.read/);
  assert.match(source, /support:.*overview\.read/);
  assert.match(source, /content_manager:.*overview\.read/);
  assert.match(source, /couple:.*\[\]/);
});

test("admin-dashboard: uses roleLocked from server, not viewer-based isPlatformOwner", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/admin-dashboard.tsx", import.meta.url), "utf8");
  assert.match(source, /roleLocked: boolean/);
  assert.match(source, /disabled=\{savingCode === user\.id \|\| user\.roleLocked\}/);
  assert.doesNotMatch(source, /isPlatformOwner/);
  assert.doesNotMatch(source, /owner@wisal\.app/);
});

test("admin-page: server derives owner flag without leaking raw email to client", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(source, /isPlatformOwner\(account\.email\)/);
  assert.match(source, /isOwner=\{isOwner\}/);
  assert.doesNotMatch(source, /PLATFORM_OWNER_EMAIL\s*=\s*"/);
});

test("home-component: does not accept isPlatformOwner prop", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /isPlatformOwner/);
});

test(".env.example: includes PLATFORM_OWNER_EMAIL without exposing a real value", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(source, /PLATFORM_OWNER_EMAIL=/);
  assert.doesNotMatch(source, /PLATFORM_OWNER_EMAIL=.+@/);
});

test("no hardcoded owner email in lib/admin-data.ts", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /kerolosmorkos1124/);
  assert.doesNotMatch(source, /owner@wisal\.app/);
});

test("no hardcoded owner email in lib/account-data.ts", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/account-data.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /kerolosmorkos1124/);
  assert.doesNotMatch(source, /owner@wisal\.app/);
});

test("no hardcoded owner email in app/admin-dashboard.tsx", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/admin-dashboard.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /kerolosmorkos1124/);
  assert.doesNotMatch(source, /owner@wisal\.app/);
});
