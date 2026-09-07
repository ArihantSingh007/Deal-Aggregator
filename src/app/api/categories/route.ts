import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";
import { apiSuccess, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { categoryCreateSchema } from "@/lib/validation/schemas";

export const GET = withErrorHandling(async () => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return apiSuccess(categories);
});

export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const parsed = categoryCreateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);

  const category = await prisma.category.create({
    data: { name: parsed.data.name, slug: slugify(parsed.data.name), icon: parsed.data.icon },
  });
  return apiSuccess(category, 201);
});
