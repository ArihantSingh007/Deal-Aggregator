import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { categoryCreateSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return apiSuccess(categories);
});

export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;

  const parsed = categoryCreateSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);

  const slug = slugify(parsed.data.name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
  });
  if (existing) {
    return apiError("A category with this name already exists.", 409);
  }

  const category = await prisma.category.create({
    data: { name: parsed.data.name, slug, icon: parsed.data.icon },
  });
  return apiSuccess(category, 201);
});
