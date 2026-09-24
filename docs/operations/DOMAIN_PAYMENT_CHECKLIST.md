# Domain, Payment & Legal Launch Checklist (TASK-007)

## Domain Cutover (DOM-001)

- [ ] Register/verify final domain (e.g., `wisal.app`)
- [ ] Vercel: add domain to project, set `NEXT_PUBLIC_SITE_URL=https://<final-domain>` in Production + Preview
- [ ] Verify `metadataBase`, `robots.ts`, `sitemap.ts` resolve to final domain (no hardcoded `wisal-self.vercel.app` beyond `DEFAULT_SITE_URL` fallback)
- [ ] Neon Auth: update callback URLs to final domain
- [ ] Verify OG/Twitter cards + `robots` noindex still applied to `/invite/*`

## Payment Production Acceptance (PAY-001)

- [ ] Receiving destinations configured (InstaPay, Vodafone/Orange/Etisalat Cash, bank_transfer) in `payment_destinations` table, verified via `/api/admin/payment-destinations`
- [ ] Test transfer: create `paymentRequests` draft → submit receipt (valid image, ≤5MB, JPG/PNG/WebP) → approve → verify `userSubscriptions` activation and `guestLimit` enforcement
- [ ] Rejection + resubmission: reject with reason → user resubmits → re-approve
- [ ] Expiry: draft `pending_review` TTL enforced (see `lib/payments.ts`)
- [ ] Dual review: two distinct admin identities approve (currently single reviewer attested — `docs/payment/production-acceptance.md` gaps)
- [ ] Refund / tax / invoice language added to `app/terms` and `app/privacy` + checkout copy; no subscription framing (event access, not N-day subscription)

## Legal Review (LEGAL-001) — requires counsel, not legal advice

- [ ] Privacy policy + Terms (AR/EN) review
- [ ] Retention + guest-data consent + photo rights
- [ ] Tax / invoice + refund policy
- [ ] Account / data-deletion flows

## Evidence

Record reviewer, date, preview URL, branch, and redacted request/response for each checklist item in `docs/release/payment-acceptance-YYYY-MM-DD.md` and `docs/release/domain-cutover-YYYY-MM-DD.md`.
