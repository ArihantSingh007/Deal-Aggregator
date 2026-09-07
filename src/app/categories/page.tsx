import type { Metadata } from "next";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Package, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse deals by category: smartphones, laptops, gaming, electronics, accessories, and home appliances.",
};

function toPascalCase(s: string) {
  return s.replace(/(^\w|-\w)/g, (c) => c.replace("-", "").toUpperCase());
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="container py-14 md:py-16">
      <h1 className="headline text-4xl md:text-5xl">Categories</h1>
      <p className="mt-2 text-base text-muted-foreground">Browse tracked deals by product type.</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const Icon = (c.icon && (Icons as any)[toPascalCase(c.icon)]) || Package;
          return (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group flex items-center gap-4 rounded-2xl bg-card p-5 shadow-elevated transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c._count.products} products</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
