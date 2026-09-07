# DealLedger

A deal-aggregation website for **manually curated** Amazon & Flipkart listings — price history, deal scores, wishlists, and price-drop alerts. No scraping or automated fetching is included; everything is entered through the admin dashboard, with clean interfaces ready for a future automated data source.

## Tech stack

- **Next.js 15.5** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** (CSS-first config — see `src/app/globals.css`) + hand-built shadcn-style components (Radix primitives)
- **Framer Motion** for page transitions, scroll reveals, and micro-interactions
- **Prisma 6** ORM + **PostgreSQL**
- **NextAuth.js v4** (Credentials + Google OAuth, JWT sessions, role-based access)
- **Zod** for API request validation
- **Recharts** for the price history chart

### A note on versions

Everything above is genuinely current, with two deliberate exceptions I chose not to chase:

- **NextAuth stays on v4.24.15** (its actual `latest` npm tag) rather than Auth.js v5, which is still officially beta-tagged. v5 changes the config shape significantly (root `auth.ts`, different route handlers, renamed env vars) — worth adopting once it's stable, but not something to migrate to blind.
- **Next.js stays on the 15.5.x line** rather than jumping to Next 16, which defaults to Turbopack and introduces Cache Components — a bigger migration than this project needed, and one I can't fully verify without a live build environment.

If you want either upgrade, both are reasonable follow-ups — just budget time to test thoroughly, since I haven't been able to run a real build in the environment this was built in (see the note at the end of this file).

## 1. Prerequisites

- Node.js 18.18+ (20 LTS recommended)
- A PostgreSQL database (local install, Docker, or a hosted instance like Supabase/Neon/Railway)

## 2. Setup

```bash
# Install dependencies
npm install

# Copy environment variables and fill them in
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deal_aggregator?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="DealLedger"
```

If you don't have Postgres running locally, the fastest option is Docker:

```bash
docker run --name dealledger-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=deal_aggregator -p 5432:5432 -d postgres:16
```

## 2.5 Google sign-in (optional)

"Continue with Google" only appears on `/login` if these are configured — leave them blank to skip this entirely and just use email/password.

1. Go to the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials), create a project if you don't have one.
2. Create an **OAuth client ID** → Application type: **Web application**.
3. Add an authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (swap the domain for your production URL when you deploy).
4. Copy the generated Client ID and Client Secret into `.env`:
   ```env
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```
5. Restart `npm run dev`. First-time Google sign-ins automatically create a `USER`-role account with that email.

## 3. Database migration

```bash
# npm install already ran "prisma generate" for you via postinstall — only
# needed manually again if you change prisma/schema.prisma later:
npm run db:generate

# Creates the tables (versioned migration, recommended)
npm run db:migrate -- --name init

# OR, for quick local prototyping without migration history:
npm run db:push
```

## 4. Seed sample data

```bash
npm run db:seed
```

This creates:
- 6 categories (Smartphones, Laptops, Gaming, Electronics, Accessories, Home Appliances)
- 12 sample products with ~6 months of realistic Amazon/Flipkart price history and calculated deal scores
- An **admin** account (`admin@dealledger.dev`) and a **demo user** account (`demo@dealledger.dev`)

Both passwords are **randomly generated and printed once in your terminal** when the seed script runs — they're never hardcoded, so this file (and your git history) never contains a real password. Copy them from the terminal output immediately; they aren't stored anywhere and won't be shown again. If you lose them, just run `npm run db:seed` again — it's safe to re-run (existing rows are left alone, only missing ones are created).

> To promote any other account to admin later, update its `role` column to `ADMIN` — easiest via `npm run db:studio`.

## 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in at `/login` with the admin credentials above, then go to `/admin` to manage products and price history.

## Project structure

```
src/
  app/
    page.tsx                    # Homepage
    deals/page.tsx              # /deals — filterable, sortable deal list
    product/[slug]/page.tsx     # Product detail + price chart + deal analysis
    categories/                 # Category index + per-category listing
    dashboard/                  # User dashboard (wishlist, price alerts)
    admin/                      # Admin dashboard (product & price-history CRUD)
    api/                        # Route handlers (auth, products, price-history, wishlist, alerts)
    sitemap.ts, robots.ts        # SEO
  components/
    ui/                         # Button, Card, Dialog, Select, Tabs, Toast, etc.
    admin/                      # ProductForm, PriceHistoryManager, ProductPicker
    product-card.tsx, deal-list-card.tsx, price-chart.tsx, ...
  lib/
    prisma.ts                   # Prisma client singleton
    auth.ts                     # NextAuth config
    deal-score.ts                # calculateDealScore() — the scoring algorithm
    products.ts                  # Data access layer (queries + serialization)
    scrapers/                    # Placeholder interfaces for a future automated data source
  middleware.ts                  # Protects /admin (ADMIN role) and /dashboard (any signed-in user)
prisma/
  schema.prisma
  seed.ts
```

## Deal scoring algorithm

`src/lib/deal-score.ts` exports `calculateDealScore()`, weighted as specified:

| Factor | Weight |
|---|---|
| Discount vs. original price | 40% |
| Difference from 6-month average price | 30% |
| Product rating | 20% |
| Availability / popularity (reviews) | 10% |

Labels: **90–100** Excellent Deal · **75–89** Great Deal · **50–74** Good Deal · **<50** Normal Price.

The score is recalculated automatically:
- When a product is created or edited via the admin form (live preview included)
- When a price-history entry is added, edited, or deleted (since that changes the 6-month average)

## Live price fetching from Amazon & Flipkart (official APIs)

> **If you already had this project set up before:** pull the new code and run `npm run db:generate` again — no new tables this time, just new files.

Two things now use the real Amazon and Flipkart APIs (not scraping — both platforms prohibit that in their ToS, and this project deliberately avoids it):

**1. Import a product by pasting its URL.** On `/admin/products/new`, paste an Amazon or Flipkart product URL into the "Import from Amazon or Flipkart" box and click **Fetch details**. It pulls the name, brand, price, rating, review count, and images live from the official API and fills in the form — you still pick a category and hit save.

**2. Refresh live prices for everything you're already tracking.** Click **Refresh live prices** on `/admin` to pull the current price for every product with an Amazon/Flipkart URL, log a new price-history entry when it moved, and recalculate deal scores. Chain this with the [deal finder](#automatic-deal-finder) (`POST /api/admin/refresh-prices` then `POST /api/admin/deal-finder`) on a cron schedule for a fully hands-off pipeline — refresh finds new prices, the finder proposes anything that looks like a great deal, you approve.

### Getting API access

Both are free but require approval — budget a few days before this works:

- **Amazon Product Advertising API (PA-API 5.0):** sign up for the [Amazon Associates program](https://affiliate-program.amazon.in) for your marketplace, then generate credentials under *Tools > Product Advertising API*. New accounts are capped very low (often 1 request/second, small daily quota) until you generate a few qualifying sales — `refresh-prices` already paces requests ~1/second to respect this.
- **Flipkart Affiliate API:** apply at [affiliate.flipkart.com](https://affiliate.flipkart.com), then find your Affiliate ID and Token under *Account > API Access* once approved.

Add the credentials to `.env`:

```env
AMAZON_PAAPI_ACCESS_KEY="..."
AMAZON_PAAPI_SECRET_KEY="..."
AMAZON_PAAPI_PARTNER_TAG="yoursite-21"
AMAZON_PAAPI_HOST="webservices.amazon.in"
AMAZON_PAAPI_REGION="eu-west-1"

FLIPKART_AFFILIATE_ID="..."
FLIPKART_AFFILIATE_TOKEN="..."
```

Until these are filled in, both features return a clear "not configured" error instead of failing silently — the site otherwise works exactly as before (manual entry is always available as a fallback).

The implementation lives in `src/lib/scrapers/`:
- `amazon-scraper.interface.ts` — signs and calls PA-API 5.0's `GetItems` operation (signing logic in `aws-sigv4.ts`)
- `flipkart-scraper.interface.ts` — calls the Affiliate API's product-lookup endpoint
- `index.ts` — `detectPlatform(url)` and `getDataSource(platform)` used by both admin features above

If Flipkart or Amazon change their response format, the field mappings are isolated in each file's `fetchProduct`/`fetchCurrentPrice` methods — nothing else in the app needs to change.

## Automatic deal finder

> **If you already had this project set up before:** this feature added a new `DealSuggestion` model to the schema. Pull the new code, then run `npm run db:migrate -- --name add_deal_suggestions` (or `npm run db:push` for quick local dev) before starting the app again, or Prisma will complain about a missing table.

`/admin/deal-finder` scans the price history already tracked in your database (the same `PriceHistory` rows entered manually or pulled in via the price-fetching features above) and flags products that just became a strong deal — either their calculated deal score crosses 75 ("Great Deal" or better), or their price dropped 12%+ in the last 14 days.

How it works:
1. Click **Run scan** on `/admin/deal-finder` (or trigger `POST /api/admin/deal-finder` from a scheduled job — see below).
2. Qualifying, not-yet-featured products are added to a review queue as `DealSuggestion` rows, each with a plain-language reason (e.g. "Scored 88/100 (Great Deal) — 24% below its list price, dropped 15% in the last 14 days").
3. The admin reviews each suggestion and either **Approves** (marks the product `isFeatured = true`, so it starts showing in "Today's Best Deals") or **Rejects** it (dismissed; the product can be re-flagged later if its price moves further).

Nothing is ever shown to visitors without that explicit approval step.

To run this automatically instead of clicking the button, call `POST /api/admin/deal-finder` from a scheduler (a Vercel Cron Job, a `node-cron` process, GitHub Actions on a schedule, etc.) using an authenticated admin session or by adding a separate cron-secret check to that route.

Thresholds live at the top of `src/lib/deal-finder.ts` (`MIN_DEAL_SCORE`, `RECENT_DROP_WINDOW_DAYS`, `RECENT_DROP_THRESHOLD_PCT`) if you want to tune sensitivity.

## Backend design: validation & response shape

Every API route follows the same pattern, defined in two small files:

- **`src/lib/validation/schemas.ts`** — a Zod schema per write operation (`productCreateSchema`, `priceHistoryCreateSchema`, `wishlistCreateSchema`, etc.). Routes call `.safeParse()` on the request body before touching the database, so malformed input never reaches Prisma.
- **`src/lib/api-response.ts`** — helpers every route uses:
  - `apiSuccess(data, status)` → `{ success: true, data }`
  - `apiError(message, status)` → `{ success: false, error }`
  - `apiValidationError(zodError)` → `{ success: false, error: "Validation failed", fieldErrors: { fieldName: ["message"] } }`
  - `withErrorHandling(handler)` wraps a route so any unexpected thrown error becomes a clean `500` JSON response instead of Next's raw error page.

Client code always reads `response.data` on success and `response.error` (or `response.fieldErrors` for per-field validation messages) on failure — one shape everywhere, instead of every route inventing its own.

Applied across all write-path routes (`products`, `categories`, `price-history`, `wishlist`, `price-alerts`, `deal-finder`, `refresh-prices`, `import-product`, `auth/register`). Extending it to a new route is just: define a Zod schema, wrap the handler in `withErrorHandling`, call `apiSuccess`/`apiError`.

## Animations & visual design

The "Ledger" visual identity (deep ticker-navy, a single reserved "signal green" for savings, tabular-numeral prices) is now paired with a consistent motion language, built on Framer Motion plus custom Tailwind v4 animation tokens defined in `globals.css`:

- **Page transitions** — `src/app/template.tsx` fades/rises each page in on navigation without re-animating the navbar/footer.
- **Scroll reveals** — `src/components/reveal-grid.tsx` staggers product cards in as they scroll into view; used on the homepage, deals, and category grids.
- **Product cards** — lift on hover, image zooms slightly, buy buttons stay stable (no layout shift).
- **Hero** — staggered entrance, a faint animated "ticker grid" background, a slow-floating icon, and a live-pulsing "tracking" indicator.
- **Deal finder queue** — suggestion cards animate in and slide out on approve/reject instead of popping.
- **Small touches** — buttons press with a tactile scale, nav links get an animated underline, the navbar gains a shadow on scroll, skeletons use a shimmer sweep instead of a flat pulse, and the top deal-score tier gets a subtle recurring pulse.

## Deploying this

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full walkthrough — including an important note on why "frontend on Vercel/Netlify, backend on Render" isn't quite how this app is structured, what to use Render for instead, database provider recommendations (and a real gotcha with Render's free Postgres tier), and a post-deploy checklist.

## Security & production hardening

- **Passwords**: bcrypt, 12 rounds. Never logged, never returned in any API response.
- **Timing-safe login**: the credentials login always runs a bcrypt comparison, even for an email that doesn't exist (against a fixed dummy hash) — otherwise an unknown email returns near-instantly while a real one takes bcrypt's deliberate ~100-250ms, letting an attacker figure out which emails are registered just by timing responses.
- **Seed data**: admin/demo account passwords are randomly generated per-run and printed to your terminal once — never hardcoded, so they can't end up sitting in this README or your git history.
- **Rate limiting**: login and registration are rate-limited by IP via Upstash Redis (`src/lib/rate-limit.ts`) — gracefully disabled (with a loud startup warning) if you haven't configured it, so local dev works without setup, but you should enable it before going live. See `.env.example`.
- **Input validation**: every write-path API route validates its body with Zod before touching the database (`src/lib/validation/schemas.ts`), and every route that references another record by ID (a product, a category) confirms it actually exists before writing — otherwise a bad ID would surface as a raw database constraint error rather than a clean message.
- **No duplicate rows from double-submits**: setting a price alert on a product you already have one for updates it instead of creating a second row (wishlist already worked this way via an upsert).
- **Ownership scoping**: every wishlist/price-alert query and mutation is scoped to `userId: session.user.id` — there's no endpoint where passing someone else's record ID lets you read or modify their data.
- **Error messages don't leak internals in production**: an unexpected error (most commonly a database constraint violation) returns a generic message to the client in production while logging the real one server-side — the raw message is only ever shown in development, where it's useful for debugging.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, and `Strict-Transport-Security` are set on every response (`next.config.js`), and the `X-Powered-By` header is disabled. The CSP is a deliberately safe baseline (`'unsafe-inline'` for scripts/styles, required for Next.js hydration and Framer Motion's inline-style animations to work at all) — it still blocks arbitrary external script/style loading, clickjacking, and form/base-tag hijacking. A stricter nonce-based CSP is possible later but needs middleware changes, not something to guess at without testing.
- **Image domains**: `next.config.js` only allows known image hostnames (Unsplash for seed data, Amazon/Flipkart CDNs) rather than wildcarding all HTTPS hosts — a wildcard would let anyone use your `/next/image` endpoint as a free proxy for arbitrary images. Add your own CDN hostname here if you host product images elsewhere.
- **JSON-LD injection**: the product page's structured data escapes `<` before embedding, so a product name/description containing `</script>` can't break out of the tag.
- **No state-changing GET routes**: every route that reads data only reads; every write goes through POST/PATCH/DELETE, which real browsers won't cross-site-submit with cookies attached by default — a checked assumption, not a guess.
- **No raw SQL**: the one place this app touches the database outside the Prisma client (`/api/health`) uses a static, non-interpolated query — there's no SQL injection surface anywhere in the app.
- **Startup checks**: `src/instrumentation.ts` validates required env vars when the server boots and warns loudly in the logs if something's missing or misconfigured, rather than failing mysteriously on the first request.
- **Health check**: `GET /api/health` checks actual database connectivity (not just "is the process running") — point your uptime monitor at it.
- **Known gap**: no email verification on signup. Fine for a personal project; add it (e.g., via Resend/Postmark) before treating this as a product with real, unverified-by-you user accounts.

## Notes

> **Upgrading from an earlier version of this project?** This round changed dependency versions (Tailwind v4, React 19, Next 15.5) and added new env vars (Google OAuth). After pulling the new code:
> ```bash
> rm -rf node_modules package-lock.json .next
> npm install
> npm run db:generate
> ```
> If `npm install` still fails with an `ERESOLVE` error, the included `.npmrc` (`legacy-peer-deps=true`) should prevent that — delete `node_modules` and reinstall if you had a lockfile from before it was added.

> **Development transparency:** this project was built in a sandboxed environment without the ability to run `npm install` or `npm run build` against a real registry. Every file was written and manually reviewed for correctness (imports resolve, brackets balance, types line up), and I ran automated checks across the whole codebase looking for the class of bug that showed up earlier (a stray escaped quote inside a JSX attribute broke a build). That review is thorough but is not a substitute for an actual compile — please run `npm run build` after installing and send me the output if anything doesn't compile; most issues at this stage tend to be one-line fixes.

- Currency formatting defaults to INR (`en-IN` / `₹`); change `formatCurrency()` in `src/lib/utils.ts` if you need a different market.
- Product images use Unsplash placeholder URLs in the seed data. `next.config.js`'s `images.remotePatterns` is a real allowlist (not a wildcard) — add your own CDN hostname there if you host product images somewhere other than Unsplash/Amazon/Flipkart's CDNs, or image loading will fail with a clear Next.js error telling you which hostname to add.
- The credentials-based auth here is intentionally simple (email + password). Swap in OAuth providers (Google, etc.) by adding them to `src/lib/auth.ts`'s `providers` array.
