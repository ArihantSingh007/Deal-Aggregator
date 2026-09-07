import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeProduct, serializePriceHistory } from "@/lib/products";
import { ProductForm } from "@/components/admin/product-form";
import { PriceHistoryManager } from "@/components/admin/price-history-manager";

export const metadata = { title: "Edit product" };

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { category: true, priceHistory: { orderBy: { timestamp: "desc" } } } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Edit {product.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Deal score recalculates automatically whenever you save.</p>

      <div className="mt-8">
        <ProductForm categories={categories} initialProduct={serializeProduct(product)} />
      </div>

      <div className="mt-12" id="price-history">
        <h2 className="mb-4 font-display text-xl font-bold">Price history</h2>
        <PriceHistoryManager productId={product.id} history={serializePriceHistory(product.priceHistory)} />
      </div>
    </div>
  );
}
