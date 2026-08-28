# Wisal — Digital Wedding Invitations

Wisal is a bilingual Arabic/English platform for creating interactive wedding invitations, managing event moments and guest groups, and tracking RSVPs.

## Technology

- Next.js 16 and React 19
- Neon Serverless Postgres and Drizzle ORM
- Neon Auth
- Tailwind CSS 4
- Vercel deployment

## Local setup

Requirements: Node.js 22.13 or later.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the required Neon database and authentication values. Never commit `.env.local` or production secrets.

## Validation

```bash
npm run lint
npm test
npm run build
```

## Deployment

The production project is deployed on Vercel from the `main` branch. Configure the variables listed in `.env.example` for Production, Preview, and Development as appropriate.

The canonical fresh-database PostgreSQL history is under
`db/postgres-migrations/` and can be checked with `npm run db:verify`. Production
migration remains behind a safety gate until the baseline and legacy upgrade
path are validated on isolated Neon branches. Do not bypass `npm run db:migrate`. Follow
`docs/release/PHASE-1-DATABASE-MIGRATION-AUDIT.md`, validate the final ordered
history on an isolated Neon branch, and obtain explicit approval before applying
it to production.
