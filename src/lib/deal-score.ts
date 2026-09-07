/**
 * Deal scoring algorithm.
 *
 * Produces a 0-100 score describing how good a deal currently is, weighted as:
 *   - 40% discount vs. the product's original (list) price
 *   - 30% how far the current price sits below its trailing 6-month average
 *   - 20% product rating (out of 5 stars)
 *   - 10% availability / popularity signal (in-stock + review volume)
 *
 * The function is pure and side-effect free so it can be unit tested and reused
 * from API routes, server components, and the seed script alike.
 */

import type { Availability } from "@prisma/client";

export interface DealScoreInput {
  currentPrice: number;
  originalPrice: number;
  sixMonthAveragePrice: number | null; // null when there isn't enough history yet
  rating: number; // 0-5
  reviewCount: number;
  availability: Availability;
}

export interface DealScoreResult {
  score: number;
  label: "Excellent Deal" | "Great Deal" | "Good Deal" | "Normal Price";
  breakdown: {
    discountScore: number;
    averageComparisonScore: number;
    ratingScore: number;
    popularityScore: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 40%: percentage off the original list price, scaled so a 50%+ discount maxes this factor out. */
function scoreDiscount(currentPrice: number, originalPrice: number): number {
  if (originalPrice <= 0) return 0;
  const discountPct = (originalPrice - currentPrice) / originalPrice;
  const normalized = clamp(discountPct / 0.5, 0, 1); // 50% off = full marks
  return normalized * 40;
}

/** 30%: how far below the trailing 6-month average the current price is. */
function scoreAverageComparison(currentPrice: number, sixMonthAverage: number | null): number {
  if (!sixMonthAverage || sixMonthAverage <= 0) return 15; // neutral half-credit without enough history
  const diffPct = (sixMonthAverage - currentPrice) / sixMonthAverage;
  const normalized = clamp(diffPct / 0.3, -1, 1); // -30%/+30% band
  return ((normalized + 1) / 2) * 30; // remap [-1,1] -> [0,30]
}

/** 20%: straightforward rating out of 5 stars. */
function scoreRating(rating: number): number {
  return clamp(rating / 5, 0, 1) * 20;
}

/** 10%: in-stock items with more reviews are weighted as more reliable/popular deals. */
function scorePopularity(availability: Availability, reviewCount: number): number {
  const stockFactor = availability === "IN_STOCK" ? 1 : availability === "LIMITED_STOCK" ? 0.6 : 0.1;
  const reviewFactor = clamp(Math.log10(reviewCount + 1) / 4, 0, 1); // log-scale, caps around 10k reviews
  return ((stockFactor + reviewFactor) / 2) * 10;
}

function labelFor(score: number): DealScoreResult["label"] {
  if (score >= 90) return "Excellent Deal";
  if (score >= 75) return "Great Deal";
  if (score >= 50) return "Good Deal";
  return "Normal Price";
}

export function calculateDealScore(input: DealScoreInput): DealScoreResult {
  const discountScore = scoreDiscount(input.currentPrice, input.originalPrice);
  const averageComparisonScore = scoreAverageComparison(input.currentPrice, input.sixMonthAveragePrice);
  const ratingScore = scoreRating(input.rating);
  const popularityScore = scorePopularity(input.availability, input.reviewCount);

  const total = discountScore + averageComparisonScore + ratingScore + popularityScore;
  const score = Math.round(clamp(total, 0, 100));

  return {
    score,
    label: labelFor(score),
    breakdown: {
      discountScore: Math.round(discountScore * 10) / 10,
      averageComparisonScore: Math.round(averageComparisonScore * 10) / 10,
      ratingScore: Math.round(ratingScore * 10) / 10,
      popularityScore: Math.round(popularityScore * 10) / 10,
    },
  };
}

/** Computes the arithmetic mean price from a set of PriceHistory rows over the last 6 months. */
export function calculateSixMonthAverage(prices: { price: number; timestamp: Date }[]): number | null {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recent = prices.filter((p) => p.timestamp >= sixMonthsAgo);
  if (recent.length === 0) return null;

  const sum = recent.reduce((acc, p) => acc + p.price, 0);
  return sum / recent.length;
}

export function calculateLowestPrice(prices: { price: number }[], currentPrice: number): number {
  if (prices.length === 0) return currentPrice;
  return Math.min(currentPrice, ...prices.map((p) => p.price));
}
