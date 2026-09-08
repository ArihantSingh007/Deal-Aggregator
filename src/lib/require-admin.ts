import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Guard used at the top of admin-only API routes. Returns a session on success, or a Response to return immediately. Supports CRON_SECRET for automated scheduled runs. */
export async function requireAdmin(request?: Request) {
  if (request && process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
      return { session: { user: { id: "cron", role: "ADMIN" as const } } };
    }
  }

  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }) };
  return { session };
}
