import { Hero } from "@/components/hero";
import { TrustSection } from "@/components/trust-section";
import { SectionHeader } from "@/components/section-header";
import { ProductCard } from "@/components/product-card";
import { RevealGrid, RevealItem } from "@/components/reveal-grid";
import {
  getFeaturedDeals,
  getTrendingProducts,
  getLowestPriceProducts,
  getRecentlyAddedProducts,
  getAllCategories,
} from "@/lib/products";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Package } from "lucide-react";

export const revalidate = 300; // ISR: refresh homepage sections every 5 minutes

const GRID_CLASSES = "grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6";

export default async function HomePage() {
  const [featured, trending, lowestPrice, recent, categories] = await Promise.all([
    getFeaturedDeals(8),
    getTrendingProducts(8),
    getLowestPriceProducts(8),
    getRecentlyAddedProducts(8),
    getAllCategories(),
  ]);

  return (
    <>
      <Hero />

      <section className="container py-20 md:py-28">
        <SectionHeader title="Today's Best Deals" subtitle="Hand-picked by our team, highest deal scores first." href="/deals" />
        {featured.length > 0 ? (
          <RevealGrid className={GRID_CLASSES}>
            {featured.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealGrid>
        ) : (
          <EmptyState message="No featured deals yet. Mark products as featured from the admin dashboard." />
        )}
      </section>

      <section className="border-y bg-card py-20 md:py-28">
        <div className="container">
          <SectionHeader title="Categories" subtitle="Browse deals by product type." href="/categories" />
          <RevealGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((c) => {
              const Icon = (c.icon && (Icons as any)[toPascalCase(c.icon)]) || Package;
              return (
                <RevealItem key={c.id}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="group flex flex-col items-center gap-3 rounded-2xl bg-background p-6 text-center shadow-elevated transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated-lg"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{c.name}</span>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGrid>
        </div>
      </section>

      <TrustSection />

      <section className="container py-20 md:py-28">
        <SectionHeader title="Trending Products" subtitle="Most reviewed products right now." href="/deals?sort=deal_score" />
        {trending.length > 0 ? (
          <RevealGrid className={GRID_CLASSES}>
            {trending.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealGrid>
        ) : (
          <EmptyState message="No products yet — add some from the admin dashboard." />
        )}
      </section>

      <section className="border-t bg-card py-20 md:py-28">
        <div className="container">
          <SectionHeader title="Lowest Price Products" subtitle="Best deal scores, in-stock right now." href="/deals?sort=deal_score" />
          {lowestPrice.length > 0 ? (
            <RevealGrid className={GRID_CLASSES}>
              {lowestPrice.map((p) => (
                <RevealItem key={p.id}>
                  <ProductCard product={p} />
                </RevealItem>
              ))}
            </RevealGrid>
          ) : (
            <EmptyState message="No in-stock products yet." />
          )}
        </div>
      </section>

      <section className="container py-20 md:py-28">
        <SectionHeader title="Recently Added Deals" subtitle="Newest additions to the catalog." href="/deals?sort=latest" />
        {recent.length > 0 ? (
          <RevealGrid className={GRID_CLASSES}>
            {recent.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealGrid>
        ) : (
          <EmptyState message="Nothing added yet. Head to /admin to add your first product." />
        )}
      </section>
    </>
  );
}

function toPascalCase(s: string) {
  return s.replace(/(^\w|-\w)/g, (c) => c.replace("-", "").toUpperCase());
}

function EmptyState({ message }: { message: string }) {
  return <div className="animate-fade-in rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{message}</div>;
}
