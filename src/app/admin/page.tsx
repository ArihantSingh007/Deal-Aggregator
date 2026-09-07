import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshPricesButton } from "@/components/admin/refresh-prices-button";
import { Package, Star, TrendingUp, PlusCircle, History, Sparkles } from "lucide-react";

export const metadata = { title: "Admin dashboard" };

export default async function AdminPage() {
  const [productCount, featuredCount, categoryCount, avgScoreResult, pendingSuggestions] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isFeatured: true } }),
    prisma.category.count(),
    prisma.product.aggregate({ _avg: { dealScore: true } }),
    prisma.dealSuggestion.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "Products", value: productCount, icon: Package },
    { label: "Featured deals", value: featuredCount, icon: Star },
    { label: "Categories", value: categoryCount, icon: TrendingUp },
    { label: "Avg. deal score", value: Math.round(avgScoreResult._avg.dealScore || 0), icon: TrendingUp },
  ];

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage products, pricing, and featured deals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshPricesButton />
          <Button asChild variant="outline">
            <Link href="/admin/price-history"><History className="mr-1.5 h-4 w-4" /> Price history</Link>
          </Button>
          <Button asChild variant={pendingSuggestions > 0 ? "signal" : "outline"}>
            <Link href="/admin/deal-finder">
              <Sparkles className="mr-1.5 h-4 w-4" /> Deal finder
              {pendingSuggestions > 0 && (
                <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">{pendingSuggestions}</span>
              )}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new"><PlusCircle className="mr-1.5 h-4 w-4" /> Add product</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <s.icon className="h-4 w-4" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="tabular-price text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Button asChild variant="secondary">
          <Link href="/admin/products">Manage all products →</Link>
        </Button>
      </div>
    </div>
  );
}
