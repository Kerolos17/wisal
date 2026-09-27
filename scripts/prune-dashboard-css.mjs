// Orphaned dashboard/admin CSS detector. postcss.parse-based (no string
// surgery). Dry-run by default; pass --write to remove rules whose selector
// classes are used by NO app source file and referenced by NO test.
import postcss from "postcss";
import { readFile, readdir } from "node:fs/promises";

const cssPath = "app/design/wisal.css";
const css = await readFile(cssPath, "utf8");
const root = postcss.parse(css);

// Gather source text: all ts/tsx under app + lib, plus all tests.
async function walk(dir, ext, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(p, ext, out);
    else if (entry.name.endsWith(ext)) out.push(p);
  }
  return out;
}
const appFiles = await walk("app", ".tsx");
const sources = [];
for (const file of [...appFiles, ...(await walk("lib", ".ts"))]) sources.push(await readFile(file, "utf8"));
const testSources = [];
for (const file of await walk("tests", ".mjs")) testSources.push(await readFile(file, "utf8"));
const haystack = sources.join("\n");
const testHaystack = testSources.join("\n");

const DASH_PREFIX = /^(dashboard|guest|stat|segment|response|donut|legend|follow|list-|tool|message|audience|activity|settings|group|launch|admin|event-switch|aside-user|workspace|empty|filters|table|interaction|sharing|reminder|analytics|mini-progress|picker|check-list|checklist|single-panel|panel|queue|ui-)/;

function classNamesOf(selector) {
  const names = [];
  for (const part of selector.split(/[\s>+~(),]+/)) {
    for (const m of part.matchAll(/\.([a-zA-Z][\w-]*)/g)) names.push(m[1]);
  }
  return names;
}

let removed = 0;
const result = root.clone();
result.walkRules((rule) => {
  if (rule.parent.type === "atrule" && !/media/.test(rule.parent.params)) return;
  const sels = rule.selectors ?? [];
  if (sels.length === 0) return;
  const allClasses = sels.flatMap((s) => classNamesOf(s));
  if (allClasses.length === 0) return;
  if (!allClasses.every((c) => DASH_PREFIX.test(c))) return;
  if (allClasses.some((c) => c.startsWith("ui-"))) return; // DS primitives compose class names dynamically
  const unused = allClasses.filter((c) => !haystack.includes(c));
  if (unused.length !== allClasses.length) return; // only prune when ALL classes unused
  const testHit = allClasses.some((c) => testHaystack.includes(c));
  if (testHit) return;
  rule.remove();
  removed++;
  console.log("prune:", sels.join(", ").slice(0, 110));
});

console.log(`\n${removed} rules prunable`);
if (process.argv.includes("--write") && removed > 0) {
  let out = result.toString();
  if (css.includes("\r\n")) out = out.replace(/\r?\n/g, "\r\n");
  await readFile(cssPath, "utf8"); // keep handle warm
  const { writeFile } = await import("node:fs/promises");
  await writeFile(cssPath, out);
  console.log("written");
} else {
  console.log("dry-run only (pass --write to apply)");
}
