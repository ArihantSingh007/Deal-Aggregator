import { requireAdmin } from "@/lib/require-admin";
import { detectPlatform, getDataSource } from "@/lib/scrapers";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { importProductSchema } from "@/lib/validation/schemas";

/**
 * Fetches live product data (name, brand, price, rating, images) from Amazon's
 * PA-API or Flipkart's Affiliate API for the given URL. This never saves
 * anything — it just returns data for the admin "Add product" form to prefill,
 * so the admin still reviews and confirms before it's saved.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const parsed = importProductSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);

  const platform = detectPlatform(parsed.data.url);
  if (!platform) return apiError("This doesn't look like an Amazon or Flipkart URL.", 400);

  try {
    const dataSource = getDataSource(platform);
    const product = await dataSource.fetchProduct(parsed.data.url);
    return apiSuccess({ platform, product });
  } catch (err) {
    return apiError((err as Error).message, 502);
  }
});
