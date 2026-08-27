# Wisal Phase 0A — Identity Truth & Authorization Consistency

> Status: In progress (code changes landed in working tree; not yet committed)
> Owner: platform team
> Blocks: Phase 1 (manual payment) and any production beta invite
> Related: `docs/implementation/sprint-0-decisions.md`, `OPENCODE-FULL-PRODUCT-AUDIT-REVIEWED.md` (SEC-R01, SEC-R02), `docs/LAUNCH_READINESS.md`

## Goal

Remove the confirmed owner-identity authorization inconsistency (REV-005 / SEC-R01 / SEC-R02) and make every owner-identity decision derive from one validated, server-only configuration source. No production schema change, no new payment code.

## Source of truth

`lib/platform-owner.ts` is the only module that reads `PLATFORM_OWNER_EMAIL`.

- `getPlatformOwnerEmail()` — throws if the env var is missing or invalid.
- `isPlatformOwner(email)` — returns `false` for null/undefined; throws for missing config; otherwise compares normalized email.
- `isPlatformOwnerConfigured()` — graceful boolean for UI contexts that must not crash.

No other module may hardcode the owner email.

## Completed changes (working tree)

| File | Change | Resolves |
|---|---|---|
| `lib/platform-owner.ts` (new) | Single validated owner-identity module | SEC-R01 |
| `lib/admin-data.ts` | Removed `OWNER_EMAIL` constant; `updateUserRole` and `getAdminOverview` use `isPlatformOwner`; overview returns `roleLocked` per user | SEC-R02, REV-005 |
| `lib/account-data.ts` | Removed `PLATFORM_OWNER_EMAIL` constant; account creation uses `isPlatformOwner(email)` | SEC-R01 |
| `app/admin-dashboard.tsx` | Role `<select>` disabled by `user.roleLocked` (server value), not a viewer-based check; owner badge shown only when `isOwner` prop is true; removed hardcoded "Kerolos" name | REV-005, P0 display bug |
| `app/admin/page.tsx` | Computes `isOwner` on the server and passes it to `Home` | REV-005 |
| `app/page.tsx` | `Home` accepts `isOwner` and forwards it to `AdminDashboard` | REV-005 |
| `.env.example` | Documents `PLATFORM_OWNER_EMAIL` (empty, never a real value) | SEC-R01 |
| `tests/platform-owner.test.mjs` (new) | Runtime unit tests for `getPlatformOwnerEmail` / `isPlatformOwner` / `isPlatformOwnerConfigured` (missing-var, invalid, case-insensitive, null) | Test gap |
| `tests/admin-dashboard.test.mjs` | Updated source-contract assertions to match the centralized module | Test drift |
| `docs/MANUAL-PAYMENT-DOMAIN-SPEC.md` | Added HARD ENFORCEMENT block: public media route MUST reject `receipts/*` with 403 | SEC-R04 |

## Remaining work before commit

- [ ] Run `node --test tests/*.test.mjs` (target: all green).
- [ ] Run `npx tsc --noEmit` (strict) — no new type errors.
- [ ] Run `npm run lint`.
- [ ] Confirm `npm run build` passes with `PLATFORM_OWNER_EMAIL` set (no DB mutation; build only).
- [ ] Remove `tsconfig.tsbuildinfo` from the working tree before committing (build cache, never committed).
- [ ] Split commits: (1) identity-hardening + tests, (2) spec clarification. Do not bundle unrelated docs.

## Definition of done

- No personal owner email is duplicated across product modules.
- Missing/invalid `PLATFORM_OWNER_EMAIL` fails safely (throws) and is documented.
- The owner cannot be demoted through UI or API (server `isPlatformOwner` is authoritative; UI only disables the control via `roleLocked` / `isOwner`).
- No hardcoded owner display name in the admin UI.
- Public media route is documented as forbidden for `receipts/*` (implementation of the 403 belongs to Phase 1).

## Out of scope (Phase 1+)

- Actual payment schema, receipt upload, private receipt route, admin review queue.
- Neon Auth production verification (covered by `docs/auth/NEON-AUTH-ROLLOUT.md`).
- RTL/LTR root `lang`/`dir` dynamic strategy (tracked separately).
