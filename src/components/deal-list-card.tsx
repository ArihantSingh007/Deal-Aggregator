import Image from "next/image";
import Link from "next/link";
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
  const savings = product.originalPrice - product.currentPrice;

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-elevated transition-shadow duration-300 hover:shadow-elevated-lg">
      <div className="flex flex-col sm:flex-row">
        <Link href={`/product/${product.slug}`} className="relative block h-48 shrink-0 bg-secondary sm:h-auto sm:w-48">
          {product.images[0] && (
            <Image src={product.images[0]} alt={product.name} fill sizes="192px" className="object-cover" />
          )}
          {discount > 0 && (
            <span className="glass-panel absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-destructive">
              -{discount}%
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</p>
              <Link href={`/product/${product.slug}`} className="font-display text-base font-semibold hover:underline">
                {product.name}
              </Link>
            </div>
            <DealScoreBadge score={product.dealScore} label={product.dealLabel} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
            <Stat label="Current price" value={formatCurrency(product.currentPrice)} emphasize />
            <Stat label="6-mo average" value={sixMonthAverage ? formatCurrency(sixMonthAverage) : "—"} />
            <Stat label="Lowest ever" value={formatCurrency(lowestPrice)} />
            <Stat label="You save" value={savings > 0 ? formatCurrency(savings) : "—"} />
          </div>

          <div className="mt-auto flex gap-2 pt-2">
            {product.amazonUrl && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={product.amazonAffiliateLink || product.amazonUrl} target="_blank" rel="noopener noreferrer sponsored">
                  Buy on Amazon
                </a>
              </Button>
            )}
            {product.flipkartUrl && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={product.flipkartAffiliateLink || product.flipkartUrl} target="_blank" rel="noopener noreferrer sponsored">
                  Buy on Flipkart
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular-price ${emphasize ? "text-base font-bold" : "text-sm font-medium"}`}>{value}</p>
    </div>
  );
}
