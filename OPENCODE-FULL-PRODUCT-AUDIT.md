# OPENCODE FULL PRODUCT AUDIT — Wisal Platform

> **Audit Date:** 2026-08-27
> **Auditor Role:** Senior Product Designer / UX Auditor / Creative Director / Senior Next.js Engineer / SaaS Architect / Accessibility & Security Reviewer
> **Scope:** Full product audit — UI/UX, technical architecture, security, payment readiness, testing, production readiness

---

## 1. Executive Summary

Wisal is a bilingual (Arabic/English) SaaS platform for creating and managing digital wedding invitations. The platform demonstrates **strong product vision** and a **sophisticated design system** (Celestial Guest Atlas), but has **critical gaps** that prevent production launch.

**Overall Score: 42/100**

### Top 10 Findings

1. **No payment system exists** — Plans are displayed but there is zero payment infrastructure (no manual payment, no receipt upload, no admin review workflow). This is the single largest blocker.
2. **No Google OAuth** — Authentication relies on ChatGPT proxy headers or Neon Auth, neither of which provides a standard user sign-up/sign-in flow for production.
3. **Hardcoded admin email** — `lib/admin-data.ts:6` and `lib/account-data.ts:6` contain a hardcoded Gmail address as the platform owner. This is a security and scalability issue.
4. **In-memory rate limiting** — `lib/public-api-guard.ts` uses a JavaScript Map that resets on every cold start. Not suitable for production with multiple serverless instances.
5. **Monolithic page.tsx** — The entire application (Landing, Studio, Dashboard, Guest preview, Admin) lives in a single 1306-line file. This creates maintenance, performance, and bundle size problems.
6. **No runtime tests** — All 22 test files are source-code-reading assertions (grep-based), not actual runtime or integration tests.
7. **No error tracking or analytics** — No Sentry, LogRocket, Vercel Analytics, or any monitoring.
8. **Missing payment legal terms** — Privacy and terms pages explicitly state "no real payments are collected" and "pricing will be published before payment activation."
9. **RTL/LTR is manual** — Direction is set via `dir` attribute on `<main>`, not globally on `<html>`. The root layout hardcodes `dir="ltr"`.
10. **No email or notification delivery** — Support tickets and notifications exist in the database but there is no email/WhatsApp sending infrastructure.

---

## 2. Product Understanding

### Platform Purpose
Wisal enables engaged couples to create digital wedding invitations, manage guests with personalized links, track RSVP responses, and communicate with guests — all in Arabic and English.

### Users and Market
- **Primary:** Engaged couples in Egypt and Arabic-speaking market
- **Secondary:** Event staff managing guests and invitations
- **Tertiary:** Platform administrators

### Key Differentiators
- Culturally fluent Arabic/English bilingual experience
- Per-guest personalized invitation links with scoped segment access
- Six distinct "keepsake" invitation concepts (not just color swaps)
- Operational guest management (groups, segments, per-segment RSVP)
- Dark observatory design system (not generic wedding template)

---

## 3. Current Architecture Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Framework | Next.js 16.3 (App Router) | Current |
| UI | React 19, Tailwind CSS 4 | Current |
| Language | TypeScript 5.9 | Current |
| Database | Neon PostgreSQL (Serverless) | Current |
| ORM | Drizzle ORM 0.45 | Current |
| Auth | Neon Auth + ChatGPT proxy headers | Non-production |
| Storage | PostgreSQL media_blobs table | Functional |
| Hosting | Vercel (fra1 region) | Configured |
| Testing | Node.js built-in test runner | Source-reading only |
| Package Manager | npm (package-lock.json) | Current |

### File Structure
```
app/
├── page.tsx (1306 lines — monolithic)
├── layout.tsx
├── admin/page.tsx
├── workspace/page.tsx
├── invite/[slug]/page.tsx + InvitationClient.tsx
├── auth/ (sign-in, sign-up, callback, etc.)
├── privacy/page.tsx, terms/page.tsx
├── api/ (12 route groups)
├── globals.css (60+ lines of compressed CSS)
├── wisal-atlas.css
├── legal-document.tsx
├── error.tsx, loading.tsx, not-found.tsx
├── chatgpt-auth.ts
├── use-wisal-locale.ts
├── manifest.ts, robots.ts, sitemap.ts
├── account-center.tsx, admin-dashboard.tsx
db/
├── schema.ts (228 lines, 15 tables)
├── index.ts
lib/
├── auth/ (server.ts, identity.ts)
├── admin-auth.ts, admin-data.ts
├── current-owner.ts
├── wisal-data.ts (533 lines)
├── wisal-storage.ts
├── public-api-guard.ts
├── support-data.ts
├── account-data.ts
├── invitation-concepts.ts
tests/ (22 files — all source-reading)
```

---

## 4. Personas and Roles

### Defined Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `couple` | Default role for registered users | Create/manage own events, guests, invitations |
| `admin` | Platform owner | Full access: overview, users, templates, plans, content, support |
| `support` | Support staff | Overview read, support ticket management |
| `content_manager` | Content editor | Overview read, template management, content management |

### Role Implementation
- **File:** `lib/admin-data.ts:7-8` — Roles defined as `["admin", "support", "content_manager", "couple"]`
- **File:** `lib/admin-auth.ts:9-14` — Permission mapping per role
- **File:** `app/admin/page.tsx:10` — Admin page checks `account.role` against allowed roles

### Identified Gaps
- **No role hierarchy enforcement** — `couple` role has empty permissions array, but there's no middleware blocking access to admin routes
- **Hardcoded owner email** — `lib/admin-data.ts:6`: `const OWNER_EMAIL = "kerolosmorkos1124@gmail.com"` — the owner is determined by email, not role
- **No role assignment UI** — Admin can update roles via API but there's no admin dashboard UI for user management (only API endpoint exists)
- **No `guest` role** — Guests interact via invite tokens, not accounts

---

## 5. Complete User Journey Map

### Journey 1: Homepage Visit

**Status:** Partially Implemented

| Step | Status | Notes |
|------|--------|-------|
| Landing page loads | ✅ | Hero, templates, pricing, CTA all present |
| Template gallery visible | ✅ | 6 showcase templates with preview |
| Template preview works | ⚠️ | Previews show CSS compositions, not real invitation renders |
| Pricing displayed | ✅ | 3 plans with features |
| CTA to create invitation | ✅ | "Start designing" button |

**Issues:**
- Pricing section explicitly states "Online payment stays paused while the platform is tested" — visible to all visitors
- Template previews are CSS-generated specimens, not actual invitation renders — may mislead users about final output

### Journey 2: Sign Up / Sign In

**Status:** Broken for Production

| Step | Status | Notes |
|------|--------|-------|
| Sign-in page exists | ✅ | `app/auth/sign-in/` |
| Sign-up page exists | ✅ | `app/auth/sign-up/` |
| Google OAuth | ❌ | Not implemented — no Google provider |
| Neon Auth integration | ⚠️ | Beta package (`@neondatabase/auth@0.5.0-beta`) |
| ChatGPT proxy auth | ⚠️ | Only works in ChatGPT Canvas environment |
| Session management | ⚠️ | Depends on auth provider |
| Password recovery | ✅ | Pages exist for forgot/reset password |
| Sign out | ✅ | Route exists at `/auth/sign-out` |

**Critical Gap:** Without Google OAuth or a standard email/password flow that works outside ChatGPT, real users cannot authenticate.

### Journey 3: Plan Selection

**Status:** UI Only — No Backend

| Step | Status | Notes |
|------|--------|-------|
| Plans displayed | ✅ | 3 plans (Starter, Elegant, Signature) |
| Plan selection | ⚠️ | Triggers event creation modal, not plan assignment |
| Plan stored in database | ❌ | No `userSubscriptions` table exists |
| Plan enforced | ❌ | No guest limit enforcement |
| Plan expiration | ❌ | No subscription tracking |

### Journey 4: Payment (Manual)

**Status:** Not Implemented

The entire manual payment workflow described in the requirements does not exist:

| Required | Status |
|----------|--------|
| Payment request form | ❌ |
| Receipt upload | ❌ |
| Payment data entry (amount, method, reference) | ❌ |
| `pending_review` status | ❌ |
| Admin review queue | ❌ |
| Accept/reject with reason | ❌ |
| Plan activation on approval | ❌ |
| Audit log for payment actions | ❌ |
| User payment status tracking | ❌ |
| Idempotency protection | ❌ |
| Race condition prevention | ❌ |

### Journey 5: Invitation Creation

**Status:** Functional

| Step | Status | Notes |
|------|--------|-------|
| Create event modal | ✅ | Bride/groom names, date, venue, city |
| Template selection | ✅ | 6 atelier templates |
| Opening style selection | ✅ | Envelope, card, curtain |
| Layout style selection | ✅ | Classic, story, cinematic |
| Content editing | ✅ | Names, message, date, venue |
| Cover image upload | ✅ | JPEG/PNG/WebP, 5MB limit |
| Section ordering | ✅ | Drag up/down message, countdown, schedule, RSVP |
| RSVP settings | ✅ | Deadline, max party size, meal question |
| Save draft | ✅ | Auto-saves per step |
| Publish | ✅ | Server validates required fields |

### Journey 6: Invitation Sharing

**Status:** Functional

| Step | Status | Notes |
|------|--------|-------|
| Slug generation | ✅ | Unique slug with random token |
| Copy public link | ✅ | Works from dashboard |
| Copy personal link | ✅ | Per-guest with invite token |
| WhatsApp sharing | ✅ | Opens wa.me with personalized message |
| QR code generation | ❌ | Not implemented |

### Journey 7: Guest Experience

**Status:** Functional

| Step | Status | Notes |
|------|--------|-------|
| Opening animation | ✅ | Envelope/card/curtain with reduced-motion respect |
| Event details display | ✅ | Date, venue, map link |
| Countdown | ✅ | Live countdown to event |
| Schedule | ✅ | Per-segment display with scoped access |
| RSVP form | ✅ | Per-segment responses, party size, meal |
| Language switching | ✅ | Arabic/English toggle |
| Music toggle | ✅ | Web Audio API ambient sound |
| Save to calendar | ✅ | ICS file generation |
| Share invitation | ✅ | Web Share API with clipboard fallback |
| Privacy/terms links | ✅ | In footer |

### Journey 8: Dashboard Management

**Status:** Functional

| Step | Status | Notes |
|------|--------|-------|
| Overview with stats | ✅ | Launch readiness, guest stats, segment analytics |
| Guest list | ✅ | Table with status, filters, search |
| Guest import (CSV) | ✅ | Up to 500 guests with preview |
| Guest export (CSV) | ✅ | Download with all fields |
| Guest groups | ✅ | Create/edit groups with segment access |
| Messages | ✅ | Draft messages with audience targeting |
| WhatsApp queue | ✅ | Manual follow-up queue |
| Activity log | ✅ | Timeline of all actions |
| Notifications | ✅ | In-app notification center |
| Support tickets | ✅ | Create and track tickets |
| Event settings | ✅ | View and edit via studio |

### Journey 9: Admin Panel

**Status:** Basic

| Step | Status | Notes |
|------|--------|-------|
| Overview stats | ✅ | User/event/guest counts |
| User list | ✅ | Display names, roles, dates |
| Role management | ✅ | API endpoint exists |
| Template management | ✅ | Toggle active/inactive |
| Plan management | ✅ | Update price, active, featured |
| Content management | ✅ | Bilingual content key-value |
| Audit logs | ✅ | Display with actor names |
| Support tickets | ✅ | List with status management |
| Payment review | ❌ | Not implemented |

---

## 6. UI/UX and Visual Design Audit

### Design System Quality: 7/10

**Strengths:**
- Sophisticated "Celestial Guest Atlas" design system with clear tokens (`DESIGN.md`)
- Consistent copper/plum/ivory palette with semantic meaning
- Two typeface families (serif for ceremony, sans-serif for operations)
- Complete color token system in `DESIGN.md`
- Dark observatory theme differentiates from generic wedding templates

**Weaknesses:**
- CSS is highly compressed and difficult to maintain (`globals.css` is one long block)
- No CSS custom properties for design tokens — colors are hardcoded in CSS
- No component library or design token distribution
- Tailwind CSS is imported but barely used — most styling is custom CSS

### Visual Hierarchy: 6/10

**Issues:**
- `globals.css:3` — All CSS variables defined in a single line, making overrides difficult
- `globals.css:4` — Base styles are heavily compressed, reducing readability
- Multiple competing visual languages: the atlas CSS (`wisal-atlas.css`) and the original CSS (`globals.css`) coexist
- The dashboard uses a different visual language than the marketing site

### Responsive Design: 7/10

**Mobile (390px):**
- ✅ Mobile navigation dock at bottom
- ✅ Touch-friendly targets (min 44px)
- ✅ Forms stack to single column
- ⚠️ Dashboard sidebar hides completely on mobile — no hamburger menu
- ⚠️ Guest table hides columns on mobile but layout can feel cramped

**Tablet (768px):**
- ✅ Grid layouts adapt appropriately
- ✅ Template grid adjusts columns
- ⚠️ Some sections have awkward spacing at tablet breakpoints

**Desktop (1440px):**
- ✅ Max-width containers prevent overly wide layouts
- ✅ Asymmetric hero layout preserved
- ✅ Studio grid with phone preview

### RTL/LTR Support: 6/10

**Issues:**
- `app/layout.tsx:51` — Root `<html>` hardcodes `dir="ltr"` and `lang="en"`
- Direction switching happens at `<main>` level (`app/page.tsx:448`)
- This causes a flash: page loads LTR, then switches to RTL for Arabic users
- `[dir="ltr"]` CSS selectors in `globals.css:31-32` handle some LTR overrides
- No systematic RTL/LTR token system — direction-specific styles are scattered

### Accessibility: 4/10

**Issues:**
- `app/page.tsx:1306 lines` — No ARIA landmarks on major sections
- `app/page.tsx:448` — `<main>` element used but nested inside another structure
- Focus management incomplete — `app/page.tsx:848` uses `aria-current="step"` but not all interactive elements have focus indicators
- `globals.css` — No visible focus styles defined (relies on browser defaults)
- Skip navigation link absent
- Form labels use `<label>` but some lack `htmlFor` association
- `app/invite/[slug]/InvitationClient.tsx:251` — RSVP form uses `role="group"` correctly
- Modal dialogs use `role="dialog"` and `aria-modal="true"` — good
- `prefers-reduced-motion` is respected in CSS (`globals.css:10,52`)
- Color contrast: copper (#d79261) on plum (#241329) may fail WCAG AA for small text

---

## 7. Invitation Experience Audit

### Opening Experience: 8/10

**Strengths:**
- Three distinct opening styles (envelope, card, curtain) with real animations
- `prefers-reduced-motion` respected — animations disabled
- Escape key skips intro
- "Skip intro" button available
- Opening state tracked: closed → opening → open

**Issues:**
- `InvitationClient.tsx:216` — Animation duration hardcoded to 850ms, no user control
- No loading state before opening animation starts
- Curtain animation uses `transform` but no `will-change` hint

### Invitation Content: 7/10

**Strengths:**
- Per-segment RSVP with independent responses
- Countdown with live updates
- Schedule with venue details and map links
- Language switching without page reload
- Save to calendar (ICS)
- Share via Web Share API

**Issues:**
- `InvitationClient.tsx:99` — Cover image URL constructed client-side
- No fallback for missing cover image (shows CSS gradient only)
- Music toggle uses Web Audio API — no actual music file, just synthesized chords
- No "back to top" after RSVP submission
- No confirmation email sent to guest

---

## 8. Homepage and Template Gallery Audit

### Homepage: 7/10

**Strengths:**
- Clear value proposition in hero
- Template showcase with live preview
- Social proof section (illustrative, not real)
- Pricing section with clear plans
- Journey steps explained

**Issues:**
- `app/page.tsx:630` — Testimonial is fake: "ليلى وكريم، مثال توضيحي" — honest but may undermine trust
- `app/page.tsx:636` — Pricing note explicitly says "Online payment stays paused" — visible to all visitors
- `app/page.tsx:540` — RSVP example shows "41 of 68" — hardcoded mock data
- No real customer testimonials or social proof
- No clear "how it works" video or walkthrough

### Template Gallery: 6/10

**Strengths:**
- 6 visually distinct templates (not just color swaps)
- Each template has unique opening style and layout
- Category filtering (classic, botanical, modern, luxury, minimal, cinematic)
- Preview shows template composition

**Issues:**
- Templates 7-12 exist in code but are hidden from new users (`atelierTemplates = templates.slice(0, 6)`)
- Preview images reference files that may not exist (`/brand/templates/previews/...`)
- No actual invitation preview — just CSS compositions
- Template switching in studio doesn't show real-time full invitation preview

---

## 9. Studio and Dashboard Audit

### Studio: 7/10

**Strengths:**
- 5-step wizard with clear progress
- Live phone preview updates in real-time
- Template selection with category filtering
- Content, identity, and RSVP settings in logical order
- Auto-save with dirty state indicator
- Section ordering with drag controls

**Issues:**
- `app/page.tsx:667-882` — Studio is a 215-line function component
- No undo/redo functionality
- No version history
- Phone preview is CSS-only, not a real iframe render
- Cover image upload has no crop/resize tool
- No preview on actual device before publishing

### Dashboard: 7/10

**Strengths:**
- Launch readiness checklist with score
- Guest management with filters and search
- CSV import/export
- Guest groups with segment access control
- Message composer with audience targeting
- WhatsApp manual follow-up queue
- Activity log
- Support ticket system

**Issues:**
- `app/page.tsx:935-1138` — Dashboard is a 203-line function component
- No real-time updates (requires page refresh)
- No guest communication history
- No export of analytics/reports
- WhatsApp queue is manual — opens individual chats
- No automated reminders

---

## 10. Admin Experience Audit

### Admin Panel: 5/10

**Strengths:**
- Overview with user/event/guest counts
- Template activation/deactivation
- Plan price and feature management
- Bilingual content management
- Audit log display
- Support ticket management

**Issues:**
- `app/admin/page.tsx:11` — Access denied page is English-only, not styled
- No user management UI (only API endpoint)
- No payment review queue (not implemented)
- No analytics dashboard
- No system health monitoring
- No batch operations
- No search or filtering in admin views
- Admin dashboard component (`admin-dashboard.tsx`) is lazy-loaded but content is minimal

---

## 11. Manual Payment and Receipt Workflow Audit

### Current Status: NOT IMPLEMENTED

The entire manual payment workflow described in the requirements does not exist in the codebase.

**What exists:**
- `db/schema.ts:100-114` — `platformPlans` table with `priceEgp`, `guestLimit`, `active`, `featured`
- `lib/admin-data.ts:25-29` — Plan seed data with prices (0, 899, 1699 EGP)
- `app/page.tsx:633-645` — Pricing UI displaying plans
- `app/page.tsx:437-445` — Plan selection triggers event creation

**What is missing:**
- No `paymentRequests` or `subscriptions` table
- No receipt upload endpoint
- No payment status tracking
- No admin review workflow
- No plan activation logic
- No audit log for payment actions
- No idempotency protection
- No race condition prevention

---

## 12. Payment Domain Model Proposal

### Required Database Tables

```sql
-- User subscriptions (current plan)
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES platform_plans(code),
  price_egp_snapshot INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment requests (manual payment)
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES platform_plans(code),
  price_egp_snapshot INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  amount_paid INTEGER,
  payment_method TEXT,
  payer_name TEXT,
  payer_phone_masked TEXT,
  reference_number TEXT,
  transfer_date TIMESTAMPTZ,
  receipt_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending_submission'
    CHECK (status IN (
      'pending_submission',  -- User hasn't uploaded receipt yet
      'pending_review',      -- Receipt uploaded, awaiting admin review
      'needs_info',          -- Admin requested additional info
      'approved',            -- Admin approved, plan activated
      'rejected',            -- Admin rejected with reason
      'cancelled'            -- User cancelled
    )),
  rejection_reason TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment audit log
CREATE TABLE payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Key Design Decisions

1. **Price Snapshot:** `price_egp_snapshot` in both tables captures the price at time of request, protecting against price changes.
2. **Idempotency:** Only one `pending_review` or `pending_submission` request per user at a time. Enforced with a partial unique index.
3. **Server-side Validation:** Plan code and price are fetched from `platform_plans` on the server, never trusted from client.
4. **Race Conditions:** Use `SELECT ... FOR UPDATE` in a transaction when approving/rejecting to prevent double-activation.
5. **Receipt Storage:** Store in `media_blobs` with key pattern `receipts/{user_id}/{uuid}.{ext}`, not publicly accessible.

---

## 13. Security and Privacy Audit

### Confirmed Security Issues

#### [SEC-001] Hardcoded Admin Email
- **File:** `lib/admin-data.ts:6`
- **Line:** `const OWNER_EMAIL = "kerolosmorkos1124@gmail.com";`
- **Also:** `lib/account-data.ts:6`
- **Impact:** Anyone who knows this email has admin access. Admin role is assigned by email match, not by secure invitation.
- **Severity:** Critical
- **Fix:** Use environment variable or secure admin invitation system.

#### [SEC-002] In-Memory Rate Limiter
- **File:** `lib/public-api-guard.ts:9`
- **Code:** `const rateWindows = new Map<string, RateWindow>();`
- **Impact:** Resets on every cold start in serverless. Multiple instances = no rate limiting.
- **Severity:** High
- **Fix:** Use Redis, Vercel KV, or database-backed rate limiting.

#### [SEC-003] No CSRF Protection on Authenticated Endpoints
- **File:** `app/api/events/[id]/route.ts`
- **Impact:** Authenticated PATCH requests have no CSRF token validation. Origin check exists on public endpoints but not on authenticated ones.
- **Severity:** Medium
- **Fix:** Implement CSRF token or SameSite cookie policy.

#### [SEC-004] Media Endpoint Serves All Blobs Without Access Control
- **File:** `app/api/media/[...key]/route.ts:6-15`
- **Impact:** Any user can access any media blob by guessing the key. No ownership check.
- **Severity:** High
- **Fix:** Implement access control — receipts should be admin-only, covers should be public.

#### [SEC-005] No Input Sanitization on Guest Names
- **File:** `lib/wisal-data.ts:389`
- **Impact:** Guest names are stored as-is. Could contain XSS payloads if rendered without escaping.
- **Severity:** Low (React escapes by default, but server-side storage is unsanitized)

#### [SEC-006] Health Endpoint Exposed
- **File:** `app/api/health/route.ts`
- **Impact:** Publicly accessible, reveals database status. Not critical but information disclosure.
- **Severity:** Low

### Privacy Compliance

| Requirement | Status |
|-------------|--------|
| Privacy policy | ✅ Bilingual, clear language |
| Terms of use | ✅ Bilingual, clear language |
| Data collection disclosure | ✅ In privacy policy |
| Data deletion mechanism | ⚠️ Via support ticket only, no automated |
| Guest data consent | ❌ No consent mechanism for guest data |
| Payment data policy | ❌ Not applicable (no payment yet) |
| Cookie policy | ❌ No cookies used (session-based) |
| GDPR compliance | ❌ No DPA, no data export, no right to erasure automation |

---

## 14. Accessibility Audit

### WCAG 2.1 AA Compliance: 40%

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | ⚠️ | Some images have alt text, many don't |
| 1.3.1 Info and Relationships | ⚠️ | Forms use labels but not all have htmlFor |
| 1.4.1 Use of Color | ✅ | Status uses text + color |
| 1.4.3 Contrast (Minimum) | ⚠️ | Copper on plum may fail for small text |
| 1.4.4 Resize Text | ✅ | Responsive layouts |
| 2.1.1 Keyboard | ⚠️ | Most elements focusable, some modal traps missing |
| 2.1.2 No Keyboard Trap | ✅ | Modals have close buttons |
| 2.4.1 Bypass Blocks | ❌ | No skip navigation link |
| 2.4.3 Focus Order | ⚠️ | Tab order generally logical |
| 2.4.7 Focus Visible | ❌ | No custom focus styles defined |
| 3.1.1 Language of Page | ❌ | `<html lang="en">` hardcoded, not dynamic |
| 3.1.2 Language of Parts | ⚠️ | Arabic sections use `dir="auto"` |
| 4.1.2 Name, Role, Value | ⚠️ | Some interactive elements lack ARIA |

### Specific Issues

1. **No skip navigation** — Keyboard users must tab through entire header
2. **No focus indicators** — Custom CSS overrides browser defaults without providing alternatives
3. **Modal focus trap** — Modals use `role="dialog"` but don't implement focus trap
4. **Form error association** — Error messages use `role="alert"` but not always linked to inputs via `aria-describedby`
5. **Image alt text** — Many decorative images use `alt=""` correctly, but content images sometimes lack meaningful alt

---

## 15. Responsive and RTL/LTR Audit

### Responsive Breakpoints

| Breakpoint | Implementation |
|-----------|----------------|
| < 650px | Mobile — single column, hidden elements |
| < 900px | Tablet — adjusted grids |
| < 1000px | Navigation simplification |
| < 1100px | Stage compression |
| > 1440px | Desktop — max-width containers |

### RTL/LTR Issues

1. **Root direction hardcoded** — `app/layout.tsx:51`: `<html lang="en" dir="ltr">`
2. **Direction switch at main level** — `app/page.tsx:448`: `dir={locale === "ar" ? "rtl" : "ltr"}`
3. **CSS direction overrides** — `globals.css:31-32`: Manual `[dir="ltr"]` overrides
4. **No systematic approach** — Each component handles direction independently
5. **Flash of wrong direction** — Page loads LTR, then switches to RTL for Arabic users

### Mobile-Specific Issues

- Dashboard sidebar completely hidden on mobile — no alternative navigation
- Guest table hides columns but can feel cramped
- Template grid goes to 2 columns on mobile — may be too small for preview
- Studio phone preview hidden on mobile — no way to preview on actual device

---

## 16. Performance and SEO Audit

### Performance

| Metric | Status | Notes |
|--------|--------|-------|
| Bundle size | ⚠️ | Monolithic page.tsx (1306 lines) included in all routes |
| Code splitting | ✅ | Admin and AccountCenter lazy-loaded |
| Image optimization | ⚠️ | Uses `next/image` but many images use `unoptimized` |
| Font loading | ✅ | Self-hosted via @fontsource |
| CSS | ⚠️ | Two CSS files, highly compressed |
| Caching | ✅ | Platform content cached 5min, media immutable |
| Server components | ⚠️ | Most components are client-side |

### SEO

| Element | Status | Notes |
|---------|--------|-------|
| Title | ✅ | "Wisal \| Digital Wedding Invitations" |
| Description | ✅ | Clear, concise |
| Open Graph | ✅ | Title, description, image |
| Twitter card | ✅ | Summary card |
| Sitemap | ✅ | Homepage + privacy + terms |
| Robots | ✅ | Disallows admin, workspace, API |
| Canonical URLs | ❌ | No canonical tags on invitation pages |
| JSON-LD | ❌ | No structured data for events |
| Meta robots per invitation | ❌ | All published invitations indexed |

### Invitation SEO Issues
- Published invitations are crawlable but have no event-specific metadata
- No Open Graph tags per invitation (title, description, image)
- Slug-based URLs are SEO-friendly but lack structured data

---

## 17. Code Architecture and Maintainability Audit

### Critical Issues

1. **Monolithic page.tsx (1306 lines)** — Contains Landing, Studio, Dashboard, Guest, CreateEventModal, GuestModal, SegmentModal, MessageModal, WhatsAppQueueModal, ImportGuestsModal, GuestGroupModal, and more. This is unmaintainable.

2. **No component extraction** — All UI components are defined in page.tsx as local functions. No `components/` directory.

3. **Mixed concerns** — Data fetching, business logic, and UI rendering are interleaved in the same file.

4. **No state management** — All state is local useState hooks. Complex state flows through props.

5. **No API abstraction** — fetch calls are scattered throughout components with no centralized API client.

6. **CSS maintenance** — globals.css is highly compressed, making it difficult to modify or debug.

### Positive Patterns

- Clean server/client component separation in workspace and admin pages
- Proper use of `force-dynamic` for data-dependent routes
- Good error handling in API routes with consistent error responses
- Activity logging for all mutations
- Rate limiting on public endpoints
- Proper Drizzle ORM usage with type safety

---

## 18. Testing and Quality Audit

### Current Tests: 22 Files

All tests are **source-code-reading assertions** — they read files and check for string patterns. No runtime, integration, or end-to-end tests exist.

| Test File | What It Checks |
|-----------|---------------|
| `complete-flow.test.mjs` | Date validation, publish protection, RSVP states |
| `launch-readiness.test.mjs` | Launch checklist, metadata, headers |
| `launch-trust-security.test.mjs` | Rate limiting, health check, legal pages |
| `admin-dashboard.test.mjs` | Admin API patterns |
| `brand-auth-foundation.test.mjs` | Auth foundation patterns |
| `builder-flow.test.mjs` | Builder step patterns |
| `event-segments-flow.test.mjs` | Segment CRUD patterns |
| `guest-groups-access.test.mjs` | Guest group access patterns |
| `guest-management.test.mjs` | Guest management patterns |
| `invitation-experience.test.mjs` | Invitation display patterns |
| `personalized-invites.test.mjs` | Personalized invite patterns |
| `signature-invitations.test.mjs` | Signature invitation patterns |
| `support-center.test.mjs` | Support ticket patterns |
| `visual-direction.test.mjs` | RTL/LTR patterns |
| `default-language.test.mjs` | Language defaults |
| `home-sections-regression.test.mjs` | Homepage sections |
| `i18n-foundation.test.mjs` | Internationalization |
| `operations-toolkit.test.mjs` | Operations patterns |
| `product-brand-adoption.test.mjs` | Brand adoption |
| `rendered-html.test.mjs` | HTML output patterns |
| `multi-segment-schema.test.mjs` | Multi-segment schema |
| `account-isolation.test.mjs` | Account isolation |

### Missing Test Categories

| Category | Priority |
|----------|----------|
| Runtime unit tests | Critical |
| API integration tests | Critical |
| Database query tests | Critical |
| E2E user journey tests | Critical |
| Accessibility tests | High |
| Performance tests | High |
| Security penetration tests | High |
| Payment workflow tests | Critical (when implemented) |
| RTL/LTR rendering tests | Medium |
| Mobile responsive tests | Medium |
| Error state tests | Medium |

---

## 19. Production Readiness Audit

### Ready

- ✅ Privacy policy and terms of use (bilingual)
- ✅ Health check endpoint
- ✅ Security headers configured
- ✅ Robots and sitemap
- ✅ Open Graph metadata
- ✅ Error boundary (`app/error.tsx`)
- ✅ Loading states
- ✅ 404 page
- ✅ Activity logging
- ✅ Rate limiting (in-memory)

### Not Ready

- ❌ No payment system
- ❌ No Google OAuth
- ❌ No email notifications
- ❌ No error tracking (Sentry, etc.)
- ❌ No analytics (Vercel Analytics, etc.)
- ❌ No monitoring/alerting
- ❌ No database backups configuration
- ❌ No rollback plan
- ❌ No smoke test suite
- ❌ No CI/CD pipeline visible
- ❌ No environment variable validation
- ❌ No domain configuration (uses Vercel default)
- ❌ No CDN for static assets
- ❌ No edge functions configured
- ❌ No rate limiting persistence

---

## 20. Missing Features

### Critical Missing Features

1. **Manual Payment System** — Entire workflow from plan selection to receipt upload to admin review to plan activation
2. **Google OAuth** — Standard sign-in for production users
3. **Email Notifications** — Welcome emails, payment confirmations, support updates
4. **Error Tracking** — Sentry or equivalent for production monitoring
5. **Analytics** — Vercel Analytics or equivalent for user behavior
6. **User Account Management** — Profile editing, password change, account deletion
7. **Subscription Management** — Plan upgrade/downgrade, cancellation, renewal
8. **Admin User Management** — UI for listing, searching, and managing users
9. **Payment Admin Queue** — UI for reviewing and approving/rejecting payments
10. **Data Export** — GDPR-compliant data export for users

### Important Missing Features

11. **QR Code Generation** — For sharing invitations physically
12. **Guest Communication History** — Track all messages sent to each guest
13. **Automated Reminders** — Scheduled follow-ups for non-responding guests
14. **Real-time Updates** — WebSocket or SSE for live dashboard updates
15. **Multi-event Support** — Users can create multiple events (schema supports it, UI partially supports it)
16. **Template Preview Renders** — Real invitation previews, not just CSS compositions
17. **Image Crop/Resize** — Cover image editing tool
18. **Custom Domain Support** — Allow users to use their own domain for invitations
19. **Analytics Dashboard** — Guest engagement metrics, open rates, response trends
20. **Bulk Guest Operations** — Delete, move, reassign groups in bulk

---

## 21. Confirmed Bugs

### [BUG-001] Root Layout Hardcodes English
- **File:** `app/layout.tsx:51`
- **Code:** `<html lang="en" dir="ltr">`
- **Impact:** Arabic users see English page initially, flash of wrong direction
- **Severity:** Medium

### [BUG-002] Admin Access Denied Page Unstyled
- **File:** `app/admin/page.tsx:11`
- **Code:** `<main className="access-denied"><span>!</span><h1>Access denied</h1>...`
- **Impact:** No CSS class `access-denied` defined, page renders unstyled
- **Severity:** Low

### [BUG-003] Template Preview Images May Not Exist
- **File:** `app/page.tsx:98-109`
- **Code:** Preview images reference `/brand/templates/previews/*.webp`
- **Impact:** If files don't exist, shows broken images
- **Severity:** Medium

### [BUG-004] Guest Phone Validation Inconsistent
- **File:** `app/api/events/[id]/guests/route.ts:11`
- **Code:** `/^[+\d\s()-]{7,30}$/`
- **Also:** `app/page.tsx:1161` — Different regex
- **Impact:** Different validation rules on client vs server
- **Severity:** Low

### [BUG-005] Event Date Timezone Handling
- **File:** `lib/wisal-data.ts:153-161`
- **Code:** `cairoDateTime()` function appends Cairo timezone
- **Impact:** Events created with different timezone assumptions may display incorrectly
- **Severity:** Low

---

## 22. Risks and Assumptions

### High Risks

1. **No payment system** — Cannot launch commercially without payment infrastructure
2. **No standard auth** — Cannot acquire real users without Google OAuth or email/password
3. **Hardcoded admin** — Security vulnerability if email is compromised
4. **In-memory rate limiting** — DDoS vulnerability in production serverless
5. **Monolithic architecture** — Technical debt will compound rapidly

### Medium Risks

6. **No error tracking** — Production issues will be invisible
7. **No analytics** — Cannot measure product-market fit
8. **No email delivery** — Cannot communicate with users
9. **No database backups** — Data loss risk
10. **Beta auth package** — Neon Auth is v0.5.0-beta, may have breaking changes

### Assumptions

- Vercel deployment is stable and configured correctly
- Neon PostgreSQL is provisioned and accessible
- Domain `wisal.app` or similar is available
- Team has access to Google Cloud Console for OAuth
- Legal review of privacy/terms is planned before launch

---

## 23. Recommended Information Architecture

### Current IA
```
/ (Landing)
/privacy
/terms
/workspace (Dashboard)
/admin
/invite/[slug] (Public invitation)
/auth/sign-in
/auth/sign-up
/auth/callback
/api/* (12 route groups)
```

### Proposed IA
```
/ (Landing)
/privacy
/terms
/pricing (dedicated page)
/about (optional)

/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/reset-password
/auth/callback

/workspace (Dashboard)
/workspace/events (Event list)
/workspace/events/[id] (Event dashboard)
/workspace/events/[id]/guests
/workspace/events/[id]/messages
/workspace/events/[id]/settings
/workspace/subscription (Plan management)
/workspace/billing (Payment history)
/workspace/support
/workspace/notifications
/workspace/profile

/invite/[slug] (Public invitation)

/admin
/admin/users
/admin/events
/admin/templates
/admin/plans
/admin/payments
/admin/support
/admin/audit

/api/*
```

---

## 24. Prioritized Implementation Roadmap

### Phase 0: Security and Launch Blockers (P0)

**Goal:** Fix critical security vulnerabilities and authentication

| Task | Files | Effort | Dependencies |
|------|-------|--------|-------------|
| Move admin email to env var | `lib/admin-data.ts`, `lib/account-data.ts` | S | None |
| Implement Google OAuth | `app/auth/`, `lib/auth/` | L | Google Cloud Console |
| Add CSRF protection | All API routes | M | None |
| Implement access control on media | `app/api/media/[...]` | M | None |
| Add environment variable validation | `next.config.ts`, `lib/` | S | None |

**Launch Blocker:** Yes — Cannot launch without secure auth

### Phase 1: Manual Payment System (P0)

**Goal:** Enable manual payment workflow

| Task | Files | Effort | Dependencies |
|------|-------|--------|-------------|
| Create payment tables (schema) | `db/schema.ts` | M | None |
| Build payment request form | `app/workspace/` | L | Schema |
| Build receipt upload endpoint | `app/api/payments/` | M | Schema |
| Build admin payment review UI | `app/admin/` | L | Schema |
| Implement plan activation logic | `lib/` | L | Schema |
| Add idempotency protection | `lib/` | M | Schema |
| Add audit logging for payments | `lib/` | S | Schema |

**Launch Blocker:** Yes — Cannot sell plans without payment

### Phase 2: Core UX Fixes (P1)

**Goal:** Fix critical UX issues

| Task | Files | Effort | Dependencies |
|------|-------|--------|-------------|
| Fix root layout lang/dir | `app/layout.tsx` | S | None |
| Extract components from page.tsx | `app/page.tsx` → `components/` | XL | None |
| Add skip navigation | `app/layout.tsx` | S | None |
| Add focus indicators | `globals.css` | S | None |
| Fix admin access denied page | `app/admin/page.tsx` | S | None |
| Add error tracking (Sentry) | `app/`, `next.config.ts` | M | Sentry account |
| Add analytics | `app/layout.tsx` | S | Vercel Analytics |

**Launch Blocker:** Partially — Error tracking and auth fixes are critical

### Phase 3: Visual Polish (P2)

**Goal:** Improve visual quality and consistency

| Task | Files | Effort | Dependencies |
|------|-------|--------|-------------|
| Migrate CSS to design tokens | `globals.css`, `wisal-atlas.css` | L | None |
| Add template preview renders | `app/page.tsx`, `components/` | L | None |
| Improve mobile dashboard | `app/page.tsx` | M | Component extraction |
| Add real customer testimonials | `app/page.tsx` | S | Real customers |
| Remove mock data from public pages | `app/page.tsx` | S | None |
| Add loading skeletons | `app/` | M | None |

**Launch Blocker:** No — Can launch with current visual quality

### Phase 4: Accessibility and RTL (P2)

**Goal:** Achieve WCAG AA compliance

| Task | Files | Effort | Dependencies |
|------|-------|--------|-------------|
| Add ARIA landmarks | All page components | M | Component extraction |
| Implement focus trap in modals | `components/` | M | Component extraction |
| Add aria-describedby to forms | All forms | M | Component extraction |
| Fix color contrast | `globals.css`, `wisal-atlas.css` | S | Design tokens |
| Add prefers-reduced-motion globally | CSS | S | None |
| Test with screen readers | Manual | L | None |

**Launch Blocker:** No — Accessibility improvements can be iterative

### Phase 5: Testing and Monitoring (P1)

**Goal:** Establish quality baseline

| Task | Files | Effort | Dependencies |
|------|-------|--------|-------------|
| Write API integration tests | `tests/` | L | Test database |
| Write E2E tests (Playwright) | `tests/` | XL | Playwright setup |
| Add CI/CD pipeline | `.github/workflows/` | M | GitHub Actions |
| Set up monitoring | Vercel Dashboard | S | Vercel account |
| Configure database backups | Neon Dashboard | S | Neon account |
| Add smoke tests | `tests/` | M | Test database |

**Launch Blocker:** Partially — Basic tests are critical for confidence

### Phase 6: Post-Launch Features (P3)

**Goal:** Enhance product after initial launch

| Task | Effort |
|------|--------|
| Email notifications | L |
| Automated reminders | M |
| QR code generation | S |
| Real-time updates | L |
| Custom domains | L |
| Multi-language invitations | M |
| Guest communication history | M |
| Analytics dashboard | L |
| API for integrations | XL |

---

## 25. Launch Checklist

### Pre-Launch (Must Complete)

- [ ] Google OAuth configured and tested
- [ ] Admin email moved to environment variable
- [ ] CSRF protection on authenticated endpoints
- [ ] Media endpoint access control
- [ ] Manual payment system implemented and tested
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Vercel Analytics)
- [ ] Production domain connected
- [ ] SSL certificate verified
- [ ] Environment variables validated
- [ ] Database backups enabled
- [ ] Privacy policy reviewed by legal counsel
- [ ] Terms of use reviewed by legal counsel
- [ ] Production admin account created
- [ ] Production support account created
- [ ] Smoke tests passing on production

### Launch Day

- [ ] DNS propagation verified
- [ ] SSL certificate working
- [ ] Health check endpoint responding
- [ ] Authentication flow tested on production
- [ ] Event creation flow tested on production
- [ ] RSVP flow tested on production
- [ ] Payment flow tested on production
- [ ] Admin panel accessible
- [ ] Support ticket creation tested
- [ ] Mobile layout verified
- [ ] RTL layout verified
- [ ] Error tracking receiving events
- [ ] Analytics tracking pageviews

### Post-Launch (First Week)

- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Iterate on UX issues

---

## 26. Final Readiness Scorecard

| Domain | Score | Notes |
|--------|-------|-------|
| UI Quality | 65/100 | Strong design system, but monolithic code and compressed CSS |
| UX Clarity | 70/100 | Clear flows, but some dead ends and missing feedback |
| Invitation Experience | 75/100 | Strong opening and RSVP, but no real previews |
| Mobile | 65/100 | Responsive but dashboard experience degrades |
| RTL/LTR | 55/100 | Functional but flash of wrong direction, no systematic approach |
| Accessibility | 40/100 | Basic ARIA, missing focus management, no skip nav |
| Security | 45/100 | Rate limiting, but hardcoded admin, no CSRF, open media |
| Payment Readiness | 5/100 | No payment system exists |
| Admin Readiness | 40/100 | Basic overview, no payment review, no user management |
| Performance | 60/100 | Good caching, but monolithic bundle, client-heavy |
| Testing | 15/100 | Source-reading tests only, no runtime tests |
| Production Operations | 35/100 | Health check exists, but no monitoring, alerts, or backups |

### Overall Score: 42/100

---

## Recommended First Implementation Batch

### Scope
Fix the 3 most critical security and authentication issues that block any production use.

### Files to Modify
1. `lib/admin-data.ts` — Remove hardcoded email, use env var
2. `lib/account-data.ts` — Remove hardcoded email, use env var
3. `.env.example` — Add `PLATFORM_OWNER_EMAIL` variable
4. `app/layout.tsx` — Fix hardcoded `lang="en" dir="ltr"`
5. `app/admin/page.tsx` — Fix unstyled access denied page

### Tasks
1. Replace hardcoded admin email with `process.env.PLATFORM_OWNER_EMAIL`
2. Add `.env.example` documentation for required variables
3. Make root layout direction dynamic based on locale
4. Add basic CSS for admin access denied page
5. Add skip navigation link to layout

### Risks
- Changing admin email handling may affect existing admin session
- Dynamic lang/dir on root layout may cause hydration mismatch if not handled carefully

### Tests
- Verify admin access works with env var
- Verify Arabic users see RTL from page load
- Verify skip navigation link appears and works
- Verify access denied page is styled

### Definition of Done
- Admin email is configurable via environment variable
- No hardcoded credentials in source code
- Root layout respects locale from first paint
- All pages have consistent styling
- Skip navigation works for keyboard users

### Why This Batch
These are the smallest, most impactful changes that:
1. Fix real security vulnerabilities (hardcoded admin)
2. Fix the most visible UX issue (wrong direction on load)
3. Require minimal code changes with low risk
4. Don't require new tables, endpoints, or complex logic
5. Can be tested immediately
6. Unblock all subsequent work

---

*End of audit report. This document should be reviewed by the development team before any implementation begins.*
