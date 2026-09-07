/**
 * Automatic deal finder.
 *
 * Important scope note: this does NOT scrape Amazon or Flipkart. It analyzes the
 * price history that already lives in our own database — the same PriceHistory
 * rows an admin enters manually today (see lib/scrapers/ for where an automated
 * data source would plug in later; nothing here changes if/when that happens).
 *
 * The finder never publishes anything on its own. It only proposes DealSuggestion
 * rows, which an admin reviews at /admin/deal-finder and explicitly approves before
 * a product is marked featured and shown prominently on the site.
 */

import { prisma } from "@/lib/prisma";
import { calculateDealScore, calculateSixMonthAverage } from "@/lib/deal-score";
import type { Product, PriceHistory } from "@prisma/client";

// Tunable thresholds — a product is worth surfacing if EITHER condition holds.
const MIN_DEAL_SCORE = 75; // "Great Deal" or better
const RECENT_DROP_WINDOW_DAYS = 14;
const RECENT_DROP_THRESHOLD_PCT = 12; // price fell at least this much within the window

export interface DealFinderResult {
  scanned: number;
  created: number;
  skippedAlreadyFeatured: number;
  skippedAlreadyPending: number;
  skippedBelowThreshold: number;
}

function buildReason(params: {
  score: number;
  label: string;
  discountPct: number;
  recentDropPct: number | null;
  sixMonthAverage: number | null;
}): string {
  const parts: string[] = [];
  if (params.discountPct > 0) parts.push(`${params.discountPct}% below its list price`);
  if (params.recentDropPct && params.recentDropPct >= RECENT_DROP_THRESHOLD_PCT) {
    parts.push(`dropped ${params.recentDropPct}% in the last ${RECENT_DROP_WINDOW_DAYS} days`);
  }
  if (params.sixMonthAverage) parts.push(`below its 6-month average of ₹${Math.round(params.sixMonthAverage).toLocaleString("en-IN")}`);
  const detail = parts.length ? parts.join(", ") : "meets the deal-score threshold";
  return `Scored ${params.score}/100 (${params.label}) — ${detail}.`;
}

/** Percent price drop between the oldest point inside the recent window and the current price. */
function recentDropPercent(history: PriceHistory[], currentPrice: number): number | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DROP_WINDOW_DAYS);

  const windowPoints = history.filter((h) => h.timestamp >= cutoff);
  if (windowPoints.length === 0) return null;

  const earliestInWindow = windowPoints.reduce((earliest, p) => (p.timestamp < earliest.timestamp ? p : earliest));
  const startPrice = Number(earliestInWindow.price);
  if (startPrice <= 0) return null;

  return Math.round(((startPrice - currentPrice) / startPrice) * 100);
}

async function evaluateProduct(
  product: Product & { priceHistory: PriceHistory[] }
): Promise<{ qualifies: boolean; score: number; label: string; reason: string } | null> {
  const currentPrice = Number(product.currentPrice);
  const originalPrice = Number(product.originalPrice);

  const historyNumbers = product.priceHistory.map((h) => ({ price: Number(h.price), timestamp: h.timestamp }));
  const sixMonthAverage = calculateSixMonthAverage(historyNumbers);

  const { score, label } = calculateDealScore({
    currentPrice,
    originalPrice,
    sixMonthAveragePrice: sixMonthAverage,
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.availability,
  });

  const discountPct = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const dropPct = recentDropPercent(product.priceHistory, currentPrice);

  const qualifies =
    product.availability !== "OUT_OF_STOCK" &&
    (score >= MIN_DEAL_SCORE || (dropPct !== null && dropPct >= RECENT_DROP_THRESHOLD_PCT));

  if (!qualifies) return null;

  return {
    qualifies,
    score,
    label,
    reason: buildReason({ score, label, discountPct, recentDropPct: dropPct, sixMonthAverage }),
  };
}

/**
 * Scans every non-featured product, evaluates it against the thresholds above, and
 * creates a PENDING DealSuggestion for anything that qualifies and doesn't already
 * have one pending. Safe to run repeatedly (e.g. from a daily cron job or an admin
 * "Run scan" button) — it's idempotent per product while a suggestion is pending.
 */
export async function findBestDeals(): Promise<DealFinderResult> {
  const [products, alreadyFeaturedCount] = await Promise.all([
    prisma.product.findMany({ where: { isFeatured: false }, include: { priceHistory: true } }),
    prisma.product.count({ where: { isFeatured: true } }),
  ]);

  const result: DealFinderResult = {
    scanned: products.length,
    created: 0,
    skippedAlreadyFeatured: alreadyFeaturedCount,
    skippedAlreadyPending: 0,
    skippedBelowThreshold: 0,
  };

  for (const product of products) {
    const evaluation = await evaluateProduct(product);
    if (!evaluation) {
      result.skippedBelowThreshold++;
      continue;
    }

    const existingPending = await prisma.dealSuggestion.findFirst({
      where: { productId: product.id, status: "PENDING" },
    });
    if (existingPending) {
      result.skippedAlreadyPending++;
      continue;
    }

    await prisma.dealSuggestion.create({
      data: {
        productId: product.id,
        score: evaluation.score,
        label: evaluation.label,
        reason: evaluation.reason,
        priceAtSuggestion: product.currentPrice,
      },
    });
    result.created++;
  }

  return result;
}
