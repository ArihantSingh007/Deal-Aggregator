# Deploying DealLedger

## Read this first: there is no separate "backend" to deploy

DealLedger is a **Next.js monolith**. The pages you see (`/`, `/deals`, `/product/[slug]`...) and the API routes that power them (`/api/products`, `/api/wishlist`...) are the *same application* — API routes are just server-side functions that live inside the Next.js app and deploy as one unit with everything else. There's no standalone Express/FastAPI server to point Render at separately.

So "frontend on Vercel/Netlify, backend on Render" doesn't quite map onto this codebase. The accurate translation of what you actually want is:

> **The whole app (frontend + API routes) on Vercel or Netlify, and the PostgreSQL database on a managed provider — which can be Render, or something better-suited to this specific job.**

That's what this guide sets up. It's also genuinely simpler than a real frontend/backend split, not a compromise: splitting them for real would mean rewriting every API route as a standalone server, then solving cross-origin cookies for login (the browser needs to send an auth cookie to a *different domain* than the page it's on, which requires `SameSite=None; Secure` cookies, CORS configuration on the backend, and reworking how NextAuth issues sessions) — real complexity, for a stack that doesn't need it. If you want that specific exercise for learning purposes, say so and we can talk through it, but it is not a deployment best practice for a Next.js app and isn't what this guide covers.

## The $0 path (recommended if cost is the priority)

Every step below uses each provider's permanent free tier — no card required anywhere, nothing that silently expires. Verified against each provider's current pricing pages:

| Piece | Provider | Free tier |
|---|---|---|
| App hosting | **Vercel (Hobby)** | Free forever, personal/non-commercial, 100GB bandwidth + 1M function calls/month |
| Database | **Neon** | Free forever, 0.5GB storage, 100 compute-hours/month, includes pooling |
| Rate limiting | **Upstash Redis** | Free forever, 500K commands/month (this app uses a tiny fraction of that) |
| Auth (optional) | **Google OAuth** | Free, no usage limit for this |
| Code hosting | **GitHub** | Free for public or private repos |

**One thing to flag honestly**: Vercel's Hobby plan is for personal, non-commercial projects — this app has affiliate links built in (Amazon/Flipkart), and whether that counts as "commercial" under their terms is genuinely a gray area I can't rule on for you. If you're just running this as a portfolio/learning project and not actually monetizing it, you're almost certainly fine; if you start taking real affiliate income through it, it's worth reading Vercel's terms yourself or budgeting for Pro ($20/mo) at that point.

Follow **Option A** below using Neon (not Render) for the database, and you're done at $0. The step-by-step is identical to Option A — this box just tells you which specific free tiers to pick.

## Choosing a database provider

This matters more than which frontend host you pick, so it goes first.

| Provider | Free tier | Connection pooling | Notes |
|---|---|---|---|
| **Neon** | Permanent, no card — 0.5GB storage, 100 compute-hours/month, scales to zero when idle | Built in (use the pooled connection string it gives you) | Recommended default — this project's whole catalog fits easily in 0.5GB; scale-to-zero means a ~300-500ms cold start after 5 minutes idle, unnoticeable for a personal project |
| **Supabase** | Permanent, no card, pauses fully after ~1 week of inactivity | Built in | Good if you also want file storage / a second admin UI later |
| **Render Postgres** | **Expires 30 days after creation**, then a 14-day grace period before deletion | **Not included on the free tier** — only paid Render Postgres plans (~$6+/mo) get pooling | Only use this if you're paying, or you're fine re-creating the DB every month for a demo |

**If you specifically want to use Render:** pay for a Render Postgres instance (their entry paid tier is inexpensive) so you get connection pooling — this matters a lot, explained below. The free Render Postgres tier is genuinely not suitable for anything you want to keep running, since it deletes itself on a schedule regardless of whether you're actively using it.

**Why pooling matters here specifically:** every API route in this app opens a database connection. On a serverless host (Vercel/Netlify), many requests can run *concurrently* on separate function instances, each wanting its own connection. Plain Postgres has a hard cap on simultaneous connections (often ~100 on small instances) and you can exhaust it under completely ordinary traffic, causing random `FATAL: remaining connection slots are reserved` errors. A connection pooler (PgBouncer, which Neon/Supabase bundle automatically) sits in front of Postgres and shares a small number of real connections across many callers. **Use the "pooled" connection string your provider gives you for `DATABASE_URL`, not the direct one**, if it offers both.

## Environment variables you'll need

Set these in your hosting platform's dashboard (not just in a local `.env` — the platform needs its own copy). Reference: `.env.example` in this repo has the full list with descriptions.

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Use the **pooled** connection string from your provider |
| `NEXTAUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` — a different one than local dev |
| `NEXTAUTH_URL` | Yes in production | Your real deployed URL, e.g. `https://dealledger.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Same as above |
| `NEXT_PUBLIC_SITE_NAME` | No | Cosmetic |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Only if you want Google sign-in live |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Strongly recommended | Without it, login/registration have no rate limiting at all in production |
| `AMAZON_PAAPI_*`, `FLIPKART_AFFILIATE_*` | No | Only if you've been approved for those affiliate programs |

**Important**: because the homepage uses `revalidate = 300` (ISR), Next.js actually queries the database *during the build itself*, not just at runtime. This means `DATABASE_URL` must be set in your platform's environment variables **before your first deploy**, and your database must be reachable from the build environment — this is normal for any managed Postgres provider (they don't IP-block build servers by default), but worth knowing if a first build fails with a connection error.

## Before your first deploy: check you actually have migration files

This step is easy to skip and will make your production database completely empty (every page will 500) if you do. Check:

```bash
ls prisma/migrations
```

**If that folder doesn't exist yet** — which it won't if your local setup used `npm run db:push` instead of `npm run db:migrate` — generate it now, once, against any reachable Postgres database (your local dev database is fine; this only writes SQL files to your repo, it doesn't touch production):

```bash
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add initial migration"
git push
```

`npm run db:deploy` (used below) only *applies* migration files that already exist in your repo — it never generates them. Without this step, deploying runs a command that has nothing to do and your production database silently ends up with zero tables. Do this once, then every future schema change goes through `npm run db:migrate -- --name <description>` locally (which updates this folder) followed by `npm run db:deploy` in production, same as normal.

## Option A (recommended): Vercel + Neon

1. **Push this repo to GitHub** if it isn't already.
2. **Create the database**: sign up at [neon.tech](https://neon.tech), create a project, copy the **pooled** connection string it gives you.
3. **Import to Vercel**: [vercel.com/new](https://vercel.com/new) → import your GitHub repo. Vercel auto-detects Next.js — no config needed.
4. **Add environment variables** in the Vercel project's Settings → Environment Variables (all the ones from the table above that apply).
5. Deploy. Vercel runs `npm install` (which triggers `postinstall: prisma generate` automatically — already wired up in `package.json`), then `npm run build`.
6. **Apply your migrations to the production database** — Vercel doesn't do this for you automatically, and this step does nothing useful unless you completed "Before your first deploy" above. From your own machine, temporarily point `DATABASE_URL` at production and run:
   ```bash
   npm run db:deploy
   ```
   (`prisma migrate deploy` applies existing migration files without generating new ones — the correct command for production, as opposed to `db:migrate` which is for local development and does generate them.)
7. **Update your Google OAuth redirect URI** (if using it) at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) to `https://your-domain.vercel.app/api/auth/callback/google`.
8. Visit `/api/health` on your deployed URL — it should return `{"status":"ok"}`. If it returns a 503, your `DATABASE_URL` is wrong or unreachable. If pages 500 with a Prisma "table does not exist" error, you skipped the migration step above.

## Option B: Netlify + Neon/Supabase

Netlify has solid native Next.js App Router support (SSR, API routes, ISR, middleware, image optimization) via its own build plugin — no separate adapter package to install, it's auto-detected.

1. Same database setup as Option A.
2. [app.netlify.com](https://app.netlify.com) → "Add new site" → import your GitHub repo. Netlify detects Next.js automatically.
3. Add the same environment variables in Site settings → Environment variables.
4. Deploy, then run `npm run db:deploy` against production the same way as step 6 above.
5. **One real limitation to know about**: Netlify's serverless functions time out at 10s (free) / 26s (paid). The `/api/admin/refresh-prices` route is already designed around exactly this kind of limit (see "Known limitations" below) and stays safely under even the 10s free-tier cap per call at its default batch size.

## Option C: Whole app on Render (if you want to actually use Render)

Render can run the entire Next.js app as a single Web Service — this is the version of "using Render" that's actually correct for this codebase, as opposed to splitting frontend/backend.

1. [dashboard.render.com](https://dashboard.render.com) → New → Web Service → connect your GitHub repo.
2. Build command: `npm install && npm run build`. Start command: `npm run start`.
3. Add a **paid** Render Postgres instance (see the pooling note above) or point `DATABASE_URL` at Neon/Supabase instead — both work fine from a Render-hosted app.
4. Add the same environment variables as above in the Environment tab.
5. Run `npm run db:deploy` against production before (or right after) your first deploy.
6. Note: Render's free web-service tier spins down after 15 minutes of inactivity and takes ~50 seconds to wake back up on the next request. Fine for a demo, not for something you want to feel instant.

## Post-deploy checklist

- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] Migrations applied (`npm run db:deploy` run against the production `DATABASE_URL`)
- [ ] **If you seeded production data**: `npm run db:seed` prints the admin/demo passwords to the terminal **once, and only there** — copy them immediately, then either change them or delete those two accounts once you've confirmed things work. They are not stored anywhere else and won't be shown again.
- [ ] `NEXTAUTH_URL` matches your real deployed HTTPS URL exactly
- [ ] Google OAuth redirect URI updated to the production domain (if used)
- [ ] Upstash rate limiting configured (check your deploy logs for the startup warning if you skipped this)
- [ ] Promote your own account to `ADMIN`: easiest via your database provider's SQL console —
  ```sql
  UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
  ```

## Known limitations worth knowing about

- **`/api/admin/refresh-prices` processes a bounded batch per call** (30 price checks), not your whole catalog at once — this is intentional, not a bug: serverless hosts kill requests after a fixed timeout, and looping through an unbounded catalog with the delay Amazon/Flipkart's rate limits require would eventually exceed it. Click the button again (or put it on a repeating schedule) to work through a larger catalog; it always processes the least-recently-checked products first.
- **No automated backups are configured for you.** Whichever database provider you choose, check their backup/point-in-time-recovery options once real user data exists — this app doesn't do anything backup-related on its own.
- **No email verification on signup.** Registration only requires an email + password; there's no confirmation email step. Fine for a personal project, worth adding (e.g., via Resend or Postmark) before treating this as a real public product with real user accounts.
- **Vercel's preview-deployment feedback toolbar may not appear.** The Content-Security-Policy added in `next.config.js` only allows scripts from your own domain, which also blocks Vercel's own `vercel.live` toolbar script on preview deployments. This isn't a bug in your app — the toolbar is a Vercel convenience feature, not something your site needs — but worth knowing so a missing toolbar on a preview URL doesn't look like something broke.
