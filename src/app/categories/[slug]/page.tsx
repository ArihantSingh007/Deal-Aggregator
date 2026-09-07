import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDeals } from "@/lib/products";
import { DealListCard } from "@/components/deal-list-card";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Browse the best tracked deals in ${category.name} across Amazon and Flipkart.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const { products, total } = await getDeals({ categorySlug: slug, sort: "deal_score", pageSize: 24 });

  return (
    <div className="container py-14 md:py-16">
      <h1 className="headline text-4xl md:text-5xl">{category.name}</h1>
      <p className="mt-2 text-base text-muted-foreground">{total} tracked product{total === 1 ? "" : "s"}</p>

      <div className="mt-10 flex flex-col gap-4">
        {products.length > 0 ? (
          products.map(({ product, sixMonthAverage, lowestPrice }) => (
            <DealListCard key={product.id} product={product} sixMonthAverage={sixMonthAverage} lowestPrice={lowestPrice} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-16 text-center text-sm text-muted-foreground">
            No products in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
