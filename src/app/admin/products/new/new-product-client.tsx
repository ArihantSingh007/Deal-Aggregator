"use client";
import { useState } from "react";
import { ImportFromUrl } from "@/components/admin/import-from-url";
import { ProductForm } from "@/components/admin/product-form";
import type { ScrapedProductData } from "@/lib/scrapers/types";

interface Category {
  id: string;
  name: string;
}

export function NewProductClient({ categories }: { categories: Category[] }) {
  const [prefill, setPrefill] = useState<ReturnType<typeof buildPrefill> | null>(null);

  function buildPrefill(data: ScrapedProductData & { platform: "AMAZON" | "FLIPKART" }) {
    return {
      name: data.name,
      brand: data.brand,
      description: data.name, // APIs don't reliably return a long description; admin can expand this
      images: data.images,
      currentPrice: data.price,
      originalPrice: data.originalPrice ?? data.price,
      rating: data.rating,
      reviewCount: data.reviewCount,
      amazonUrl: data.platform === "AMAZON" ? data.sourceUrl : undefined,
      flipkartUrl: data.platform === "FLIPKART" ? data.sourceUrl : undefined,
    };
  }

  return (
    <div className="space-y-6">
      <ImportFromUrl onImported={(data) => setPrefill(buildPrefill(data))} />
      <ProductForm categories={categories} prefill={prefill} />
    </div>
  );
}
