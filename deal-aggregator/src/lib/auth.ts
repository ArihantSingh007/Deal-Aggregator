import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit, getClientIpFromPlainHeaders } from "@/lib/rate-limit";

// Central NextAuth configuration, shared by the API route handler and any
// server-side `getServerSession(authOptions)` calls used for role checks.
//
// We use JWT sessions with no database adapter, so Google sign-ins don't get a
// row created for them automatically the way an adapter would. Instead, the
// `signIn` callback upserts a User row on first Google sign-in, and the `jwt`
// callback looks that row up to attach our own `id`/`role` (not Google's) to
// the token. Credentials sign-ins already return `id`/`role` from `authorize`,
// so they skip that lookup.
const providers: AuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null;

      // Rate-limited by IP (not by the submitted email) so an attacker can't
      // dodge the limit by trying many emails against one password, or lock a
      // real user out by hammering their specific address from elsewhere.
      const ip = getClientIpFromPlainHeaders(req?.headers as Record<string, string | string[] | undefined> | undefined);
      const rateLimit = await checkLoginRateLimit(ip);
      if (!rateLimit.success) {
        throw new Error("Too many sign-in attempts. Please wait a few minutes and try again.");
      }

      const user = await prisma.user.findUnique({ where: { email: credentials.email } });

      // Always run a bcrypt comparison, even when no such user exists —
      // otherwise this function returns near-instantly for unknown emails but
      // takes bcrypt's deliberately-slow ~100-250ms for known ones, letting an
      // attacker figure out which emails are registered just by timing
      // responses. Comparing against a fixed dummy hash equalizes that.
      const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8tGyDbULzsRQY1cLXbdMc7WGevW9G6";
      const isValid = await bcrypt.compare(credentials.password, user?.passwordHash ?? DUMMY_HASH);

      if (!user || !user.passwordHash || !isValid) return null;

      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
  }),
];

// Only register Google if credentials are actually configured, so local dev
// without a Google Cloud project doesn't crash on startup — the "Continue
// with Google" button just won't render (see login page).
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false; // shouldn't happen, but Google always grants an email scope

        // First time we've seen this Google account: create a matching User row.
        // Every self-service signup (credentials or Google) gets USER; promote to
        // ADMIN manually via `npm run db:studio`.
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: { email: user.email, name: user.name, image: user.image, role: "USER" },
        });
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } else {
          token.id = user.id;
          token.role = (user as { role: "USER" | "ADMIN" }).role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
