import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const inviteSource = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const eventRouteSource = await readFile(new URL("../app/api/events/[id]/route.ts", import.meta.url), "utf8");
const conceptSource = await readFile(new URL("../lib/invitation-concepts.ts", import.meta.url), "utf8");

test("builder exposes three opening and layout experiences", () => {
  for (const value of ["envelope", "card", "curtain", "classic", "story", "cinematic"]) assert.match(pageSource, new RegExp(`value: "${value}"`));
  assert.match(pageSource, /openingStyle: draft\.openingStyle/);
  assert.match(pageSource, /layoutStyle: draft\.layoutStyle/);
});

test("experience choices persist and render on the public invitation", () => {
  assert.match(schemaSource, /openingStyle: text\("opening_style"/);
  assert.match(schemaSource, /layoutStyle: text\("layout_style"/);
  assert.match(dataSource, /"openingStyle", "layoutStyle"/);
  assert.match(inviteSource, /opening-mode-\$\{invitation\.openingStyle\}/);
  assert.match(inviteSource, /layout-\$\{invitation\.layoutStyle\}/);
});

test("studio offers a true phone and desktop invitation preview", () => {
  assert.match(pageSource, /previewDevice.*"phone" \| "desktop"/);
  assert.match(pageSource, /className={`preview-stage \$\{previewDevice\}`}/);
  assert.match(pageSource, /<iframe[^>]+src={`\$\{invitePath\}\?lang=\$\{locale\}&preview=1`}/);
});

test("guest invitation supports bilingual controls and opt-in ambient music", () => {
  assert.match(inviteSource, /useWisalLocale\("lang"\)/);
  assert.doesNotMatch(inviteSource, /wisal-invite-locale/);
  assert.match(inviteSource, /new AudioContext\(\)/);
  assert.match(inviteSource, /aria-pressed={musicPlaying}/);
  assert.match(inviteSource, /musicOff: "Play soft music"/);
});

test("opening moments are skippable and respect reduced motion", () => {
  assert.match(inviteSource, /تخطي المقدمة/);
  assert.match(inviteSource, /Skip intro/);
  assert.match(inviteSource, /prefers-reduced-motion: reduce/);
  assert.match(inviteSource, /event\.key === "Escape"/);
});

test("opening cards keep readable contrast across light and photographic themes", () => {
  assert.match(stylesSource, /Opening-card contrast/);
  assert.match(stylesSource, /\.opening-mode-card \.opening-card\{color:#2a1d33\}/);
  assert.match(stylesSource, /\.opening-theme-cinematic \.opening-card,\.opening-theme-coastal \.opening-card,\.opening-theme-royal \.opening-card\{[^}]*background:rgba\(20,11,22,\.76\)[^}]*color:#fff/);
  assert.match(stylesSource, /\.opening-theme-cinematic \.opening-card strong[^}]*color:#fff4ee/);
});

test("studio exposes a filterable twelve-template library with coherent experiences", () => {
  assert.equal((pageSource.match(/code: "(?:love-poem|garden-night|moonlight|golden-vows|white-story|cinema-night|rose-garden|cathedral-light|desert-sunset|velvet-night|coastal-breeze|modern-monogram)"/g) || []).length, 12);
  assert.match(pageSource, /className="template-filter"/);
  assert.match(pageSource, /const chooseTemplate = \(index: number\)/);
  assert.match(pageSource, /accentColor: templateAccentByArt\[template\.art\]/);
  assert.match(pageSource, /template-art-\$\{template\.art\}/);
});

test("template art is carried into the public invitation and has real visual assets", async () => {
  assert.match(inviteSource, /publicTemplateArt/);
  assert.match(inviteSource, /guest-template-\$\{templateArt\}/);
  assert.match(inviteSource, /opening-theme-\$\{templateArt\}/);
  assert.match(inviteSource, /image-treatment-\$\{templateArt\}/);
  for (const art of ["editorial", "botanical", "glass", "royal", "minimal", "cinematic", "coastal", "arabic"]) {
    assert.match(stylesSource, new RegExp(`template-art-${art}`));
    assert.match(stylesSource, new RegExp(`opening-theme-${art}`));
  }
  assert.match(stylesSource, /classic-rose-frame\.webp/);
  assert.match(stylesSource, /cinematic-velvet-frame\.webp/);
  await access(new URL("../public/brand/templates/classic-rose-frame.webp", import.meta.url));
  await access(new URL("../public/brand/templates/cinematic-velvet-frame.webp", import.meta.url));
  await access(new URL("../public/brand/templates/editorial-arch.webp", import.meta.url));
  await access(new URL("../public/brand/templates/romantic-botanical.webp", import.meta.url));
  await access(new URL("../public/brand/templates/arabic-glass-luxury.webp", import.meta.url));
});

test("every invitation resolves to its own authored concept", () => {
  const concepts = ["love-poem", "garden-night", "moonlight", "golden-vows", "white-story", "cinema-night", "rose-garden", "cathedral-light", "desert-sunset", "velvet-night", "coastal-breeze", "modern-monogram"];
  for (const concept of concepts) {
    assert.match(conceptSource, new RegExp(`"${concept}"`));
    assert.match(stylesSource, new RegExp(`template-concept-${concept}`));
    assert.match(stylesSource, new RegExp(`concept-${concept}`));
  }
  assert.match(inviteSource, /resolveInvitationConcept\(invitation\.template\)/);
  assert.match(inviteSource, /invite-concept-\$\{templateConcept\}/);
  assert.match(inviteSource, /opening-concept-\$\{templateConcept\}/);
  assert.match(pageSource, /template-concept-\$\{template\.code\}/);
});

test("every invitation concept gives its primary action readable contrast", () => {
  const concepts = ["love-poem", "garden-night", "moonlight", "golden-vows", "white-story", "cinema-night", "rose-garden", "cathedral-light", "desert-sunset", "velvet-night", "coastal-breeze", "modern-monogram"];
  const luminance = (hex) => {
    const value = hex.slice(1).length === 3 ? hex.slice(1).split("").map((char) => char + char).join("") : hex.slice(1);
    const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const concept of concepts) {
    const declaration = stylesSource.match(new RegExp(`\\.invite-concept-${concept}\\{([^}]+)\\}`))?.[1] ?? "";
    const accent = declaration.match(/--ci-accent:(#[0-9a-f]{3,6})/i)?.[1];
    const text = declaration.match(/--ci-action-text:(#[0-9a-f]{3,6})/i)?.[1];
    assert.ok(accent && text, `${concept} must declare action colors`);
    const ratio = (Math.max(luminance(accent), luminance(text)) + 0.05) / (Math.min(luminance(accent), luminance(text)) + 0.05);
    assert.ok(ratio >= 4.5, `${concept} action contrast is ${ratio.toFixed(2)}:1`);
  }
  assert.match(stylesSource, /\.invite-primary-action[^}]+color:var\(--ci-action-text\)/);
});

test("English remains the platform default while Arabic is an explicit preference", async () => {
  const localeSource = await readFile(new URL("../app/use-wisal-locale.ts", import.meta.url), "utf8");
  assert.match(localeSource, /DEFAULT_LOCALE: Locale = "en"/);
  assert.match(localeSource, /wisal-locale-v3/);
});

test("content composer persists section visibility and order into the guest invitation", () => {
  for (const field of ["showMessage", "showCountdown", "showSchedule", "sectionOrder"]) assert.match(schemaSource, new RegExp(`${field}:`));
  assert.match(dataSource, /"showMessage", "showCountdown", "showSchedule", "sectionOrder"/);
  assert.match(eventRouteSource, /ترتيب أقسام الدعوة غير صالح/);
  assert.match(pageSource, /const moveSection = \(section: string, direction: -1 \| 1\)/);
  assert.match(pageSource, /className="section-composer"/);
  assert.match(inviteSource, /const sectionNodes =/);
  assert.match(inviteSource, /className="countdown-card"/);
  assert.match(inviteSource, /sectionOrder\.map/);
});
