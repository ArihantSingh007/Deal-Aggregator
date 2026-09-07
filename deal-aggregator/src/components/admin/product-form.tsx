"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { useToast } from "@/components/ui/use-toast";
import type { ProductWithNumbers } from "@/types";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  initialProduct?: ProductWithNumbers;
  prefill?: Partial<{
    name: string;
    brand: string;
    description: string;
    images: string[];
    currentPrice: number;
    originalPrice: number;
    rating: number;
    reviewCount: number;
    amazonUrl: string;
    flipkartUrl: string;
  }> | null;
}

const emptyForm = {
  name: "",
  brand: "",
  categoryId: "",
  description: "",
  images: "",
  amazonUrl: "",
  flipkartUrl: "",
  amazonAffiliateLink: "",
  flipkartAffiliateLink: "",
  currentPrice: "",
  originalPrice: "",
  rating: "0",
  reviewCount: "0",
  availability: "IN_STOCK",
  isFeatured: false,
};

export function ProductForm({ categories, initialProduct, prefill }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!initialProduct;

  const [form, setForm] = useState(() =>
    initialProduct
      ? {
          name: initialProduct.name,
          brand: initialProduct.brand,
          categoryId: initialProduct.categoryId,
          description: initialProduct.description,
          images: initialProduct.images.join("\n"),
          amazonUrl: initialProduct.amazonUrl ?? "",
          flipkartUrl: initialProduct.flipkartUrl ?? "",
          amazonAffiliateLink: initialProduct.amazonAffiliateLink ?? "",
          flipkartAffiliateLink: initialProduct.flipkartAffiliateLink ?? "",
          currentPrice: String(initialProduct.currentPrice),
          originalPrice: String(initialProduct.originalPrice),
          rating: String(initialProduct.rating),
          reviewCount: String(initialProduct.reviewCount),
          availability: initialProduct.availability,
          isFeatured: initialProduct.isFeatured,
        }
      : emptyForm
  );
  const [preview, setPreview] = useState<{ score: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // When the admin imports a product from a URL, merge whatever fields Amazon/Flipkart
  // returned into the form — the admin still reviews everything (category especially,
  // since neither API maps cleanly to our own category list) before saving.
  useEffect(() => {
    if (!prefill || isEditing) return;
    setForm((f) => ({
      ...f,
      name: prefill.name ?? f.name,
      brand: prefill.brand ?? f.brand,
      description: prefill.description ?? f.description,
      images: prefill.images?.length ? prefill.images.join("\n") : f.images,
      currentPrice: prefill.currentPrice != null ? String(prefill.currentPrice) : f.currentPrice,
      originalPrice: prefill.originalPrice != null ? String(prefill.originalPrice) : f.originalPrice,
      rating: prefill.rating != null ? String(prefill.rating) : f.rating,
      reviewCount: prefill.reviewCount != null ? String(prefill.reviewCount) : f.reviewCount,
      amazonUrl: prefill.amazonUrl ?? f.amazonUrl,
      flipkartUrl: prefill.flipkartUrl ?? f.flipkartUrl,
    }));
  }, [prefill, isEditing]);

  // Live deal-score preview, debounced, as the admin edits price/rating/availability.
  useEffect(() => {
    if (!form.currentPrice || !form.originalPrice) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/deal-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPrice: form.currentPrice,
            originalPrice: form.originalPrice,
            rating: form.rating,
            reviewCount: form.reviewCount,
            availability: form.availability,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setPreview(json.data);
        }
      } catch {
        // Preview is best-effort; ignore failures.
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.currentPrice, form.originalPrice, form.rating, form.reviewCount, form.availability]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      currentPrice: Number(form.currentPrice),
      originalPrice: Number(form.originalPrice),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
    };

    try {
      const res = await fetch(isEditing ? `/api/products/${initialProduct!.id}` : "/api/products", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        if (json.fieldErrors) {
          const firstField = Object.keys(json.fieldErrors)[0];
          const firstMessage = json.fieldErrors[firstField]?.[0];
          throw new Error(firstMessage ? `${firstField}: ${firstMessage}` : "Please check the highlighted fields.");
        }
        throw new Error(json.error || "Save failed");
      }

      toast({ title: isEditing ? "Product updated" : "Product created" });
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't save product", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product name</Label>
                <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" required value={form.brand} onChange={(e) => update("brand", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Image URLs (one per line)</Label>
              <Textarea id="images" rows={3} value={form.images} onChange={(e) => update("images", e.target.value)} placeholder="https://…" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-display font-semibold">Retailer links</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amazonUrl">Amazon URL</Label>
                <Input id="amazonUrl" value={form.amazonUrl} onChange={(e) => update("amazonUrl", e.target.value)} placeholder="https://amazon.in/…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amazonAffiliateLink">Amazon affiliate link</Label>
                <Input id="amazonAffiliateLink" value={form.amazonAffiliateLink} onChange={(e) => update("amazonAffiliateLink", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flipkartUrl">Flipkart URL</Label>
                <Input id="flipkartUrl" value={form.flipkartUrl} onChange={(e) => update("flipkartUrl", e.target.value)} placeholder="https://flipkart.com/…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flipkartAffiliateLink">Flipkart affiliate link</Label>
                <Input id="flipkartAffiliateLink" value={form.flipkartAffiliateLink} onChange={(e) => update("flipkartAffiliateLink", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-display font-semibold">Pricing</h3>
            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current price</Label>
              <Input id="currentPrice" type="number" required value={form.currentPrice} onChange={(e) => update("currentPrice", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original (list) price</Label>
              <Input id="originalPrice" type="number" required value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} />
            </div>

            {preview && (
              <div className="rounded-md border p-3">
                <p className="mb-1 text-xs text-muted-foreground">Live deal score preview</p>
                <DealScoreBadge score={preview.score} label={preview.label} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-display font-semibold">Reputation & availability</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input id="rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => update("rating", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewCount">Review count</Label>
                <Input id="reviewCount" type="number" min={0} value={form.reviewCount} onChange={(e) => update("reviewCount", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select value={form.availability} onValueChange={(v) => update("availability", v)}>
                <SelectTrigger id="availability"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STOCK">In stock</SelectItem>
                  <SelectItem value="LIMITED_STOCK">Limited stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} className="h-4 w-4 rounded border-input" />
              Mark as featured deal
            </label>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
