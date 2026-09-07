import { requireAdmin } from "@/lib/require-admin";
import { calculateDealScore } from "@/lib/deal-score";
import { apiSuccess, withErrorHandling } from "@/lib/api-response";

/** Lets the admin product form preview a deal score live, before the product is saved. */
export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await request.json();
  const result = calculateDealScore({
    currentPrice: Number(body.currentPrice) || 0,
    originalPrice: Number(body.originalPrice) || 0,
    sixMonthAveragePrice: body.sixMonthAveragePrice ? Number(body.sixMonthAveragePrice) : null,
    rating: Number(body.rating) || 0,
    reviewCount: Number(body.reviewCount) || 0,
    availability: body.availability || "IN_STOCK",
  });

  return apiSuccess(result);
});
