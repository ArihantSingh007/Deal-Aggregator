import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { priceAlertCreateSchema } from "@/lib/validation/schemas";

export const GET = withErrorHandling(async () => {
  const session = await getServerSession(authOptions);
  if (!session) return apiError("Unauthorized", 401);

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(alerts);
});

export const POST = withErrorHandling(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) return apiError("Unauthorized", 401);

  const parsed = priceAlertCreateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return apiError("That product doesn't exist.", 400);

  // Update the existing active alert for this product instead of creating a
  // duplicate row every time — without this, clicking "Set price alert"
  // twice (or a network retry) for the same product silently piles up
  // redundant rows instead of just changing the target price.
  const existing = await prisma.priceAlert.findFirst({
    where: { userId: session.user.id, productId: parsed.data.productId, isActive: true },
  });

  const alert = existing
    ? await prisma.priceAlert.update({ where: { id: existing.id }, data: { targetPrice: parsed.data.targetPrice } })
    : await prisma.priceAlert.create({
        data: { userId: session.user.id, productId: parsed.data.productId, targetPrice: parsed.data.targetPrice, isActive: true },
      });

  return apiSuccess(alert, existing ? 200 : 201);
});

export const DELETE = withErrorHandling(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return apiError("id is required", 400);

  await prisma.priceAlert.deleteMany({ where: { id, userId: session.user.id } });
  return apiSuccess({ deleted: true });
});
