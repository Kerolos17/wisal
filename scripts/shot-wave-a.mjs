// Wave A screenshot harness: landing before/after at the 5 canonical breakpoints.
// Usage: node scripts/shot-wave-a.mjs [before|after]
// The "after" phase scrolls through the page first so scroll-linked reveals
// (GSAP scrub/once) finish before the shots are taken.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const phase = process.argv[2] ?? "before";
const base = process.env.SHOT_BASE ?? "http://localhost:3111";
const outDir = new URL(`../design-shots/wave-a/${phase}/`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(outDir, { recursive: true });

const widths = [360, 480, 768, 1024, 1280];

const browser = await chromium.launch();
for (const width of widths) {
  const height = width < 768 ? 800 : 900;
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(3600);
  if (phase === "after") {
    // Hero shot first, at rest at the top.
    await page.screenshot({ path: `${outDir}landing-${width}-hero.png` });
    // Walk to the BOTTOM and stay there: scrub-linked ScrollTriggers clamp
    // at progress 1 past their end, so the full-page capture shows every
    // world fully revealed.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 160));
      }
    });
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: `${outDir}landing-${width}-full.png`, fullPage: true });
  if (phase !== "after") await page.screenshot({ path: `${outDir}landing-${width}-hero.png` });
  await page.close();
  console.log(`shot ${width}`);
}
await browser.close();
console.log(`done → design-shots/wave-a/${phase}/`);
