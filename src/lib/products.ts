import { prisma } from "@/lib/prisma";
import { calculateDealScore, calculateSixMonthAverage, calculateLowestPrice } from "@/lib/deal-score";
import type { ProductWithNumbers, PriceHistoryPoint } from "@/types";
import type { Product, Category, PriceHistory } from "@prisma/client";

type ProductWithCategory = Product & { category: Category };

/** Converts Prisma's Decimal fields to plain numbers so the object can cross the server/client boundary. */
export function serializeProduct(product: ProductWithCategory): ProductWithNumbers {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryId: product.categoryId,
    category: { id: product.category.id, name: product.category.name, slug: product.category.slug },
    description: product.description,
    images: product.images,
    amazonUrl: product.amazonUrl,
    flipkartUrl: product.flipkartUrl,
    amazonAffiliateLink: product.amazonAffiliateLink,
    flipkartAffiliateLink: product.flipkartAffiliateLink,
    currentPrice: Number(product.currentPrice),
    originalPrice: Number(product.originalPrice),
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.availability,
    dealScore: product.dealScore,
    dealLabel: product.dealLabel,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function serializePriceHistory(history: PriceHistory[]): PriceHistoryPoint[] {
  return history.map((h) => ({
    id: h.id,
    price: Number(h.price),
    platform: h.platform,
    timestamp: h.timestamp.toISOString(),
  }));
}

const withCategory = { category: true } as const;

export async function getFeaturedDeals(limit = 8) {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      orderBy: { dealScore: "desc" },
      take: limit,
      include: withCategory,
    });
    return products.map(serializeProduct);
  } catch (err) {
    console.error("Failed to load featured deals:", err);
    return [];
  }
}

export async function getTrendingProducts(limit = 8) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { reviewCount: "desc" },
      take: limit,
      include: withCategory,
    });
    return products.map(serializeProduct);
  } catch (err) {
    console.error("Failed to load trending products:", err);
    return [];
  }
}

export async function getLowestPriceProducts(limit = 8) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { dealScore: "desc" },
      where: { availability: { not: "OUT_OF_STOCK" } },
      take: limit,
      include: withCategory,
    });
    return products.map(serializeProduct);
  } catch (err) {
    console.error("Failed to load lowest price products:", err);
    return [];
  }
}

export async function getRecentlyAddedProducts(limit = 8) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: withCategory,
    });
    return products.map(serializeProduct);
  } catch (err) {
    console.error("Failed to load recently added products:", err);
    return [];
  }
}

export interface DealsFilter {
  categorySlug?: string;
  sort?: "discount" | "price_asc" | "deal_score" | "latest";
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getDeals(filter: DealsFilter) {
  const { categorySlug, sort = "discount", search, page = 1, pageSize = 12 } = filter;

  const where = {
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { currentPrice: "asc" as const }
      : sort === "deal_score"
      ? { dealScore: "desc" as const }
      : sort === "latest"
      ? { createdAt: "desc" as const }
      : { dealScore: "desc" as const }; // "discount" - dealScore already weights discount heavily; see note below

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true, priceHistory: true },
    }),
    prisma.product.count({ where }),
  ]);

  const enriched = products.map((product) => {
    const historyNumbers = product.priceHistory.map((h) => ({ price: Number(h.price), timestamp: h.timestamp }));
    return {
      product: serializeProduct(product),
      sixMonthAverage: calculateSixMonthAverage(historyNumbers),
      lowestPrice: calculateLowestPrice(historyNumbers, Number(product.currentPrice)),
    };
  });

  return { products: enriched, total, page, pageSize };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, priceHistory: { orderBy: { timestamp: "asc" } } },
  });
  if (!product) return null;

  const historyNumbers = product.priceHistory.map((h) => ({ price: Number(h.price), timestamp: h.timestamp }));
  const sixMonthAverage = calculateSixMonthAverage(historyNumbers);
  const lowestPrice = calculateLowestPrice(historyNumbers, Number(product.currentPrice));

  return {
    product: serializeProduct(product),
    priceHistory: serializePriceHistory(product.priceHistory),
    sixMonthAverage,
    lowestPrice,
  };
}

export async function getAllCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch (err) {
    console.error("Failed to load categories:", err);
    return [];
  }
}

/** Recalculates and persists a product's deal score based on its current data + price history. */
export async function recalculateAndSaveDealScore(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { priceHistory: true } });
  if (!product) return null;

  const historyNumbers = product.priceHistory.map((h) => ({ price: Number(h.price), timestamp: h.timestamp }));
  const sixMonthAverage = calculateSixMonthAverage(historyNumbers);

  const result = calculateDealScore({
    currentPrice: Number(product.currentPrice),
    originalPrice: Number(product.originalPrice),
    sixMonthAveragePrice: sixMonthAverage,
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.availability,
  });

  return prisma.product.update({
    where: { id: productId },
    data: { dealScore: result.score, dealLabel: result.label },
  });
}
