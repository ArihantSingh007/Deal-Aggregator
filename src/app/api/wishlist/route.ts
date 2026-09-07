import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { wishlistCreateSchema } from "@/lib/validation/schemas";

export const GET = withErrorHandling(async () => {
  const session = await getServerSession(authOptions);
  if (!session) return apiError("Unauthorized", 401);

  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(items);
});

export const POST = withErrorHandling(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) return apiError("Unauthorized", 401);

  const parsed = wishlistCreateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return apiError("That product doesn't exist.", 400);

  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId: session.user.id, productId: parsed.data.productId } },
    create: { userId: session.user.id, productId: parsed.data.productId },
    update: {},
  });
  return apiSuccess(item, 201);
});

export const DELETE = withErrorHandling(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return apiError("productId is required", 400);

  await prisma.wishlist.delete({ where: { userId_productId: { userId: session.user.id, productId } } }).catch(() => null);
  return apiSuccess({ deleted: true });
});
