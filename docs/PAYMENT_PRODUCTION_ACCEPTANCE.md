# Manual payment production acceptance

The application supports an administrator-reviewed transfer workflow. This is a release checklist, not proof that a real payment has been verified.

## Automated gates

- [x] Contract checks cover the checkout route, private receipt access, payment-state feedback, and configurable destinations.
- [x] Receipt-storage unit tests cover unique upload keys and cleanup when submission fails.
- [x] Runtime payment and guest-limit tests require `PAYMENT_TEST_MODE=enabled` and a `PAYMENT_TEST_DATABASE_URL` that is different from `DATABASE_URL`.
- [x] Run `npm run test:payments` against a dedicated staging database after creating `.env.test` (28 August 2026). Never point it at production.
- [ ] Run lint, TypeScript, and a production build from the release commit.

## Staging walkthrough

- [ ] Sign in as a customer and select each paid plan; verify the exact amount, name, duration, and available receiving destination.
- [ ] Open the payment link and QR image on phone and desktop; verify keyboard focus opens, traps, and returns from the QR dialog.
- [ ] Upload a valid image and PDF receipt, then verify an invalid type and file over 5 MB are rejected.
- [ ] Approve one request and confirm the correct plan and exact expiry are visible in the customer workspace.
- [ ] Request more information, resubmit the same request, and reject it; confirm the customer sees the reviewer reason and a working return-to-checkout link.
- [ ] Cancel a draft request and confirm the status page does not crash.
- [ ] Confirm an unauthorized account cannot read a receipt, payment status, or QR asset.

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
