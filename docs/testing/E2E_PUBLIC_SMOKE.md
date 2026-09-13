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
- Sign-in and recovery pages render without caching, while an external callback
  destination is rejected. These checks never submit a credential or email.

## Evidence — 3 September 2026

The suite ran against the approved production hostname in its explicit
read-only mode. Chromium and mobile Chromium passed all public checks. The
suite also provides traces, screenshots, and video only when a
test fails, under `output/playwright/`.

## Mutable authorization isolation suite

`tests/e2e/authorization-isolation.spec.ts` verifies that Owner B cannot list,
read, patch, add a guest to, or draft a message for Owner A's event. It also
verifies a normal owner receives `403` from the admin overview API.

It is intentionally opt-in and can **never** run against
`wisal-self.vercel.app`. Run it only with a disposable isolated Neon branch:

```sh
WISAL_E2E_TEST_MODE=enabled \
WISAL_E2E_TEST_TOKEN=<unique-32+-character-test-secret> \
E2E_MUTABLE_AUTHORIZATION=enabled \
E2E_BASE_URL=http://127.0.0.1:3000 \
npm run test:e2e -- tests/e2e/authorization-isolation.spec.ts
```

Start the local app in a separate shell with the same two `WISAL_E2E_*`
variables and an isolated branch `DATABASE_URL`. The test creates only tagged
synthetic data (`@example.invalid`, `WISAL E2E`) and must be run on a branch
with an expiry/cleanup policy; it never targets the production database.

### CI setup

The manual GitHub Actions workflow `.github/workflows/authorization-e2e.yml`
needs two repository secrets:

- `WISAL_E2E_DATABASE_URL`: pooled connection URL for an isolated Neon branch,
  never the production branch.
- `WISAL_E2E_TEST_TOKEN`: a unique random value of at least 32 characters.

It is deliberately `workflow_dispatch` only. Run it after refreshing or
recreating the isolated branch; delete that branch after the release gate is
recorded.
