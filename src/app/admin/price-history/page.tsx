import { prisma } from "@/lib/prisma";
import { ProductPicker } from "@/components/admin/product-picker";

export const metadata = { title: "Price history" };

export default async function AdminPriceHistoryPage() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, brand: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Price history</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a product to add, edit, or delete its historical price entries.
      </p>

      <div className="mt-8">
        <ProductPicker products={products} />
      </div>
    </div>
  );
}
