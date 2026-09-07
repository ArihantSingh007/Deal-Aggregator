import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/products";
import { DealFinderClient } from "@/components/admin/deal-finder-client";

export const metadata = { title: "Deal finder" };

export default async function AdminDealFinderPage() {
  const suggestions = await prisma.dealSuggestion.findMany({
    where: { status: "PENDING" },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items = suggestions.map((s) => ({
    id: s.id,
    score: s.score,
    label: s.label,
    reason: s.reason,
    priceAtSuggestion: Number(s.priceAtSuggestion),
    createdAt: s.createdAt.toISOString(),
    product: serializeProduct(s.product),
  }));

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Deal finder</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Scans price history already tracked in your catalog for products that just became a strong deal — either their
        deal score crossed 75, or their price dropped 12%+ in the last two weeks. Approve to feature them; reject to
        dismiss. Nothing here reads live Amazon or Flipkart data — see the README for wiring up an automated source.
      </p>

      <DealFinderClient initialSuggestions={items} />
    </div>
  );
}
