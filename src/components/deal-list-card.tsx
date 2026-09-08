import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, TrendingDown, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency, calculateDiscountPercent } from "@/lib/utils";
import type { ProductWithNumbers } from "@/types";

interface DealListCardProps {
  product: ProductWithNumbers;
  sixMonthAverage: number | null;
  lowestPrice: number;
}

export function DealListCard({ product, sixMonthAverage, lowestPrice }: DealListCardProps) {
  const discount = calculateDiscountPercent(product.currentPrice, product.originalPrice);
  const savings = product.originalPrice > product.currentPrice ? product.originalPrice - product.currentPrice : 0;
  const isLowestEver = lowestPrice > 0 && product.currentPrice <= lowestPrice;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-elevated transition-all duration-300 hover:border-primary/40 hover:shadow-elevated-lg sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Product Image */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block h-44 w-full shrink-0 overflow-hidden rounded-xl bg-secondary/50 sm:h-36 sm:w-36"
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 144px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
          {discount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
              -{discount}%
            </span>
          )}
          {isLowestEver && (
            <span className="absolute bottom-2 left-2 rounded-full bg-signal px-2 py-0.5 text-[10px] font-bold text-signal-foreground shadow-xs">
              Lowest Ever
            </span>
          )}
        </Link>

        {/* Content & Comparison Matrix */}
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{product.brand}</span>
              <DealScoreBadge score={product.dealScore} label={product.dealLabel} />
            </div>

            <Link
              href={`/product/${product.slug}`}
              className="mt-1 line-clamp-2 font-display text-base font-bold leading-snug transition-colors hover:text-primary"
            >
              {product.name}
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/40 p-2.5 sm:grid-cols-4 sm:gap-4">
            <Stat
              label="Current Price"
              value={formatCurrency(product.currentPrice)}
              highlight="text-foreground font-extrabold text-base sm:text-lg"
            />
            <Stat
              label="6-Mo Average"
              value={sixMonthAverage ? formatCurrency(sixMonthAverage) : "—"}
            />
            <Stat
              label="All-Time Low"
              value={formatCurrency(lowestPrice)}
              highlight={isLowestEver ? "text-signal font-bold" : undefined}
            />
            <Stat
              label="Instant Savings"
              value={savings > 0 ? formatCurrency(savings) : "—"}
              highlight={savings > 0 ? "text-signal font-bold" : undefined}
            />
          </div>

          {/* Direct Store Checkout Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {product.amazonUrl && (
                <a
                  href={product.amazonAffiliateLink || product.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
                >
                  <span>Amazon India</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              {product.flipkartUrl && (
                <a
                  href={product.flipkartAffiliateLink || product.flipkartUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-900 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
                >
                  <span>Flipkart</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <Button asChild size="sm" variant="ghost" className="text-xs font-semibold hover:bg-secondary">
              <Link href={`/product/${product.slug}`}>
                View Full Analysis &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={`tabular-price font-mono ${highlight || "text-sm font-semibold text-foreground/90"}`}>{value}</p>
    </div>
  );
}

