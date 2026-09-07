"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency, calculateDiscountPercent } from "@/lib/utils";
import type { ProductWithNumbers } from "@/types";

export function ProductCard({ product }: { product: ProductWithNumbers }) {
  const discount = calculateDiscountPercent(product.currentPrice, product.originalPrice);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-elevated transition-shadow duration-300 hover:shadow-elevated-lg"
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {discount > 0 && (
          <span className="glass-panel absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-destructive">
            -{discount}%
          </span>
        )}
        {product.isFeatured && (
          <span className="glass-panel absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-accent">
            Featured
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</p>
        <Link href={`/product/${product.slug}`} className="line-clamp-2 font-display text-sm font-semibold leading-snug transition-colors hover:text-primary">
          {product.name}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="tabular-price text-lg font-bold">{formatCurrency(product.currentPrice)}</span>
          {product.originalPrice > product.currentPrice && (
            <span className="tabular-price text-sm text-muted-foreground line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        <DealScoreBadge score={product.dealScore} label={product.dealLabel} className="w-fit" />

        <div className="mt-3 grid grid-cols-2 gap-2">
          {product.amazonUrl && (
            <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
              <a href={product.amazonAffiliateLink || product.amazonUrl} target="_blank" rel="noopener noreferrer sponsored">
                Amazon
              </a>
            </Button>
          )}
          {product.flipkartUrl && (
            <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
              <a href={product.flipkartAffiliateLink || product.flipkartUrl} target="_blank" rel="noopener noreferrer sponsored">
                Flipkart
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
