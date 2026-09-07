import type { Metadata } from "next";
import Link from "next/link";
import { getDeals, getAllCategories } from "@/lib/products";
import { DealFilters } from "@/components/deal-filters";
import { DealListCard } from "@/components/deal-list-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Today's Deals",
  description: "Browse every tracked deal from Amazon and Flipkart, filterable by category and sortable by discount, price, or deal score.",
};

interface DealsPageProps {
  searchParams: Promise<{ category?: string; sort?: string; search?: string; page?: string }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ products, total, pageSize }, categories] = await Promise.all([
    getDeals({
      categorySlug: params.category,
      sort: (params.sort as any) || "discount",
      search: params.search,
      page,
    }),
    getAllCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container py-14 md:py-16">
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="headline text-4xl md:text-5xl">Today's Deals</h1>
          <p className="mt-2 text-base text-muted-foreground">
            {total} tracked product{total === 1 ? "" : "s"}
            {params.search ? ` matching "${params.search}"` : ""}
          </p>
        </div>
        <DealFilters categories={categories} />
      </div>

      {products.length > 0 ? (
        <div className="flex flex-col gap-4">
          {products.map(({ product, sixMonthAverage, lowestPrice }) => (
            <DealListCard key={product.id} product={product} sixMonthAverage={sixMonthAverage} lowestPrice={lowestPrice} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-16 text-center text-sm text-muted-foreground">
          No products match these filters yet.
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const cleanParams = Object.fromEntries(
              Object.entries({ ...params, page: String(p) }).filter(([, v]) => v !== undefined)
            ) as Record<string, string>;
            const search = new URLSearchParams(cleanParams).toString();
            return (
              <Button key={p} asChild variant={p === page ? "default" : "outline"} size="sm" className="rounded-full">
                <Link href={`/deals?${search}`}>{p}</Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
