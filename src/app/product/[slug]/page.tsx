import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { PriceChart } from "@/components/price-chart";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { ProductActions } from "@/components/product-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateDiscountPercent } from "@/lib/utils";
import {
  Star,
  ShieldCheck,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  History,
} from "lucide-react";

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
    title: `${product.name} - Price History & Deal Analysis`,
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
  const savings = product.originalPrice > product.currentPrice ? product.originalPrice - product.currentPrice : 0;
  const isLowestEver = lowestPrice > 0 && product.currentPrice <= lowestPrice;

  const diffPctVsAvg =
    sixMonthAverage && sixMonthAverage > 0
      ? Math.round(((sixMonthAverage - product.currentPrice) / sixMonthAverage) * 100)
      : null;

  // JSON-LD structured data for rich results (Product + Offer schema.org).
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    image: product.images,
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
    offers: [
      product.amazonUrl && {
        "@type": "Offer",
        url: product.amazonUrl,
        priceCurrency: "INR",
        price: product.currentPrice,
        availability:
          product.availability === "IN_STOCK"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Amazon" },
      },
      product.flipkartUrl && {
        "@type": "Offer",
        url: product.flipkartUrl,
        priceCurrency: "INR",
        price: product.currentPrice,
        availability:
          product.availability === "IN_STOCK"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Flipkart" },
      },
    ].filter(Boolean),
  };

  return (
    <div className="container py-10 md:py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      {/* Breadcrumb path */}
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/deals" className="hover:text-foreground">Deals</Link>
        <span>/</span>
        <span className="truncate text-foreground/80">{product.brand}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left Column: Media Gallery (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/70 bg-secondary/50 shadow-elevated">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
              )}
              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-xs font-extrabold text-white shadow-md">
                  -{discount}% OFF
                </span>
              )}
              {isLowestEver && (
                <span className="absolute right-4 top-4 rounded-full bg-signal px-3 py-1 text-xs font-bold text-signal-foreground shadow-md">
                  All-Time Low Price
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.slice(1, 6).map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-secondary/50 shadow-xs transition-opacity hover:opacity-80"
                  >
                    <Image src={img} alt={`${product.name} thumbnail ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Details & Buy Actions (7 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {product.brand}
              </span>
              <DealScoreBadge score={product.dealScore} label={product.dealLabel} />
              <Badge variant={product.availability === "IN_STOCK" ? "signal" : "outline"} className="text-xs">
                {product.availability.replace("_", " ")}
              </Badge>
            </div>

            <h1 className="headline mt-3 text-2xl font-extrabold sm:text-3xl md:text-4xl">
              {product.name}
            </h1>

            {product.rating > 0 && (
              <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{product.reviewCount.toLocaleString("en-IN")} verified reviews</span>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-elevated">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="tabular-price font-mono text-3xl font-extrabold text-foreground sm:text-4xl">
                {formatCurrency(product.currentPrice)}
              </span>
              {discount > 0 && (
                <>
                  <span className="tabular-price font-mono text-lg text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-bold text-signal">
                    Save {formatCurrency(savings)}
                  </span>
                </>
              )}
            </div>

            {/* Verdict text */}
            <div className="mt-3 flex items-center gap-2 text-sm font-medium">
              {diffPctVsAvg !== null ? (
                diffPctVsAvg > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-signal">
                    <TrendingDown className="h-4 w-4" />
                    Current price is {diffPctVsAvg}% cheaper than its 6-month average.
                  </span>
                ) : diffPctVsAvg < 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Price is currently {Math.abs(diffPctVsAvg)}% higher than 6-month average.
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Matches the 6-month typical average price.
                  </span>
                )
              ) : (
                <span className="text-muted-foreground">
                  Accumulating historical data points...
                </span>
              )}
            </div>

            {/* Matrix comparison cards */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-5 text-center sm:text-left">
              <div className="rounded-2xl bg-secondary/50 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">6-Mo Average</p>
                <p className="tabular-price mt-0.5 font-mono text-base font-bold sm:text-lg">
                  {sixMonthAverage ? formatCurrency(sixMonthAverage) : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">All-Time Low</p>
                <p className="tabular-price mt-0.5 font-mono text-base font-bold text-signal sm:text-lg">
                  {lowestPrice ? formatCurrency(lowestPrice) : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Deal Score</p>
                <p className="tabular-price mt-0.5 font-mono text-base font-bold text-primary sm:text-lg">
                  {product.dealScore} / 100
                </p>
              </div>
            </div>

            {/* Action Bar (Amazon / Flipkart / Wishlist / Alert) */}
            <div className="mt-6 border-t border-border/60 pt-6">
              <ProductActions
                productId={product.id}
                amazonUrl={product.amazonUrl}
                amazonLink={product.amazonAffiliateLink}
                flipkartUrl={product.flipkartUrl}
                flipkartLink={product.flipkartAffiliateLink}
                currentPrice={product.currentPrice}
              />
            </div>
          </div>

          {/* Retailer Direct Comparison Banner */}
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live Platform Availability
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {product.amazonUrl && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-card p-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-sm font-bold text-foreground">Amazon India</span>
                  </div>
                  <a
                    href={product.amazonAffiliateLink || product.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
                  >
                    View Store <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
              {product.flipkartUrl && (
                <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-card p-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-sm font-bold text-foreground">Flipkart</span>
                  </div>
                  <a
                    href={product.flipkartAffiliateLink || product.flipkartUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View Store <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Chart & Specs Section */}
      <div className="mt-14 grid gap-8 lg:grid-cols-12">
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-elevated lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-signal" />
              <h2 className="font-display text-xl font-bold">Historical Price Movement</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF9900]" /> Amazon
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2874F0]" /> Flipkart
              </span>
            </div>
          </div>
          <PriceChart history={priceHistory} />
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-elevated lg:col-span-4">
          <h2 className="mb-4 font-display text-lg font-bold">Product Summary</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}

