import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { recalculateAndSaveDealScore } from "@/lib/products";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { priceHistoryUpdateSchema } from "@/lib/validation/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const parsed = priceHistoryUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);

  const existing = await prisma.priceHistory.findUnique({ where: { id } });
  if (!existing) return apiError("Not found", 404);

  const entry = await prisma.priceHistory.update({ where: { id }, data: parsed.data });
  await recalculateAndSaveDealScore(entry.productId);
  return apiSuccess(entry);
});

export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const entry = await prisma.priceHistory.findUnique({ where: { id } });
  if (!entry) return apiError("Not found", 404);

  await prisma.priceHistory.delete({ where: { id } });
  await recalculateAndSaveDealScore(entry.productId);

  return apiSuccess({ deleted: true });
});
