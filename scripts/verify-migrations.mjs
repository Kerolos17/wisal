import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "db", "postgres-migrations");
const manifest = JSON.parse(await readFile(join(migrationsDir, "checksums.json"), "utf8"));
const journal = JSON.parse(await readFile(join(migrationsDir, "meta", "_journal.json"), "utf8"));

assert.equal(manifest.algorithm, "sha256", "Unsupported checksum algorithm");
assert.equal(journal.dialect, "postgresql", "Migration journal must target PostgreSQL");

const sqlFiles = (await readdir(migrationsDir)).filter((name) => /^\d{4}_[a-z0-9-]+\.sql$/.test(name)).sort();
assert.deepEqual(sqlFiles, Object.keys(manifest.files).sort(), "Migration files and checksum manifest differ");
assert.equal(journal.entries.length, sqlFiles.length, "Migration journal and SQL file count differ");

for (const [index, file] of sqlFiles.entries()) {
  assert.equal(file.slice(0, 4), String(index).padStart(4, "0"), `Migration sequence is not contiguous at ${file}`);
  assert.equal(journal.entries[index]?.idx, index, `Journal index differs at ${file}`);
  assert.equal(`${journal.entries[index]?.tag}.sql`, file, `Journal tag differs at ${file}`);
}

for (const [relativePath, expected] of Object.entries({ ...manifest.files, ...manifest.seeds })) {
  const content = await readFile(join(migrationsDir, relativePath));
  const actual = createHash("sha256").update(content).digest("hex");
  assert.equal(actual, expected, `Checksum mismatch: ${relativePath}`);
}

const uniqueConstraintNames = new Set();
const explicitUniqueIndexNames = new Set();
for (const file of sqlFiles) {
  const sql = await readFile(join(migrationsDir, file), "utf8");
  for (const match of sql.matchAll(/CONSTRAINT\s+"([^"]+)"\s+UNIQUE\b/g)) uniqueConstraintNames.add(match[1]);
  for (const match of sql.matchAll(/CREATE\s+UNIQUE\s+INDEX\s+"([^"]+)"/g)) explicitUniqueIndexNames.add(match[1]);
}

const duplicateUniqueNames = [...uniqueConstraintNames].filter((name) => explicitUniqueIndexNames.has(name));
assert.deepEqual(
  duplicateUniqueNames,
  [],
  `Unique constraints must not be recreated as same-name indexes: ${duplicateUniqueNames.join(", ")}`,
);

console.log(`Verified ${sqlFiles.length} PostgreSQL migrations and ${Object.keys(manifest.seeds).length} explicit seed.`);
