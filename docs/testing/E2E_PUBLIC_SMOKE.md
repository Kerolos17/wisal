# Public E2E smoke baseline

The Playwright suite in `tests/e2e/` is the first production-like regression
layer for Wisal. It is intentionally read-only: it does not sign in, create an
event, submit an RSVP, upload a receipt, or call a payment mutation.

## Running it

Use a disposable preview by default:

```sh
E2E_BASE_URL=https://preview.example.test npm run test:e2e
```

The configuration defaults to `http://127.0.0.1:3000` for local development.
It refuses the production hostname unless `E2E_ALLOW_PRODUCTION=enabled` is
provided. That override is permitted only for this read-only smoke suite.

## Current coverage

- Public entry point renders on desktop and mobile, with one HTTPS canonical
  URL.
- `robots.txt` disallows private invitation routes and the sitemap contains no
  invitation URL.
- A private invitation URL keeps all robots metadata `noindex` and strips a
  query token from the canonical URL.

## Evidence — 3 September 2026

The suite ran against the approved production hostname in its explicit
read-only mode. Chromium and mobile Chromium both passed all three checks:
6/6 total. The suite also provides traces, screenshots, and video only when a
test fails, under `output/playwright/`.

## Next expansion

Add authenticated tests only against an isolated Neon branch and disposable
test accounts. The first mutable sequence must cover create, publish, share,
RSVP, payment draft/cancel, and reviewer approval exactly once, followed by
cleanup. It must never run against the production hostname.
