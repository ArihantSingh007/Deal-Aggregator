/**
 * Runs once when the Next.js server process starts (both `next dev` and a
 * deployed production server) — the correct place for startup checks, as
 * opposed to a top-level check in some imported module, which could run
 * during `next build`'s static analysis before real env vars are even wired
 * up on your hosting platform.
 *
 * This deliberately only warns (via console.error) rather than throwing/
 * exiting the process: a hard crash on a missing *optional* var would take
 * down the whole app for something that might be fine, and on some platforms
 * a crash-on-boot can trigger an unhelpful restart loop. Required vars still
 * get a loud, impossible-to-miss error so a misconfigured deploy is obvious
 * in the logs immediately instead of surfacing as a cryptic Prisma or
 * NextAuth error on the first request.
 */
export async function register() {
  // Only run this in the Node.js runtime (not the edge runtime, which also
  // calls register() and doesn't have access to the same process.env shape
  // in all deployment targets).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const missing: string[] = [];
  const warnings: string[] = [];

  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");

  if (!process.env.NEXTAUTH_SECRET) {
    missing.push("NEXTAUTH_SECRET");
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push("NEXTAUTH_SECRET is shorter than 32 characters — generate a longer one with: openssl rand -base64 32");
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXTAUTH_URL) {
      warnings.push("NEXTAUTH_URL is not set — required in production for correct OAuth callback URLs and secure cookies.");
    } else if (!process.env.NEXTAUTH_URL.startsWith("https://")) {
      warnings.push(`NEXTAUTH_URL is "${process.env.NEXTAUTH_URL}" — should be an https:// URL in production.`);
    }

    if (!process.env.UPSTASH_REDIS_REST_URL) {
      warnings.push("UPSTASH_REDIS_REST_URL/TOKEN not set — login and registration endpoints have no rate limiting. See DEPLOYMENT.md.");
    }
  }

  if (missing.length > 0) {
    console.error(
      "\n🚨 Missing required environment variables: " +
        missing.join(", ") +
        "\n   The app will not function correctly until these are set. See .env.example.\n"
    );
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  Configuration warnings:\n" + warnings.map((w) => `   - ${w}`).join("\n") + "\n");
  }
}
