"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { ScrapedProductData } from "@/lib/scrapers/types";

interface ImportFromUrlProps {
  onImported: (data: ScrapedProductData & { platform: "AMAZON" | "FLIPKART" }) => void;
}

export function ImportFromUrl({ onImported }: ImportFromUrlProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");

      onImported({ ...json.data.product, platform: json.data.platform });
      toast({ title: "Product details imported", description: "Review the fields below, then pick a category and save." });
    } catch (err) {
      toast({ title: "Couldn't import from this URL", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2 border-signal/30 bg-signal/5 shadow-none">
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-signal" />
          <h3 className="font-display font-semibold">Import from Amazon or Flipkart</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Paste a product URL to pull the name, price, rating, and images automatically via the official APIs. You'll
          still pick a category and confirm everything before saving.
        </p>
        <form onSubmit={handleImport} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.in/dp/... or https://www.flipkart.com/...&pid=..."
            required
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {loading ? "Importing…" : "Fetch details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
