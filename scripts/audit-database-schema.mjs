import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);
const snapshot = JSON.parse(await readFile(new URL("../db/postgres-migrations/meta/0002_snapshot.json", import.meta.url), "utf8"));
const tables = await sql`
  select table_schema, table_name
  from information_schema.tables
  where table_schema in ('public', 'drizzle')
    and table_type = 'BASE TABLE'
  order by table_schema, table_name
`;
const columns = await sql`
  select table_schema, table_name, column_name, data_type, udt_name, is_nullable
  from information_schema.columns
  where table_schema in ('public', 'drizzle')
  order by table_schema, table_name, ordinal_position
`;
const constraints = await sql`
  select rel.relname as table_name, con.conname as name, pg_get_constraintdef(con.oid) as definition
  from pg_constraint con
  join pg_namespace ns on ns.oid = con.connamespace
  join pg_class rel on rel.oid = con.conrelid
  where ns.nspname = 'public'
  order by con.conname
`;
const indexes = await sql`
  select tablename as table_name, indexname as name, indexdef as definition
  from pg_indexes
  where schemaname = 'public'
  order by indexname
`;
const roleCounts = await sql`select role, count(*)::integer as count from public.users group by role order by role`;
const messageStatusCounts = await sql`select status, count(*)::integer as count from public.messages group by status order by status`;

const expectedTables = Object.values(snapshot.tables);
const actualTableNames = new Set(tables.filter((table) => table.table_schema === "public").map((table) => table.table_name));
const expectedTableNames = new Set(expectedTables.map((table) => table.name));
const actualColumns = new Map(columns.map((column) => [`${column.table_name}.${column.column_name}`, column]));
const expectedConstraints = new Set();
const expectedIndexes = new Set();

for (const table of expectedTables) {
  for (const name of Object.keys(table.foreignKeys)) expectedConstraints.add(name);
  for (const name of Object.keys(table.uniqueConstraints)) expectedConstraints.add(name);
  for (const name of Object.keys(table.checkConstraints)) expectedConstraints.add(name);
  for (const name of Object.keys(table.indexes)) expectedIndexes.add(name);
}

const columnDifferences = [];
for (const table of expectedTables) {
  for (const column of Object.values(table.columns)) {
    const key = `${table.name}.${column.name}`;
    const actual = actualColumns.get(key);
    if (!actual) {
      columnDifferences.push({ column: key, issue: "missing" });
      continue;
    }

    const actualType = actual.data_type === "USER-DEFINED" ? actual.udt_name : actual.data_type;
    if (actualType !== column.type || (actual.is_nullable === "NO") !== column.notNull) {
      columnDifferences.push({ column: key, expectedType: column.type, actualType, expectedNotNull: column.notNull, actualNotNull: actual.is_nullable === "NO" });
    }
  }
}

const actualConstraintNames = new Set(constraints.map(({ name }) => name));
const actualIndexNames = new Set(indexes.map(({ name }) => name));
const report = {
  canonicalTables: expectedTableNames.size,
  deployedTables: actualTableNames.size,
  migrationLedgerPresent: tables.some((table) => table.table_schema === "drizzle"),
  missingTables: [...expectedTableNames].filter((name) => !actualTableNames.has(name)),
  extraTables: [...actualTableNames].filter((name) => !expectedTableNames.has(name)),
  columnDifferences,
  constraintNameDifferences: [...expectedConstraints].filter((name) => !actualConstraintNames.has(name)),
  indexNameDifferences: [...expectedIndexes].filter((name) => !actualIndexNames.has(name)),
  domainValues: { userRoles: roleCounts, messageStatuses: messageStatusCounts },
};

if (process.argv.includes("--details")) {
  report.actualConstraints = constraints;
  report.actualIndexes = indexes;
}

console.log(JSON.stringify(report, null, 2));
