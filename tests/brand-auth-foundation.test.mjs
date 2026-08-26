import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const identity = await readFile(new URL("../lib/auth/identity.ts", import.meta.url), "utf8");
const authServer = await readFile(new URL("../lib/auth/server.ts", import.meta.url), "utf8");
const authForm = await readFile(new URL("../app/auth/auth-form.tsx", import.meta.url), "utf8");
const authCallback = await readFile(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
const authProxy = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
const signInPage = await readFile(new URL("../app/auth/sign-in/page.tsx", import.meta.url), "utf8");
const connectGooglePage = await readFile(new URL("../app/auth/connect-google/page.tsx", import.meta.url), "utf8");
const recoveryCard = await readFile(new URL("../app/auth/password-recovery-card.tsx", import.meta.url), "utf8");
const resetPasswordPage = await readFile(new URL("../app/auth/reset-password/page.tsx", import.meta.url), "utf8");
const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");

test("brand assets are wired into the product and install experience", async () => {
  await Promise.all([
    access(new URL("../public/brand/wisal-app-icon-192.png", import.meta.url)),
    access(new URL("../public/brand/wisal-app-icon-512.png", import.meta.url)),
    access(new URL("../public/brand/cinematic-palace-hero.webp", import.meta.url)),
  ]);
  assert.match(page, /wisal-monogram-64\.png/);
  assert.match(styles, /cinematic-palace-hero\.webp/);
});

test("Neon Auth is explicit, secret-backed, and reversible", () => {
  assert.match(authServer, /WISAL_AUTH_PROVIDER === "neon"/);
  assert.match(authServer, /NEON_AUTH_BASE_URL/);
  assert.match(authServer, /secret\.length < 32/);
  assert.match(identity, /getChatGPTUser\(\)/);
});

test("auth return paths reject protocol-relative and cross-origin redirects", () => {
  assert.match(identity, /value\.startsWith\("\/\/"\)/);
  assert.match(identity, /url\.origin === "https:\/\/wisal\.local"/);
});

test("authentication UI supports Arabic, English, email, and Google", () => {
  assert.match(authForm, /useWisalLocale\(\)/);
  assert.match(authForm, /sign-in\/social/);
  assert.match(authForm, /new URL\("\/auth\/callback", window\.location\.origin\)/);
  assert.match(authForm, /errorCallbackURL/);
  assert.match(authCallback, /safeReturnPath/);
  assert.match(authCallback, /NextResponse\.redirect/);
  assert.match(authProxy, /getNeonAuth\(\)\.middleware/);
  assert.match(authProxy, /\/auth\/callback/);
  assert.match(signInPage, /account_not_linked/);
  assert.match(signInPage, /password sign-in/);
  assert.doesNotMatch(signInPage, /linkGoogleAfterPassword/);
  assert.match(connectGooglePage, /redirect\(returnTo\)/);
  assert.match(authForm, /auth\/forgot-password/);
  assert.match(recoveryCard, /request-password-reset/);
  assert.match(recoveryCard, /api\/auth\/reset-password/);
  assert.match(resetPasswordPage, /invalidToken/);
  assert.match(authForm, /sign-up\/email/);
  assert.match(authForm, /dir=\{ar \? "rtl" : "ltr"\}/);
});

test("dynamic responses receive production security headers", () => {
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Referrer-Policy/);
  assert.match(worker, /Permissions-Policy/);
  assert.match(worker, /withSecurityHeaders\(await handler\.fetch/);
});
