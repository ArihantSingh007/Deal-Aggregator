import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { dealSuggestionReviewSchema } from "@/lib/validation/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Approving a suggestion marks the underlying product as featured (so it starts
 * showing in "Today's Best Deals" etc.) and records the suggestion as APPROVED.
 * Rejecting just marks it REJECTED — the product is untouched either way, and a
 * rejected product can still be surfaced again later if its price changes further.
 */
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const parsed = dealSuggestionReviewSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);
  const { action } = parsed.data;

  const suggestion = await prisma.dealSuggestion.findUnique({ where: { id } });
  if (!suggestion) return apiError("Not found", 404);
  if (suggestion.status !== "PENDING") return apiError("This suggestion has already been reviewed.", 409);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.dealSuggestion.update({
      where: { id },
      data: { status: action === "approve" ? "APPROVED" : "REJECTED", reviewedAt: new Date() },
    });

    if (action === "approve") {
      await tx.product.update({ where: { id: suggestion.productId }, data: { isFeatured: true } });
    }

    return result;
  });

  return apiSuccess(updated);
});
