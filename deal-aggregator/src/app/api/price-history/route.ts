import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { recalculateAndSaveDealScore } from "@/lib/products";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { priceHistoryCreateSchema } from "@/lib/validation/schemas";

export const GET = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return apiError("productId is required", 400);

  const history = await prisma.priceHistory.findMany({ where: { productId }, orderBy: { timestamp: "desc" } });
  return apiSuccess(history);
});

export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const parsed = priceHistoryCreateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);
  const { productId, price, platform, timestamp } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return apiError("That product doesn't exist.", 400);

  const entry = await prisma.priceHistory.create({ data: { productId, price, platform, timestamp } });

  // A new historical price point changes the 6-month average, so refresh the deal score.
  await recalculateAndSaveDealScore(productId);

  return apiSuccess(entry, 201);
});
