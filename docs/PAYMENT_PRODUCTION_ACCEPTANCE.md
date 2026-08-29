# Manual payment production acceptance

The application supports an administrator-reviewed transfer workflow. This is a release checklist, not proof that a real payment has been verified.

## Automated gates

- [x] Contract checks cover the checkout route, private receipt access, payment-state feedback, and configurable destinations.
- [x] Receipt-storage unit tests cover unique upload keys and cleanup when submission fails.
- [x] Runtime payment and guest-limit tests require `PAYMENT_TEST_MODE=enabled` and a `PAYMENT_TEST_DATABASE_URL` that is different from `DATABASE_URL`.
- [x] Run `npm run test:payments` against the dedicated `wisal-staging-tests` Neon project (29 August 2026). Never point it at production.
- [x] Run lint, TypeScript, and a production build from the release candidate.

### Automated evidence — 29 August 2026

- Neon staging project: `wisal-staging-tests` (`icy-credit-77217004`); no production data was copied.
- Canonical database history: 6/6 migrations recorded by Drizzle and 23 public tables verified from PostgreSQL.
- Runtime payment suite: 20/20 passing, including submit/approve, request-info/resubmit/reject, cancel, expiry, cross-account request and receipt-metadata isolation, concurrent approval, receipt cleanup, and sold-duration entitlement.
- Receipt storage matrix passed on staging for JPEG, PNG, WebP, and PDF round trips; spoofed content, unsupported MIME, and files over 5 MB were rejected. Cleanup verification found zero leftover test blobs and users.
- Unauthenticated production probes returned 401 for payment status, receipt, and QR routes. QR assets are intentionally shared across authenticated customers because they represent the active receiving destination, not a customer-owned resource.
- Repository gates: 171/171 contract tests, migration checksum verification, ESLint, TypeScript, and the Next.js production build passed. Private status and receipt responses now have an explicit `private, no-store` cache contract.

## Staging walkthrough

- [ ] Sign in as a customer and select each paid plan; verify the exact amount, name, duration, and available receiving destination.
- [ ] Open the payment link and QR image on phone and desktop; verify keyboard focus opens, traps, and returns from the QR dialog.
- [x] Upload valid JPEG, PNG, WebP, and PDF receipt payloads to staging storage, then verify spoofed content, an unsupported type, and a file over 5 MB are rejected and leave no orphan.
- [ ] Approve one request and confirm the correct plan and exact expiry are visible in the customer workspace.
- [ ] Request more information, resubmit the same request, and reject it; confirm the customer sees the reviewer reason and a working return-to-checkout link.
- [ ] Cancel a draft request and confirm the status page does not crash.
- [x] Confirm another account cannot read payment status or receipt metadata, and an unauthenticated request cannot read status, receipt, or the shared QR asset.

## Production controls before charging customers

- [ ] Confirm every receiving account, wallet, payment URL, and QR image with the account owner.
- [ ] Assign at least two trained reviewers and document the approval, rejection, duplicate-payment, and refund process.
- [ ] Publish invoice/tax and refund policy language approved for the intended market.
- [ ] Configure error monitoring and a support route for failed transfers or missing receipts.
- [ ] Capture the test evidence, date, reviewer, and release commit in the launch record.

## Test-database setup

Create a local `.env.test` file (ignored by Git):

```dotenv
PAYMENT_TEST_MODE=enabled
PAYMENT_TEST_DATABASE_URL=postgresql://...dedicated-staging-database...
```

`PAYMENT_TEST_DATABASE_URL` must never equal the app's `DATABASE_URL`. The runtime suite fails closed if either guard is missing.
