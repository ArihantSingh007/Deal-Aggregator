"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Star } from "lucide-react";
import type { ProductWithNumbers } from "@/types";

export function AdminProductTable({ products }: { products: ProductWithNumbers[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This also deletes its price history and cannot be undone.`)) return;
    setBusyId(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      toast({ title: "Product deleted" });
      router.refresh();
    } else {
      toast({ title: "Couldn't delete product", variant: "destructive" });
    }
  }

  async function toggleFeatured(id: string, isFeatured: boolean) {
    setBusyId(id);
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    });
    setBusyId(null);
    if (res.ok) {
      toast({ title: !isFeatured ? "Marked as featured" : "Removed from featured" });
      router.refresh();
    }
  }

  return (
    <div>
      <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Price</th>
              <th className="p-3">Deal score</th>
              <th className="p-3">Availability</th>
              <th className="p-3">Featured</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.brand} · {p.category?.name}</p>
                </td>
                <td className="p-3 tabular-price">{formatCurrency(p.currentPrice)}</td>
                <td className="p-3"><DealScoreBadge score={p.dealScore} label={p.dealLabel} /></td>
                <td className="p-3"><Badge variant="outline">{p.availability.replace("_", " ")}</Badge></td>
                <td className="p-3">
                  <button onClick={() => toggleFeatured(p.id, p.isFeatured)} disabled={busyId === p.id}>
                    <Star className={`h-4 w-4 ${p.isFeatured ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/admin/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id, p.name)} disabled={busyId === p.id}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
