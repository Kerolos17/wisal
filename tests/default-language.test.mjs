import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [layout, loading, localeHook, home, auth, legal, invite, admin, errorPage, notFound] = await Promise.all([
  read("../app/layout.tsx"),
  read("../app/loading.tsx"),
  read("../app/use-wisal-locale.ts"),
  read("../app/page.tsx"),
  read("../app/auth/auth-form.tsx"),
  read("../app/legal-document.tsx"),
  read("../app/invite/[slug]/InvitationClient.tsx"),
  read("../app/admin/page.tsx"),
  read("../app/error.tsx"),
  read("../app/not-found.tsx"),
]);

test("English is the platform-wide default with server-rendered document semantics", () => {
  assert.match(layout, /cookieLocale === "ar" \? "ar" : "en"/);
  assert.match(layout, /dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
  assert.match(loading, /Preparing your experience/);
  assert.match(localeHook, /must be used inside <LocaleProvider>/);
});

test("all bilingual entry points share the same locale preference", () => {
  // Landing honors ?lang= deep links like invitations do (UX-001, D-Phase 2).
  assert.match(home, /useWisalLocale\(\)/);
  assert.match(auth, /useWisalLocale\(\)/);
  assert.match(legal, /useWisalLocale\(\)/);
  assert.match(invite, /useWisalLocale\(\)/);
  assert.doesNotMatch(`${auth}\n${legal}`, /useState<Locale>\("ar"\)/);
  assert.doesNotMatch(invite, /wisal-invite-locale/);
});

test("guest preview is bilingual and keeps RSVP values independent of labels", () => {
  assert.match(home, /useState\("yes"\)/);
  assert.match(home, /value: "yes", label: L\("سأحضر", "I’ll attend"\)/);
  assert.match(home, /Scroll for details/);
  assert.match(home, /Send RSVP/);
});

test("system and fallback pages use English by default", () => {
  assert.match(admin, /Access denied/);
  assert.match(errorPage, /Something went wrong/);
  assert.match(notFound, /Page not found/);
});
