import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";
import { calculateDealScore } from "@/lib/deal-score";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { productCreateSchema } from "@/lib/validation/schemas";

export const GET = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;

  const products = await prisma.product.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(products);
});

export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const parsed = productCreateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);
  const body = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category) return apiError("That category doesn't exist.", 400);

  // Ensure a unique, SEO-friendly slug even if two products share a name.
  const baseSlug = slugify(body.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const dealResult = calculateDealScore({
    currentPrice: body.currentPrice,
    originalPrice: body.originalPrice,
    sixMonthAveragePrice: null,
    rating: body.rating,
    reviewCount: body.reviewCount,
    availability: body.availability,
  });

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      brand: body.brand,
      categoryId: body.categoryId,
      description: body.description,
      images: body.images,
      amazonUrl: body.amazonUrl,
      flipkartUrl: body.flipkartUrl,
      amazonAffiliateLink: body.amazonAffiliateLink,
      flipkartAffiliateLink: body.flipkartAffiliateLink,
      currentPrice: body.currentPrice,
      originalPrice: body.originalPrice,
      rating: body.rating,
      reviewCount: body.reviewCount,
      availability: body.availability,
      isFeatured: body.isFeatured,
      dealScore: dealResult.score,
      dealLabel: dealResult.label,
    },
  });

  // Seed the first price-history entries from the initial prices so the chart isn't empty.
  const historyEntries = [];
  if (body.amazonUrl) historyEntries.push({ productId: product.id, price: body.currentPrice, platform: "AMAZON" as const });
  if (body.flipkartUrl) historyEntries.push({ productId: product.id, price: body.currentPrice, platform: "FLIPKART" as const });
  if (historyEntries.length) await prisma.priceHistory.createMany({ data: historyEntries });

  return apiSuccess(product, 201);
});
