import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Every API route in this app returns one of these two shapes, so client code
 * never has to guess whether a field is at the top level or nested:
 *   success: { success: true, data: T }
 *   failure: { success: false, error: string, fieldErrors?: Record<string, string[]> }
 */

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Converts a Zod validation failure into a 400 response with per-field error messages. */
export function apiValidationError(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return NextResponse.json(
    { success: false, error: "Validation failed", fieldErrors },
    { status: 400 }
  );
}

/**
 * Wraps a route handler so any unexpected thrown error becomes a clean 500
 * JSON response instead of a raw Next.js error page — keeps error shape
 * consistent even for bugs we didn't anticipate.
 *
 * The real error is always logged server-side. It's only sent to the client
 * outside of production — in production an unhandled error (most commonly a
 * Prisma constraint violation) could otherwise leak internal details like
 * table/column names, which is unnecessary information to hand an attacker
 * probing the API. Expected, "nice" error messages should go through
 * apiError()/apiValidationError() instead, which are unaffected by this.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("Unhandled API error:", err);
      const rawMessage = err instanceof Error ? err.message : "Something went wrong.";
      const message = process.env.NODE_ENV === "production" ? "Something went wrong. Please try again." : rawMessage;
      return apiError(message, 500);
    }
  };
}
