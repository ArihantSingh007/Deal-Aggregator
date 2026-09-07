import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Deliberately NOT wrapped in the apiSuccess/apiError envelope used elsewhere —
// uptime monitors (Render health checks, UptimeRobot, etc.) generally just
// check the HTTP status code, so this stays a minimal, dependency-free response.
// Checks the database specifically (not just "is the process alive"), since a
// DB outage or exhausted connection pool is the most common real failure mode
// for this stack — a process that's "up" but can't reach Postgres is not
// actually healthy.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: "Database unreachable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
