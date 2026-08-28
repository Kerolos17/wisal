# Wisal launch readiness

## Verified in the application

- Authentication protects workspace and administration routes, with scoped event access.
- Dynamic responses use production security headers and private routes are excluded from search indexing.
- Uploads accept JPEG, PNG, and WebP only, with a 5MB ceiling.
- Public invitation, RSVP, builder, and support flows show retry or validation states.
- Arabic and English direction, responsive navigation, reduced motion, and self-hosted typography are covered by automated checks.
- WhatsApp sharing uses each guest's personal invitation URL; saved message audiences calculate their live recipient count before saving.
- Privacy and terms are available in Arabic and English from both the marketing site and the public invitation.
- Public RSVP and invitation-open endpoints reject cross-origin, oversized, non-JSON, and excessive requests.
- `/api/health` reports application and database availability without exposing connection details.

## Required before public launch

- Replace the temporary Sites address in `metadataBase`, `robots.ts`, and `sitemap.ts` after connecting the production domain.
- Configure a monitored sender domain and transactional email provider before promising email delivery. Email is intentionally not enabled yet.
- Add WhatsApp Business or an approved provider only when automated WhatsApp sending is required; the current product supports owner-initiated sharing.
- Create a production owner account, a support account, and test guest accounts; do not use demo identities.
- Verify RSVP, a personalized link, CSV import/export, an image upload, Arabic/English switching, and mobile layout on the production domain.
- Complete counsel review of the privacy policy, terms, retention policy, and local tax/invoice requirements before selling plans.
- Replace the current per-instance API rate limiter with a durable edge or shared-store limit before a broad public launch.
- Enable uptime/error monitoring and analytics, then test an alert and an error-recovery path.
- Do not accept customer payment until the manual-payment acceptance checklist has been completed in staging and production: receiving destinations, receipt review, approval, rejection/resubmission, expiry, customer support, and refund/invoice policy.

## Release decision

The product is ready for a controlled beta after the domain, monitoring, sender setup, production-account, and legal-review items above are completed. Manual payment remains a gated release item, not proof of launch readiness by implementation alone.
