import { prisma } from "@/lib/prisma";
import { NewProductClient } from "./new-product-client";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Add a product</h1>
      <p className="mt-1 text-sm text-muted-foreground">Deal score is calculated automatically from the fields below.</p>
      <div className="mt-8">
        <NewProductClient categories={categories} />
      </div>
    </div>
  );
}
