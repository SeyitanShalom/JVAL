This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Foundation

Phase 2 uses Prisma with Supabase PostgreSQL. Copy `.env.example` to `.env`, add the Supabase connection strings, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

The schema in `prisma/schema.prisma` supports season archives, configurable competitions, four-pot fixture formats, qualification feeds into the Super Cup, squads with a 25-player limit field, match lineups, live events, penalties, calculated table/stat caches, news, galleries, venues, awards, records, contact links, and editable site content.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This app is Vercel-ready with the Next.js preset. The repository includes
`vercel.json`, so Vercel runs:

```bash
npm run vercel-build
```

Before deploying, add these environment variables to the Vercel project for
Production and Preview:

```bash
DATABASE_URL
DIRECT_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

`DATABASE_URL` should be the Supabase pooled connection string used by the app.
`DIRECT_URL` should be the direct Supabase database URL used for Prisma
migrations and client generation. Cloudinary variables are required for admin
image uploads on Vercel.

After the first production deployment, update Supabase:

```text
Authentication > URL Configuration > Site URL:
https://your-vercel-domain.vercel.app

Authentication > URL Configuration > Redirect URLs:
https://your-vercel-domain.vercel.app/auth/callback
```

If Google login is enabled, also add the production Vercel domain in Google
Cloud OAuth settings:

```text
Authorized JavaScript origins:
https://your-vercel-domain.vercel.app

Authorized redirect URIs:
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

Run pending database migrations before or immediately after production deploys:

```bash
npm run prisma:migrate:deploy
```
