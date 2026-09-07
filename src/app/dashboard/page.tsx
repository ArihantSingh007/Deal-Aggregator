import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/products";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = { title: "Your Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [wishlist, alerts] = await Promise.all([
    prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.priceAlert.findMany({
      where: { userId: session.user.id },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const wishlistItems = wishlist.map((w) => ({ id: w.productId, product: serializeProduct(w.product) }));
  const alertItems = alerts.map((a) => ({
    id: a.id,
    targetPrice: Number(a.targetPrice),
    isActive: a.isActive,
    product: serializeProduct(a.product),
  }));

  return (
    <div className="container py-14 md:py-16">
      <h1 className="headline text-4xl md:text-5xl">Your dashboard</h1>
      <p className="mt-2 text-base text-muted-foreground">Welcome back, {session.user.name || session.user.email}.</p>

      <DashboardClient wishlistItems={wishlistItems} alertItems={alertItems} />
    </div>
  );
}
