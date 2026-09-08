"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Heart, Bell, ExternalLink, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency, calculateDiscountPercent } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { ProductWithNumbers } from "@/types";

export function ProductCard({ product }: { product: ProductWithNumbers }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const discount = calculateDiscountPercent(product.currentPrice, product.originalPrice);
  const savings = product.originalPrice > product.currentPrice ? product.originalPrice - product.currentPrice : 0;

  async function handleQuickWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      toast({ title: "Sign in required", description: "Sign in to add items to your wishlist.", variant: "default" });
      router.push("/login");
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) throw new Error();
      setIsWishlisted((prev) => !prev);
      toast({ title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist", variant: "success" });
    } catch {
      toast({ title: "Action failed", description: "Could not update wishlist.", variant: "destructive" });
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-elevated transition-all duration-300 hover:border-primary/40 hover:shadow-elevated-lg"
    >
      {/* Media Container */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary/50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}

        {/* Floating Discount & Featured badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <span className="rounded-full bg-destructive/95 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-xs backdrop-blur-md">
              -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Quick Wishlist Icon button */}
        <button
          onClick={handleQuickWishlist}
          disabled={loadingAction}
          aria-label="Save to wishlist"
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/85 text-foreground/80 shadow-xs backdrop-blur-md transition-transform hover:scale-110 hover:text-destructive active:scale-95"
        >
          <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-destructive text-destructive" : ""}`} />
        </button>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Brand & Deal Score row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{product.brand}</span>
            <DealScoreBadge score={product.dealScore} label={product.dealLabel} />
          </div>

          {/* Product Title */}
          <Link
            href={`/product/${product.slug}`}
            className="mt-1.5 line-clamp-2 font-display text-sm font-semibold leading-snug transition-colors hover:text-primary"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-3">
          {/* Pricing Row */}
          <div className="flex items-baseline gap-2">
            <span className="tabular-price font-mono text-lg font-bold text-foreground">
              {formatCurrency(product.currentPrice)}
            </span>
            {product.originalPrice > product.currentPrice && (
              <span className="tabular-price font-mono text-xs text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {savings > 0 && (
            <p className="mt-0.5 text-[11px] font-medium text-signal">
              Save {formatCurrency(savings)}
            </p>
          )}

          {/* Retailer Direct Outbound Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-border/50 pt-3">
            {product.amazonUrl ? (
              <a
                href={product.amazonAffiliateLink || product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
              >
                <span>Amazon</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : (
              <div />
            )}

            {product.flipkartUrl ? (
              <a
                href={product.flipkartAffiliateLink || product.flipkartUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-[11px] font-semibold text-blue-900 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
              >
                <span>Flipkart</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

