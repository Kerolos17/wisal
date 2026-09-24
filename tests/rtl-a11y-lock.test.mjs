import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

function luminance(hex) {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("D-Phase 6: DS text pairs meet WCAG AA (4.5:1)", () => {
  const pairs = [
    ["--ds-ink #432846", "--ds-bg #fbf9fc", "#432846", "#fbf9fc"],
    ["--ds-ink-muted #756579", "--ds-bg #fbf9fc", "#756579", "#fbf9fc"],
    ["--ds-action-ink #332137", "--ds-action #d8ff6d", "#332137", "#d8ff6d"],
    ["--ds-error #a24747", "surface #ffffff", "#a24747", "#ffffff"],
    ["--ds-success #4c7356", "surface #ffffff", "#4c7356", "#ffffff"],
    ["--ds-warning #7f5c2f", "surface #ffffff", "#7f5c2f", "#ffffff"],
    ["--ds-warning #7f5c2f", "badge #f4ead9", "#7f5c2f", "#f4ead9"],
  ];
  for (const [fore, back, f, b] of pairs) {
    const r = ratio(f, b);
    assert.ok(r >= 4.5, `${fore} on ${back} = ${r.toFixed(2)} (needs 4.5)`);
  }
});

async function tsxFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await tsxFiles(full)));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

test("D-Phase 6: digit rule — no bare ar-EG date locale remains in app code", async () => {
  // Only the -u-nu-latn suffixed form may remain.
  const offenders = [];
  for (const file of await tsxFiles(fileURLToPath(new URL("../app", import.meta.url)))) {
    const src = await readFile(file, "utf8");
    if (/"ar-EG"(?!-u-nu-latn)/.test(src)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
  const hook = await readFile(new URL("../app/use-wisal-locale.ts", import.meta.url), "utf8");
  assert.match(hook, /AR_DATE_LOCALE = "ar-EG-u-nu-latn"/);
  assert.match(hook, /dateLocale\(locale: Locale\)/);
});

test("D-Phase 6: directional arrows flip with locale (no fixed-direction CTA arrows)", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\{ar \? "←" : "→"\}/);
});
