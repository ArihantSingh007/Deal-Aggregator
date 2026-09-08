import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { findBestDeals } from "@/lib/deal-finder";
import { serializeProduct } from "@/lib/products";
import { apiSuccess, withErrorHandling } from "@/lib/api-response";

/** Lists deal suggestions, most recent first. Defaults to PENDING only; pass ?status=all for everything. */
export const GET = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const suggestions = await prisma.dealSuggestion.findMany({
    where: status === "all" ? undefined : { status: (status as "PENDING" | "APPROVED" | "REJECTED") ?? "PENDING" },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = suggestions.map((s) => ({
    id: s.id,
    score: s.score,
    label: s.label,
    reason: s.reason,
    priceAtSuggestion: Number(s.priceAtSuggestion),
    createdAt: s.createdAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    product: serializeProduct(s.product),
  }));

  return apiSuccess(serialized);
});

/** Runs the deal finder now. In production, call this from a scheduled job (cron / Vercel Cron) instead of a button. */
export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;

  const result = await findBestDeals();
  return apiSuccess(result);
});
