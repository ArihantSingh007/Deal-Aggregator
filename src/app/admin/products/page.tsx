import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { AdminProductTable } from "./product-table";
import { PlusCircle } from "lucide-react";

export const metadata = { title: "Manage products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Manage products</h1>
        <Button asChild>
          <Link href="/admin/products/new"><PlusCircle className="mr-1.5 h-4 w-4" /> Add product</Link>
        </Button>
      </div>

      <div className="mt-8">
        <AdminProductTable products={products.map(serializeProduct)} />
      </div>
    </div>
  );
}
