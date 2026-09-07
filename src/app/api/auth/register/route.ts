import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiValidationError, withErrorHandling } from "@/lib/api-response";
import { registerSchema } from "@/lib/validation/schemas";
import { checkRegisterRateLimit, getClientIp } from "@/lib/rate-limit";

export const POST = withErrorHandling(async (request: Request) => {
  const ip = getClientIp(request);
  const rateLimit = await checkRegisterRateLimit(ip);
  if (!rateLimit.success) {
    return apiError("Too many accounts created from this network recently. Please try again later.", 429);
  }

  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return apiValidationError(parsed.error);
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return apiError("An account with this email already exists.", 409);

  // 12 rounds is a reasonable 2026 baseline for bcrypt — enough to stay slow
  // against offline cracking attempts if the password hash table ever leaks,
  // without meaningfully slowing down real signups (~150-250ms).
  const passwordHash = await bcrypt.hash(password, 12);
  // Every self-registered account gets the USER role. Promote to ADMIN manually
  // via Prisma Studio (`npm run db:studio`) or a direct SQL update.
  const user = await prisma.user.create({ data: { email, name, passwordHash, role: "USER" } });

  return apiSuccess({ id: user.id, email: user.email }, 201);
});
