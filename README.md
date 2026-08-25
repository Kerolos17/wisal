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

Database migrations are stored under `db/neon-migrations/`. Apply them to an isolated Neon branch first, then to production after validation.
