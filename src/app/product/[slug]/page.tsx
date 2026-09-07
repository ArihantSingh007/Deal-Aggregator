import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { PriceChart } from "@/components/price-chart";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { ProductActions } from "@/components/product-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateDiscountPercent } from "@/lib/utils";
import { Star } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };

  const { product } = data;
  const description = `${product.name} is currently ${formatCurrency(product.currentPrice)} on Amazon & Flipkart — ${product.dealLabel.toLowerCase()}. See 6-month price history and compare platforms.`;

  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.images.slice(0, 1) },
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();

  const { product, priceHistory, sixMonthAverage, lowestPrice } = data;
  const discount = calculateDiscountPercent(product.currentPrice, product.originalPrice);

  const vsAverageText =
    sixMonthAverage && sixMonthAverage > 0
      ? (() => {
          const diffPct = Math.round(((sixMonthAverage - product.currentPrice) / sixMonthAverage) * 100);
          if (diffPct > 0) return `Current price is ${diffPct}% lower than its 6-month average price.`;
          if (diffPct < 0) return `Current price is ${Math.abs(diffPct)}% higher than its 6-month average price.`;
          return "Current price matches its 6-month average price.";
        })()
      : "Not enough price history yet to compare against a 6-month average.";

  // JSON-LD structured data for rich results (Product + Offer schema.org).
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    image: product.images,
    aggregateRating: product.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    } : undefined,
    offers: [
      product.amazonUrl && {
        "@type": "Offer",
        url: product.amazonUrl,
        priceCurrency: "INR",
        price: product.currentPrice,
        availability: product.availability === "IN_STOCK" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Amazon" },
      },
      product.flipkartUrl && {
        "@type": "Offer",
        url: product.flipkartUrl,
        priceCurrency: "INR",
        price: product.currentPrice,
        availability: product.availability === "IN_STOCK" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Flipkart" },
      },
    ].filter(Boolean),
  };

  return (
    <div className="container py-14 md:py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        // JSON.stringify doesn't escape "<", so a product name/description containing
        // "</script>" could otherwise break out of this tag and inject arbitrary HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="animate-fade-in-up">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary shadow-elevated">
            {product.images[0] && (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.slice(1, 6).map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-secondary shadow-elevated">
                  <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</p>
            <h1 className="headline mt-1 text-3xl md:text-4xl">{product.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {product.rating > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-accent text-accent" />
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()} reviews)
              </span>
            )}
            <Badge variant={product.availability === "IN_STOCK" ? "signal" : "outline"}>
              {product.availability.replace("_", " ")}
            </Badge>
            <DealScoreBadge score={product.dealScore} label={product.dealLabel} />
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-elevated">
            <div className="flex items-baseline gap-3">
              <span className="tabular-price text-3xl font-bold">{formatCurrency(product.currentPrice)}</span>
              {discount > 0 && (
                <>
                  <span className="tabular-price text-lg text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <Badge variant="destructive">-{discount}%</Badge>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-signal">{vsAverageText}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">6-month average</p>
                <p className="tabular-price font-semibold">{sixMonthAverage ? formatCurrency(sixMonthAverage) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lowest ever</p>
                <p className="tabular-price font-semibold">{formatCurrency(lowestPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deal score</p>
                <p className="tabular-price font-semibold">{product.dealScore} / 100</p>
              </div>
            </div>
          </div>

          <ProductActions productId={product.id} amazonUrl={product.amazonUrl} amazonLink={product.amazonAffiliateLink}
            flipkartUrl={product.flipkartUrl} flipkartLink={product.flipkartAffiliateLink} currentPrice={product.currentPrice} />
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-6 shadow-elevated lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-bold">6-month price history</h2>
          <PriceChart history={priceHistory} />
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-bold">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        </div>
      </div>
    </div>
  );
}
