# Wisal controlled beta release gate

Updated: 20 August 2026

## Ready in the product

- Bilingual Arabic/English marketing, studio, guest invitation, user dashboard, administration, privacy, and terms surfaces.
- RTL/LTR layouts, responsive navigation, reduced-motion handling, and self-hosted brand typography.
- Invitation templates, configurable sections, multiple event stages, guest audiences, personal links, RSVP per stage, CSV import/export, and owner-initiated WhatsApp sharing.
- Neon-backed authentication and event data, scoped access, upload restrictions, security headers, protected private routes, public mutation guards, and database health reporting.
- Manual payment is implemented in code, but is not yet cleared for customer charges.

## Must pass before inviting beta customers

1. Connect the final domain and update canonical metadata, robots, sitemap, and authentication callback URLs.
2. Create production owner/support/test accounts and remove reliance on demo identities.
3. Configure monitored transactional email and verify sender-domain DNS.
4. Enable error, uptime, and product analytics; trigger one synthetic failure and confirm the alert path.
5. Obtain legal review for privacy, terms, retention, guest-data consent, tax, and invoicing language.
6. Before increasing beyond the controlled-beta cohort, review the Neon-backed shared rate-limit capacity, retention, and alerting thresholds. The durable limiter is already active for public mutation routes.
7. Run the production smoke suite: sign-in, invitation creation, publish, personal link, open tracking, RSVP per stage, CSV round trip, image upload, Arabic/English, and phone/tablet/desktop layouts.
8. Complete the manual-payment production acceptance checklist with a separate staging database and test transfer; record the reviewer, plan activation, rejection, and resubmission evidence.

## Beta operating limits

- Start with a small invited cohort and owner-initiated WhatsApp delivery.
- Keep automated WhatsApp and unsupported email promises disabled. Do not accept customer payment until the payment acceptance checklist is complete.
- Export a backup of critical guest data before each live event.
- Review errors, support requests, and RSVP delivery daily during the beta.

## Go/no-go rule

Go only when every item in “Must pass” has an owner, evidence, and a completed status. Any failure involving authentication, guest privacy, personal links, publish flow, or RSVP is a release blocker.
