import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getDataSource } from "@/lib/scrapers";
import { recalculateAndSaveDealScore } from "@/lib/products";
import { apiSuccess, withErrorHandling } from "@/lib/api-response";
import type { Platform, Product } from "@prisma/client";

// Serverless platforms (Vercel, Netlify) enforce a hard wall-clock timeout per
// request — as low as 10s on free tiers, up to 60s on paid tiers without extra
// configuration. This route intentionally paces requests to respect Amazon/
// Flipkart rate limits, so it MUST cap how much *work* (API calls) it does per
// invocation rather than looping over the whole catalog — otherwise it
// silently gets killed mid-run on every host except a long-lived server.
export const maxDuration = 60;

// PA-API is aggressively rate-limited for new/low-volume Associates accounts
// (often 1 request/second). This delay keeps a refresh from tripping
// throttling on either platform. Tune down once your Amazon quota grows.
const DELAY_BETWEEN_REQUESTS_MS = 1100;

// The real unit of work is one (product, platform) price check — a product
// with both an Amazon and a Flipkart URL costs two. Capping *this* number
// (not the product count) is what actually bounds wall-clock time: at ~1.2s
// per check, 30 checks is ~36s, comfortably inside a 60s budget with room for
// slow responses. Call this route again (or on a repeating schedule) to work
// through a larger catalog — it always processes the least-recently-updated
// products first, so repeated calls naturally round-robin through everything.
const MAX_CHECKS_PER_RUN = 30;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RefreshOutcome {
  productId: string;
  name: string;
  platform: Platform;
  status: "updated" | "unchanged" | "error";
  oldPrice?: number;
  newPrice?: number;
  error?: string;
}

interface CheckTarget {
  product: Product;
  platform: Platform;
  url: string;
}

/**
 * Pulls the current live price for a bounded number of (product, platform)
 * pairs from Amazon/Flipkart's official APIs, records a new PriceHistory
 * entry when the price has moved, and recalculates affected deal scores.
 * Chain this with /api/admin/deal-finder on a cron schedule for a hands-off
 * pipeline — see README "Automatic deal finder" section.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;

  const totalTrackedCount = await prisma.product.count({
    where: { OR: [{ amazonUrl: { not: null } }, { flipkartUrl: { not: null } }] },
  });

  // Fetch a generous candidate pool (worst case every product has both
  // platforms, so 2x headroom guarantees enough targets to fill a full batch
  // whenever one exists) ordered so the stalest data gets checked first.
  const candidateProducts = await prisma.product.findMany({
    where: { OR: [{ amazonUrl: { not: null } }, { flipkartUrl: { not: null } }] },
    orderBy: { updatedAt: "asc" },
    take: MAX_CHECKS_PER_RUN * 2,
  });

  const allTargets: CheckTarget[] = candidateProducts.flatMap((product) => {
    const targets: CheckTarget[] = [];
    if (product.amazonUrl) targets.push({ product, platform: "AMAZON", url: product.amazonUrl });
    if (product.flipkartUrl) targets.push({ product, platform: "FLIPKART", url: product.flipkartUrl });
    return targets;
  });

  const batch = allTargets.slice(0, MAX_CHECKS_PER_RUN);
  const outcomes: RefreshOutcome[] = [];
  const touchedProductIds = new Set<string>();

  for (const target of batch) {
    touchedProductIds.add(target.product.id);

    try {
      const dataSource = getDataSource(target.platform);
      const newPrice = await dataSource.fetchCurrentPrice(target.url);
      const oldPrice = Number(target.product.currentPrice);

      if (Math.abs(newPrice - oldPrice) > 0.01) {
        await prisma.priceHistory.create({
          data: { productId: target.product.id, price: newPrice, platform: target.platform },
        });
        // Only overwrite the product's headline currentPrice from the platform
        // the admin marked primary would require extra logic; for now the most
        // recently fetched platform "wins" — simplest correct behavior when a
        // product only has one retailer link, which is the common case.
        await prisma.product.update({ where: { id: target.product.id }, data: { currentPrice: newPrice } });
        outcomes.push({ productId: target.product.id, name: target.product.name, platform: target.platform, status: "updated", oldPrice, newPrice });
      } else {
        // Touch updatedAt even when unchanged, so this product moves to the
        // back of the "least-recently-refreshed" queue for the next run.
        await prisma.product.update({ where: { id: target.product.id }, data: { updatedAt: new Date() } });
        outcomes.push({ productId: target.product.id, name: target.product.name, platform: target.platform, status: "unchanged", oldPrice, newPrice });
      }
    } catch (err) {
      outcomes.push({
        productId: target.product.id,
        name: target.product.name,
        platform: target.platform,
        status: "error",
        error: (err as Error).message,
      });
    }

    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  for (const productId of touchedProductIds) {
    await recalculateAndSaveDealScore(productId);
  }

  const summary = {
    checksPerformed: batch.length,
    updated: outcomes.filter((o) => o.status === "updated").length,
    unchanged: outcomes.filter((o) => o.status === "unchanged").length,
    errors: outcomes.filter((o) => o.status === "error").length,
    totalTracked: totalTrackedCount,
    hasMore: allTargets.length > batch.length || totalTrackedCount > candidateProducts.length,
    details: outcomes,
  };

  return apiSuccess(summary);
});
