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
- Repository gates: 172/172 contract tests, migration checksum verification, ESLint, TypeScript, and the Next.js production build passed. Private status and receipt responses now have an explicit `private, no-store` cache contract.
- Checkout now requires an explicit acknowledgement that the paid term starts on reviewer approval, refund requests are reviewed through support without limiting mandatory consumer rights, and uploaded transfer proof is not itself a tax invoice or fiscal receipt. The approved status view shows the snapshotted plan, approval date, and calculated expiry.
- Browser walkthrough evidence is now recorded below; the remaining unchecked items are release gates and are not being presented as completed by automated checks.

## Staging walkthrough

- [x] Sign in as a customer and select each paid plan; verify the exact amount, name, duration, and available receiving destination. Verified on 29 August 2026: Elegant (599 EGP, 250 guests, 365 days) and Signature (1699 EGP, unlimited guests, 365 days), both with InstaPay and Vodafone Cash.
- [x] Open the QR image on phone and desktop; verify keyboard focus opens, traps, and returns from the QR dialog. Verified at 390px mobile width and desktop on 29 August 2026; no horizontal overflow was observed.
- [ ] Open the external payment link on phone and desktop. This remains separate from the QR accessibility check because it requires a live third-party payment surface and must not be confused with a completed transfer.
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

Before running the suite, verify that the URL belongs to `wisal-staging-tests` and branch `br-aged-truth-auwpoj1k`. A stale local `.env.test` can still satisfy the isolation guard while pointing to an older test schema; the canonical branch must report all six migrations before its results are accepted.

## Visual browser evidence — 29 August 2026

- Checkout rendered the policy acknowledgement, payment-document disclosure, and direct support-ticket link for an authenticated customer.
- The support-ticket destination (`/workspace?section=support`) rendered the support form without a React hydration error after the production fix `57f5654`.
- The external payment URL was intentionally not opened as part of this application walkthrough; opening a payment surface is not evidence of a transfer and requires separate operational verification.

## Legal-review references

The checkout disclosure is a conservative implementation baseline, not legal or tax approval. Counsel or the responsible accountant must approve the final market-specific wording before payments are accepted.

- Egyptian Tax Authority: [electronic invoice and electronic receipt FAQ](https://portal.eta.gov.eg/ar/alasylt-alshayt?category_id=111) and [electronic receipt services](https://www.eta.gov.eg/ar/content/e-receipt-services).
- Consumer Protection Agency: [required invoice data](https://cpa.gov.eg/ar-eg/%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA-%D8%A7%D8%B9%D9%84%D8%A7%D9%85%D9%8A%D8%A9/ArtMID/654/ArticleID/6789), [refund and exchange policy guidance](https://cpa.gov.eg/ar-eg/%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA-%D8%A7%D8%B9%D9%84%D8%A7%D9%85%D9%8A%D8%A9/ArtMID/654/ArticleID/6790), and [consumer/service definitions](https://cpa.gov.eg/ar-eg/%D8%AA%D8%B9%D8%B1%D9%8A%D9%81%D8%A7%D8%AA).
