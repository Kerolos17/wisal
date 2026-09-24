import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const c of ['rose-garden','cathedral-light','desert-sunset']) {
  const url = `http://localhost:3111/invite/preview/${c}`;
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto(url, { waitUntil: 'networkidle' });
  await d.waitForTimeout(900);
  await d.screenshot({ path: `design-shots/wave2/${c}-desktop-hero.png` });
  await d.screenshot({ path: `design-shots/wave2/${c}-desktop-full.png`, fullPage: true });
  await d.close();
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(url, { waitUntil: 'networkidle' });
  await m.waitForTimeout(900);
  await m.screenshot({ path: `design-shots/wave2/${c}-mobile-hero.png` });
  await m.close();
}
await b.close();
console.log('done');
