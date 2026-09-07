import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { calculateDealScore, calculateSixMonthAverage } from "@/lib/deal-score";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { productUpdateSchema } from "@/lib/validation/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, priceHistory: { orderBy: { timestamp: "desc" } } },
  });
  if (!product) return apiError("Not found", 404);
  return apiSuccess(product);
});

export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const parsed = productUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);
  const body = parsed.data;

  const existing = await prisma.product.findUnique({ where: { id }, include: { priceHistory: true } });
  if (!existing) return apiError("Not found", 404);

  if (body.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) return apiError("That category doesn't exist.", 400);
  }

  // Merge incoming fields over existing values, then recompute the deal score
  // so admin edits (price, rating, availability, etc.) always stay in sync.
  const merged = {
    currentPrice: body.currentPrice ?? Number(existing.currentPrice),
    originalPrice: body.originalPrice ?? Number(existing.originalPrice),
    rating: body.rating ?? existing.rating,
    reviewCount: body.reviewCount ?? existing.reviewCount,
    availability: body.availability ?? existing.availability,
  };

  const historyNumbers = existing.priceHistory.map((h) => ({ price: Number(h.price), timestamp: h.timestamp }));
  const sixMonthAverage = calculateSixMonthAverage(historyNumbers);

  const dealResult = calculateDealScore({
    ...merged,
    sixMonthAveragePrice: sixMonthAverage,
  });

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...body,
      dealScore: dealResult.score,
      dealLabel: dealResult.label,
    },
  });

  return apiSuccess(product);
});

export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return apiError("Not found", 404);

  await prisma.product.delete({ where: { id } });
  return apiSuccess({ deleted: true });
});
