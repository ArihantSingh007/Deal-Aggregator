import "next-auth";

// Extend NextAuth's built-in types so `session.user.role` and `.id` are typed.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: "USER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
  }
}

// Plain-object product shape used across client components (Decimal fields from
// Prisma are serialized to numbers before being passed to the client).
export interface ProductWithNumbers {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  description: string;
  images: string[];
  amazonUrl: string | null;
  flipkartUrl: string | null;
  amazonAffiliateLink: string | null;
  flipkartAffiliateLink: string | null;
  currentPrice: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  availability: "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED_STOCK";
  dealScore: number;
  dealLabel: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryPoint {
  id: string;
  price: number;
  platform: "AMAZON" | "FLIPKART";
  timestamp: string;
}
