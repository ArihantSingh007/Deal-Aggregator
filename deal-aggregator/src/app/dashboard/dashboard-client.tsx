"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { X } from "lucide-react";
import type { ProductWithNumbers } from "@/types";

interface WishlistItem {
  id: string;
  product: ProductWithNumbers;
}

interface AlertItem {
  id: string;
  targetPrice: number;
  isActive: boolean;
  product: ProductWithNumbers;
}

export function DashboardClient({ wishlistItems, alertItems }: { wishlistItems: WishlistItem[]; alertItems: AlertItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState(wishlistItems);
  const [alerts, setAlerts] = useState(alertItems);

  async function removeWishlistItem(productId: string) {
    setWishlist((w) => w.filter((item) => item.id !== productId));
    await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
    toast({ title: "Removed from wishlist" });
    router.refresh();
  }

  async function removeAlert(id: string) {
    setAlerts((a) => a.filter((item) => item.id !== id));
    await fetch(`/api/price-alerts?id=${id}`, { method: "DELETE" });
    toast({ title: "Price alert removed" });
    router.refresh();
  }

  return (
    <Tabs defaultValue="wishlist" className="mt-10">
      <TabsList className="rounded-full p-1">
        <TabsTrigger value="wishlist" className="rounded-full">Wishlist ({wishlist.length})</TabsTrigger>
        <TabsTrigger value="alerts" className="rounded-full">Price alerts ({alerts.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="wishlist">
        {wishlist.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => removeWishlistItem(item.id)}
                  className="glass-panel absolute right-3 top-3 z-10 rounded-full p-1.5 shadow-sm transition-transform hover:scale-110"
                  aria-label="Remove from wishlist"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <ProductCard product={item.product} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Your wishlist is empty. Browse deals and tap the heart icon to save products here." href="/deals" cta="Browse deals" />
        )}
      </TabsContent>

      <TabsContent value="alerts">
        {alerts.length > 0 ? (
          <div className="mt-6 flex flex-col gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card p-5 shadow-elevated">
                <div>
                  <Link href={`/product/${alert.product.slug}`} className="font-display font-semibold hover:underline">
                    {alert.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Current: <span className="tabular-price">{formatCurrency(alert.product.currentPrice)}</span> · Target:{" "}
                    <span className="tabular-price">{formatCurrency(alert.targetPrice)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={alert.product.currentPrice <= alert.targetPrice ? "signal" : "outline"}>
                    {alert.product.currentPrice <= alert.targetPrice ? "Target reached" : "Watching"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeAlert(alert.id)} className="rounded-full">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={'No price alerts yet. Open any product page and tap "Set price alert".'} href="/deals" cta="Browse deals" />
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild size="sm" className="rounded-full">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
