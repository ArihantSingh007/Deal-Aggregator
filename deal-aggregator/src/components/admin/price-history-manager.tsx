"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { PriceHistoryPoint } from "@/types";

export function PriceHistoryManager({ productId, history }: { productId: string; history: PriceHistoryPoint[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState<"AMAZON" | "FLIPKART">("AMAZON");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/price-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price: Number(price), platform, timestamp: date }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Price history entry added" });
      setPrice("");
      router.refresh();
    } catch {
      toast({ title: "Couldn't add entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this price history entry?")) return;
    await fetch(`/api/price-history/${id}`, { method: "DELETE" });
    toast({ title: "Entry deleted" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="pt-6">
          <h3 className="mb-4 font-display font-semibold">Add historical price</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hist-price">Price</Label>
              <Input id="hist-price" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hist-platform">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as "AMAZON" | "FLIPKART")}>
                <SelectTrigger id="hist-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMAZON">Amazon</SelectItem>
                  <SelectItem value="FLIPKART">Flipkart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hist-date">Date</Label>
              <Input id="hist-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Adding…" : "Add entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="p-3">{formatDate(h.timestamp)}</td>
                  <td className="p-3">{h.platform}</td>
                  <td className="p-3 tabular-price">{formatCurrency(h.price)}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(h.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No price history yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
