# Wisal Security Audit

## Assessment boundary

This is a source-assisted security audit, not a penetration test. The code was reviewed and static contract tests passed. Production secrets, OAuth provider settings, database data, storage contents, and two independent authenticated identities were not available; those controls are therefore **unverified**, not assumed secure.

## Risk register

| Severity | Finding | Evidence | Required action |
|---|---|---|---|
| Critical | No confirmed critical vulnerability found in reviewed source | Owner-scoped event queries, UUID tokens, role checks, validation and tests are present | Complete authenticated negative testing before declaring this closed |
| High | Existing email account cannot safely use Google sign-in/linking | `app/auth/sign-in/page.tsx` explicitly reports the provider cannot link it | WIS-001: define and verify a safe provider-supported account-linking/recovery flow |
| High | Production authorization has not been tested across two identities | Source checks are good but tests are predominantly source/contract tests | WIS-003: automated owner A / owner B / admin / guest-token E2E matrix |
| High | Payment receipt and cover blobs live in primary PostgreSQL | `lib/wisal-storage.ts`; 5 MB uploads are accepted | WIS-006: retention/backup sizing now; migrate to object storage before scale |
| Medium | Upload accepts browser-declared MIME type without decode/re-encode or dimension validation | Cover upload accepts JPEG/PNG/WebP by `file.type`; payment receipt accepts PDF/images | WIS-007: magic-byte verification, image dimension/pixel caps, malware scanning policy |
| Medium | Server mutation routes do not use one central CSRF/origin policy | Public routes do; authenticated routes rely on auth cookie/provider behavior | WIS-004: document Neon cookie SameSite/security settings and add consistent origin/CSRF defense where required |
| Medium | Sensitive PII has no documented retention/deletion schedule | Guest names, phones, RSVP messages, receipt metadata are durable | WIS-008: data lifecycle, export/deletion workflow and owner-facing privacy controls |
| Low | Public error and validation messages are often Arabic literals | `lib/request-validation.ts`, public routes | WIS-002: localize error codes at the UI boundary; do not expose raw server errors |
| Low | CSP permits inline script/style | `next.config.ts` uses `'unsafe-inline'` | Keep justified for Next runtime, review nonce/strict-dynamic feasibility after launch; do not weaken other directives |

## Authentication and session review

**Implemented:** Neon Auth is explicit, secret-backed, and session retrieval is server-side. `safeReturnPath` rejects cross-origin/protocol-relative redirect targets. Workspace and admin pages require identity. The live unauthenticated `/workspace` route redirected to sign-in, and the sign-in page rendered English by default with email/password, recovery, signup and Google controls.

**Blocker:** The current UI knowingly surfaces `account_not_linked` for a password account attempting Google: it says the current provider cannot link Google. That is secure in the sense that it does not auto-merge accounts, but it is not a complete user journey. Do not implement unsafe matching by email. Choose one safe design: provider-supported verified linking after password re-authentication, or a clear reset/password-first recovery flow with support escalation. Exercise both directions and invalid/expired OAuth state in a non-production auth tenant.

**Not verified:** Google provider activation on the Vercel domain, callback allowlist, password-reset mail delivery, email verification policy, cookie attributes, session expiry/renewal, revoked Google grant, and account enumeration/rate limiting.

## Authorization / IDOR review

Reviewed event, guest, group, segment, cover, payment and admin paths pass identity to service operations that query `event.owner_id`, while public invitation reads require slug plus guest token for private mode. Admin route access uses explicit permissions rather than a UI-only check. This is the correct pattern, aligned with OWASP’s advice to test object access under distinct authorization scopes.[^1]

Required proof before launch:

- Owner A cannot read, patch, delete, upload to, or export Owner B’s event/guest/group/segment/message/payment resources by substituting UUIDs.
- A valid guest token cannot RSVP/open a different event, view hidden segments, or change an unrelated guest.
- A support/content role cannot perform user-role or payment-review actions; a normal couple cannot call any admin API.
- Private invitation URLs remain noindex, no-referrer and absent from sitemap/canonical query strings.

## Input, transport and data exposure review

Positive controls include bounded JSON parsing (default 64 KB), no-store responses for public mutations, rate-limit windows in PostgreSQL, allowlisted invitation media paths, `nosniff`, sanitized CSV export cells, and generic API failure handling with request IDs. No SQL string interpolation of user values was found in reviewed Drizzle operations; raw storage SQL uses parameters.

Concerns to address:

- Validate every URL field (`mapUrl`, payment URL) to `https:` with a hostname policy before rendering a user-facing link. They are not server-fetched now, so this is not SSRF, but it prevents unsafe/phishing destinations.
- Add field length/character constraints at API and database boundaries for names, messages, ticket content, and map URLs; current narrow validation is uneven.
- Store a reduced, non-PII audit payload for invitation activity. Avoid putting full user text, phone data, tokens, receipts, or request bodies in logs/Sentry.

## Security launch controls

- Enable Sentry only with PII scrubbing and release/environment tags; test its preview-only smoke endpoint, never production.
- Confirm Vercel production/preview environment separation and least-privilege Neon credentials.
- Enable Neon backup/PITR appropriate to the paid plan, test restore against a non-production database, and document RPO/RTO.
- Set an incident owner, vulnerability intake/support procedure, and dependency-update cadence.

## References

[^1]: OWASP, [Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html), accessed September 2026.

